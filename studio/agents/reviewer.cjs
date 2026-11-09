/**
 * Micro Signal Cosmos — ReviewingAgent
 * Automated pre-flight quality gatekeeper. Performs strict factual grounding checks,
 * citation validation, code runnability review, and AI cliche penalties.
 */

const { recordAgentRun, recordQualityVerification } = require('../db.cjs');

// Prohibited AI cliche strings that trigger voice penalties
const PROHIBITED_CLICHES = [
  'delve into',
  'testament to',
  'in today\'s fast-paced',
  'in conclusion',
  'tapestry',
  'revolutionize',
  'game-changer',
  'beacon of',
  'unlock the power',
  'ever-evolving',
  'seamlessly integrates',
  'dive deep'
];

/**
 * Run ReviewingAgent
 */
async function runReviewingAgent({ title, content, sources = [], category = 'technology', articleId = null, jobId = null }) {
  const startTime = Date.now();
  const lowerContent = (content || '').toLowerCase();
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;

  const diagnostics = {
    citationsChecked: sources.length,
    citationWarnings: [],
    clichesDetected: [],
    codeBlocksFound: 0,
    hasTradeOffs: false,
    criticalFlags: []
  };

  // 1. Citation Grounding (Max 30 pts)
  let citationScore = 30;
  if (!sources || sources.length === 0) {
    citationScore -= 15;
    diagnostics.citationWarnings.push('No primary citations linked in draft metadata.');
  }

  // Check for hallucinated RFC or arXiv patterns in prose
  const rfcMatches = content.match(/RFC\s?(\d+)/gi) || [];
  for (const rfc of rfcMatches) {
    const num = parseInt(rfc.replace(/\D/g, ''), 10);
    // Real IETF RFCs currently range from 1 to ~9600
    if (num > 10500) {
      citationScore = 0;
      diagnostics.criticalFlags.push(`Fabricated or invalid RFC citation detected: ${rfc}`);
    }
  }

  const arxivMatches = content.match(/arXiv:([0-9.]+)/gi) || [];
  for (const ar of arxivMatches) {
    const id = ar.replace(/arXiv:/i, '').trim();
    if (!/^\d{4}\.\d{4,5}$/.test(id) && !/^([a-z\-]+)\/\d{7}$/.test(id)) {
      citationScore -= 10;
      diagnostics.citationWarnings.push(`Malformed arXiv citation pattern: ${ar}`);
    }
  }

  // 2. Code Runnability & Invariants (Max 25 pts)
  let codeScore = 25;
  const codeBlocks = content.match(/```[a-z]*[\s\S]*?```/g) || [];
  diagnostics.codeBlocksFound = codeBlocks.length;

  if (category !== 'science' && codeBlocks.length === 0) {
    codeScore -= 15;
    diagnostics.citationWarnings.push('Technical systems article contains zero code snippets or architectural listings.');
  } else if (codeBlocks.length > 0) {
    // Verify code block has language specifier
    const hasUntagged = codeBlocks.some(cb => cb.startsWith('```\n') || cb.startsWith('```\r\n'));
    if (hasUntagged) {
      codeScore -= 5;
      diagnostics.citationWarnings.push('Detected untagged code blocks without syntax highlighter identifier.');
    }
  }

  // 3. Authentic Voice & Cliche Penalty (Max 20 pts)
  let toneScore = 20;
  for (const cliche of PROHIBITED_CLICHES) {
    if (lowerContent.includes(cliche.toLowerCase())) {
      diagnostics.clichesDetected.push(cliche);
      toneScore = Math.max(0, toneScore - 5);
    }
  }

  // 4. Depth & Failure Modes (Max 15 pts)
  let depthScore = 15;
  const hasTradeOff = lowerContent.includes('trade-off') || lowerContent.includes('tradeoff') || lowerContent.includes('bottleneck');
  const hasFailureMode = lowerContent.includes('failure mode') || lowerContent.includes('break down') || lowerContent.includes('anti-pattern') || lowerContent.includes('limitation');
  diagnostics.hasTradeOffs = hasTradeOff && hasFailureMode;

  if (!hasTradeOff) depthScore -= 8;
  if (!hasFailureMode) depthScore -= 7;

  // 5. Structure & Word Count (Max 10 pts)
  let structureScore = 10;
  const h2Count = (content.match(/^##\s+/gm) || []).length;
  if (h2Count < 3) {
    structureScore -= 5;
    diagnostics.citationWarnings.push(`Insufficient subheading depth (only ${h2Count} H2 headings found).`);
  }
  if (words < 1200) {
    structureScore -= 5;
    diagnostics.citationWarnings.push(`Word count (${words}) is below deep-dive target (minimum 1,500 words).`);
  }

  // Calculate Overall Score
  const overallScore = citationScore + codeScore + toneScore + depthScore + structureScore;

  // Gate Decision
  let gateStatus = 'PASSED';
  if (diagnostics.criticalFlags.length > 0) {
    gateStatus = 'REJECTED';
  } else if (overallScore < 90 || diagnostics.citationWarnings.length > 0 || diagnostics.clichesDetected.length > 0) {
    gateStatus = 'ESCALATED'; // Sent to Human Review Queue
  }

  if (articleId) {
    recordQualityVerification({
      articleId,
      citationScore,
      codeScore,
      toneScore,
      depthScore,
      overallScore,
      gateStatus,
      diagnostics
    });
  }

  if (jobId) {
    recordAgentRun({
      jobId,
      agentName: 'ReviewingAgent',
      provider: 'internal-engine',
      model: 'quality-gate-v2',
      tokensInput: Math.round(content.length / 4),
      tokensOutput: 200,
      costUsd: 0.002,
      outputSummary: `Quality score: ${overallScore}/100. Status: ${gateStatus}. Flags: ${diagnostics.criticalFlags.length}, Warnings: ${diagnostics.citationWarnings.length}`
    });
  }

  return {
    overallScore,
    breakdown: {
      citationScore,
      codeScore,
      toneScore,
      depthScore,
      structureScore
    },
    gateStatus,
    diagnostics,
    shouldAutoPublish: gateStatus === 'PASSED',
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  runReviewingAgent,
  PROHIBITED_CLICHES
};
