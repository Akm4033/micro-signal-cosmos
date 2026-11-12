/**
 * Signal Insight — SeoAgent
 * Discovers semantic cross-links, matches compliant affiliate partners,
 * synthesizes SERP metadata, and generates branded 1200x630 Open Graph SVG cover assets.
 */

const fs = require('fs');
const path = require('path');
const { recordAgentRun } = require('../db.cjs');

const CROSS_LINKS_FILE = path.join(__dirname, '..', '..', 'src', 'content', 'config', 'cross-links.yml');
const AFFILIATE_FILE = path.join(__dirname, '..', '..', 'src', 'content', 'config', 'affiliate-map.json');
const OG_DIR = path.join(__dirname, '..', '..', 'public', 'og');

const CATEGORY_COLORS = {
  technology: '#0ea5e9',
  'artificial-intelligence': '#10b981',
  science: '#8b5cf6',
  'developer-tools': '#f59e0b'
};

const CATEGORY_NAMES = {
  technology: 'TECHNOLOGY',
  'artificial-intelligence': 'ARTIFICIAL INTELLIGENCE',
  science: 'SCIENCE',
  'developer-tools': 'DEVELOPER TOOLS'
};

/**
 * Generate a branded 1200x630 vector SVG Open Graph banner
 */
function generateOgSvg({ slug, title, category, readingTime = '10 min read', authorName = 'Signal Insight Engineering' }) {
  const cat = (category || 'technology').toLowerCase();
  const accentColor = CATEGORY_COLORS[cat] || '#0ea5e9';
  const catLabel = CATEGORY_NAMES[cat] || 'TECHNOLOGY';

  // Split title into 2 lines if needed
  const words = title.split(' ');
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= 36 && !line2) {
      line1 += (line1 ? ' ' : '') + w;
    } else {
      line2 += (line2 ? ' ' : '') + w;
    }
  }

  // XML escape
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0a0f1a" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" stroke-width="1" stroke-opacity="0.6" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0a0f1a" />
  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glow)" />

  <!-- Accent top border -->
  <rect x="0" y="0" width="1200" height="6" fill="${accentColor}" />

  <!-- Category Badge -->
  <g transform="translate(80, 160)">
    <rect width="240" height="38" rx="19" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="1.5" />
    <circle cx="22" cy="19" r="4.5" fill="${accentColor}" />
    <text x="36" y="24" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="700" fill="${accentColor}" letter-spacing="0.12em">${catLabel}</text>
  </g>

  <!-- Title -->
  <g>
    <text x="80" y="280" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" letter-spacing="-0.02em">${esc(line1)}</text>
    ${line2 ? `<text x="80" y="336" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" letter-spacing="-0.02em">${esc(line2)}</text>` : ''}
  </g>

  <!-- Metadata Footer Bar -->
  <line x1="80" y1="490" x2="1120" y2="490" stroke="#1f2937" stroke-width="1.5" />

  <g transform="translate(80, 545)">
    <!-- Brand / Tagline -->
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">SIGNAL <tspan fill="${accentColor}">INSIGHT</tspan></text>
    <text x="0" y="24" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" fill="#9ca3af" letter-spacing="0.15em">UNDERSTAND THE WORLD. EXPLORE BEYOND IT.</text>

    <!-- Author & Reading time -->
    <text x="1040" y="0" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="#f3f4f6">${esc(authorName)}</text>
    <text x="1040" y="24" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500" fill="#9ca3af">${esc(readingTime)}</text>
  </g>
</svg>`;

  if (!fs.existsSync(OG_DIR)) {
    fs.mkdirSync(OG_DIR, { recursive: true });
  }

  const targetPath = path.join(OG_DIR, `${slug}.svg`);
  fs.writeFileSync(targetPath, svgContent, 'utf8');

  return {
    filePath: targetPath,
    publicUrl: `/og/${slug}.svg`
  };
}

/**
 * Run SeoAgent
 */
async function runSeoAgent({ slug, title, content, category = 'technology', author = 'marina', readingTime = '10 min read', jobId = null }) {
  const startTime = Date.now();
  const lowerContent = (content || '').toLowerCase();

  // 1. Generate Open Graph SVG Banner
  const ogResult = generateOgSvg({
    slug,
    title,
    category,
    readingTime,
    authorName: author === 'kai' ? 'Kai Nakamura' : author === 'arun' ? 'Dr. Arun Mehta' : author === 'marina' ? 'Dr. Marina Kowalski' : 'Signal Insight Editorial Desk'
  });

  // 2. Discover Cross-Links from cross-links.yml
  const recommendedCrossLinks = [];
  const knownArticles = [
    { slug: 'how-browsers-actually-render-a-page', keywords: ['browser', 'dom', 'cssom', 'render tree', 'composite'] },
    { slug: 'inside-the-modern-cpu', keywords: ['cpu', 'branch predictor', 'l1 cache', 'superscalar', 'instruction pipeline'] },
    { slug: 'webassembly-in-2026', keywords: ['webassembly', 'wasm', 'wasi', 'near-native'] },
    { slug: 'choosing-a-database-in-2026', keywords: ['postgres', 'b-tree', 'lsm-tree', 'acid', 'oltp', 'database'] },
    { slug: 'https-deep-dive', keywords: ['tls 1.3', 'handshake', 'cryptography', 'cipher suite', 'x.509'] },
    { slug: 'passkeys-passwordless-auth', keywords: ['passkeys', 'fido2', 'webauthn', 'public key credential'] },
    { slug: 'how-llms-actually-work', keywords: ['transformer', 'self-attention', 'kv cache', 'feed forward'] },
    { slug: 'build-your-own-rag-from-scratch', keywords: ['rag', 'retrieval', 'embedding', 'vector search', 'chunks'] },
    { slug: 'training-vs-inference-economics', keywords: ['gpu', 'h100', 'a100', 'tokens per second', 'training cost', 'inference economics'] },
    { slug: 'evaluating-ai-benchmarks-and-evals', keywords: ['evals', 'mmlu', 'gsm8k', 'benchmark', 'data contamination'] },
    { slug: 'self-hosting-101', keywords: ['self-hosting', 'docker', 'reverse proxy', 'wireguard', 'backup strategy'] },
    { slug: 'nuclear-fusion-progress-and-reality', keywords: ['fusion', 'tokamak', 'q value', 'plasma confinement', 'iter'] },
    { slug: 'dark-matter-evidence-and-theories', keywords: ['dark matter', 'bullet cluster', 'rotation curve', 'wimp'] },
    { slug: 'reading-alien-atmospheres', keywords: ['exoplanet', 'transmission spectroscopy', 'jwst', 'biosignature'] },
    { slug: 'how-we-know-what-stars-are-made-of', keywords: ['fraunhofer lines', 'stellar spectroscopy', 'absorption spectra'] }
  ];

  for (const art of knownArticles) {
    if (art.slug === slug) continue;
    const match = art.keywords.some(k => lowerContent.includes(k));
    if (match) {
      recommendedCrossLinks.push({
        targetSlug: art.slug,
        targetUrl: `/articles/${art.slug}/`,
        markdownAnchor: `[Read our deep dive on ${art.slug.replace(/-/g, ' ')}](/articles/${art.slug}/)`
      });
    }
  }

  // 3. Match Affiliate Keywords from affiliate-map.json
  const affiliateOpportunities = [];
  if (fs.existsSync(AFFILIATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(AFFILIATE_FILE, 'utf8'));
      for (const prog of (data.affiliate_programs || [])) {
        const foundKeyword = (prog.keywords || []).find(k => lowerContent.includes(k.toLowerCase()));
        if (foundKeyword) {
          affiliateOpportunities.push({
            partnerName: prog.name,
            matchedKeyword: foundKeyword,
            url: prog.url,
            commission: prog.commission,
            disclosureHtml: `<a href="${prog.url}" target="_blank" rel="noopener sponsored" class="affiliate-link">${prog.name} ★</a>`
          });
        }
      }
    } catch {}
  }

  // 4. Generate SEO SERP Metadata
  const seoTitle = `${title.slice(0, 50)} | Signal Insight`;
  const cleanSnippet = content.replace(/[#*`_\[\]]/g, '').slice(0, 150).trim();
  const seoDescription = `${cleanSnippet}...`;

  if (jobId) {
    recordAgentRun({
      jobId,
      agentName: 'SeoAgent',
      provider: 'internal-engine',
      model: 'seo-optimizer-v1',
      tokensInput: 100,
      tokensOutput: 100,
      costUsd: 0.001,
      outputSummary: `Generated OG SVG banner, discovered ${recommendedCrossLinks.length} cross-links, matched ${affiliateOpportunities.length} affiliate opportunities.`
    });
  }

  return {
    seoTitle,
    seoDescription,
    ogCoverUrl: ogResult.publicUrl,
    ogCoverFilePath: ogResult.filePath,
    recommendedCrossLinks: recommendedCrossLinks.slice(0, 5),
    affiliateOpportunities: affiliateOpportunities.slice(0, 6),
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  runSeoAgent,
  generateOgSvg
};

