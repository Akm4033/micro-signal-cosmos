import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve('public/og');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function wrapText(text, maxCharsPerLine = 34) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // Max 3 lines
}

async function generateCard({ title, category, subtitle, filename }) {
  const lines = wrapText(title, 34);
  const textElements = lines.map((line, idx) => {
    const y = 260 + (idx * 58);
    return `<text x="80" y="${y}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF">${escapeXml(line)}</text>`;
  }).join('\n    ');

  const categoryTag = category ? escapeXml(category.toUpperCase()) : 'TECHNICAL ARCHITECTURE';
  const subtitleText = subtitle ? escapeXml(subtitle) : 'Signal Insight · Deep Technical Guides for Engineers';

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#05070E"/>
  
  <!-- Subtle Grid Accent -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
    <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Top Blue Accent Bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#blueGlow)"/>

  <!-- Brand Emblem & Wordmark (Top Left) -->
  <g transform="translate(80, 70)">
    <rect width="44" height="44" rx="10" fill="#2563EB"/>
    <circle cx="22" cy="22" r="14" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.4" fill="none"/>
    <path d="M 28 14 A 12 12 0 1 0 28 30" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <circle cx="22" cy="22" r="3" fill="#FFFFFF"/>
    
    <text x="58" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" letter-spacing="-0.5">Signal Insight</text>
    <text x="58" y="40" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1.5">OPEN RESEARCH &amp; SYSTEMS</text>
  </g>

  <!-- Category Pill Badge -->
  <g transform="translate(80, 160)">
    <rect width="260" height="34" rx="17" fill="rgba(37,99,235,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="1.5"/>
    <circle cx="20" cy="17" r="4" fill="#38BDF8"/>
    <text x="34" y="22" font-family="ui-monospace, monospace" font-size="12" font-weight="700" fill="#38BDF8" letter-spacing="1">${categoryTag}</text>
  </g>

  <!-- Title Lines -->
  ${textElements}

  <!-- Footer Tagline & Rule -->
  <line x1="80" y1="520" x2="1120" y2="520" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <text x="80" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#94A3B8">${subtitleText}</text>
  <text x="1120" y="560" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="#38BDF8" text-anchor="end">signal-insight.pages.dev</text>
</svg>`;

  const dest = path.join(outputDir, filename);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(dest);
  console.log(`Generated: ${filename}`);
}

async function main() {
  // 1. Generate default.png
  await generateCard({
    title: 'Signal Insight',
    category: 'DEEP TECHNICAL GUIDES',
    subtitle: 'Deep technical guides for engineers who want to understand how things actually work.',
    filename: 'default.png'
  });

  // 2. Generate per-article pngs
  const articlesDir = path.resolve('src/content/articles');
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    for (const file of files) {
      const slug = file.replace(/\.mdx?$/, '');
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      
      const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
      const categoryMatch = content.match(/^category:\s*["']?(.*?)["']?$/m);
      const title = titleMatch ? titleMatch[1].replace(/\\/g, '') : slug.replace(/-/g, ' ');
      const category = categoryMatch ? categoryMatch[1] : 'SYSTEMS';

      await generateCard({
        title,
        category,
        subtitle: 'Signal Insight · Runnable code, primary citations & system diagrams',
        filename: `${slug}.png`
      });
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

