/**
 * Signal Insight — Specialized Agent Team
 * Centralized exports for the 4 autonomous editorial pipeline agents:
 * 1. ResearchAgent (Primary source compilation & citation verification)
 * 2. WritingAgent (Systems deep dive authoring with multi-LLM routing)
 * 3. ReviewingAgent (Pre-flight fact check, code runnability, cliche penalty)
 * 4. SeoAgent (Semantic cross-links, affiliate anchors, 1200x630 OG SVG banner)
 */

const { runResearchAgent } = require('./researcher.cjs');
const { runWritingAgent } = require('./writer.cjs');
const { runReviewingAgent } = require('./reviewer.cjs');
const { runSeoAgent, generateOgSvg } = require('./seo.cjs');

module.exports = {
  runResearchAgent,
  runWritingAgent,
  runReviewingAgent,
  runSeoAgent,
  generateOgSvg
};

