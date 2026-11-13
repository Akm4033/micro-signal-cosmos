import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';

async function audit(url, name) {
  console.log(`Starting Lighthouse audit for ${name} (${url})...`);
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  });

  try {
    const result = await lighthouse(url, {
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

    const lhr = result.lhr;
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100)
    };

    console.log(`\n=== LIGHTHOUSE SCORES FOR ${name} (${url}) ===`);
    console.log(`Performance:    ${scores.performance}`);
    console.log(`Accessibility:  ${scores.accessibility}`);
    console.log(`Best Practices: ${scores.bestPractices}`);
    console.log(`SEO:            ${scores.seo}`);

    // If Best Practices < 95, list failing audits
    if (scores.bestPractices < 95) {
      console.log('\n--- Failing Best Practices Audits ---');
      const bpAuditRefs = lhr.categories['best-practices'].auditRefs;
      for (const ref of bpAuditRefs) {
        const a = lhr.audits[ref.id];
        if (a && a.score !== null && a.score < 1) {
          console.log(`[${ref.id}] Score: ${a.score} - ${a.title} (${a.displayValue || ''})`);
          if (a.explanation) console.log(`  Explanation: ${a.explanation}`);
        }
      }
    }

    return scores;
  } finally {
    await chrome.kill();
  }
}

async function run() {
  const home = await audit('https://signal-insight.pages.dev/', 'HOMEPAGE');
  const article = await audit('https://signal-insight.pages.dev/articles/how-llms-actually-work/', 'ARTICLE (how-llms-actually-work)');
  
  fs.writeFileSync('scratch-live-lighthouse.json', JSON.stringify({ home, article }, null, 2));
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

