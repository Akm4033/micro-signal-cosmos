import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2'
};

function createStaticServer(distDir) {
  return http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function run() {
  const distDir = path.resolve('dist');
  const server = createStaticServer(distDir);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}/`;
  console.log(`Static server running at ${targetUrl}`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  });
  console.log(`Chrome launched on port ${chrome.port}`);

  try {
    const runnerResult = await lighthouse(targetUrl, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        disabled: false
      },
      throttlingMethod: 'provided'
    });

    const categories = runnerResult.lhr.categories;
    const scores = {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100)
    };

    console.log('\n--- LIGHTHOUSE MOBILE AUDIT (HOMEPAGE) ---');
    console.log(`Performance:    ${scores.performance}`);
    console.log(`Accessibility:  ${scores.accessibility}`);
    console.log(`Best Practices: ${scores.bestPractices}`);
    console.log(`SEO:            ${scores.seo}`);
    console.log('-------------------------------------------\n');

    // Save summary report
    fs.writeFileSync('scratch-lighthouse.json', JSON.stringify(scores, null, 2));
  } finally {
    await chrome.kill();
    server.close();
  }
}

run().catch((err) => {
  console.error('Lighthouse audit failed:', err);
  process.exit(1);
});
