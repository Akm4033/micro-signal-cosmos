import { spawn, execSync } from 'child_process';
import path from 'path';

const serverProcess = spawn('node', ['scripts/local-server.mjs'], {
  stdio: ['ignore', 'pipe', 'inherit']
});

serverProcess.stdout.on('data', (data) => {
  const msg = data.toString();
  console.log(msg.trim());
  if (msg.includes('Serving dist on http://localhost:4173')) {
    runAudits();
  }
});

function runAudits() {
  const chromedriver = path.resolve('chromedriver/win64-157.0.8103.78/chromedriver-win64/chromedriver.exe');

  console.log('\n========================================');
  console.log('RUNNING AXE AUDIT: HOMEPAGE');
  console.log('========================================');
  try {
    const outHome = execSync(
      `npx @axe-core/cli http://localhost:4173/ --chromedriver-path="${chromedriver}" --save="axe-local-home-fixed.json" --exit`,
      { encoding: 'utf8' }
    );
    console.log(outHome);
  } catch (err) {
    console.log(err.stdout || err.message);
  }

  console.log('\n========================================');
  console.log('RUNNING AXE AUDIT: ARTICLE');
  console.log('========================================');
  try {
    const outArticle = execSync(
      `npx @axe-core/cli http://localhost:4173/articles/how-llms-actually-work/ --chromedriver-path="${chromedriver}" --save="axe-local-article-fixed.json" --exit`,
      { encoding: 'utf8' }
    );
    console.log(outArticle);
  } catch (err) {
    console.log(err.stdout || err.message);
  }

  console.log('Stopping server...');
  serverProcess.kill();
  process.exit(0);
}
