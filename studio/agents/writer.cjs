/**
 * Signal Insight — WritingAgent
 * Longform systems authoring (2,000–3,500 words) conforming to the publication's
 * 4 domain lenses with architectural diagrams, production code, and benchmark tables.
 */

const { recordAgentRun } = require('../db.cjs');
const { generateWithProvider } = require('../llm.cjs');
const { calculateReadingTime } = require('../publish.cjs');

/**
 * Run WritingAgent
 */
async function runWritingAgent({ topic, category = 'technology', researchData = {}, targetWords = 2500, provider = 'anthropic', model = null, jobId = null }) {
  const startTime = Date.now();
  const cat = (category || 'technology').toLowerCase();

  const authorPersonas = {
    technology: 'Marina Kowalski (Systems Engineer)',
    'artificial-intelligence': 'Kai Nakamura (ML Engineer)',
    science: 'Arun Mehta (Astrophysicist)',
    'developer-tools': 'Marina Kowalski (Systems Engineer)'
  };
  const authorPersona = authorPersonas[cat] || 'Cosmos Systems Engineer';

  const sourcesList = (researchData.sources || []).map(s => `- ${s.title} (${s.source || s.url})`).join('\n');
  const invariantsList = (researchData.invariants || []).map(i => `- ${i}`).join('\n');

  const systemPrompt = `You are ${authorPersona}, lead technical writer for Signal Insight.
You write deeply technical, rigorous longform articles for senior practitioners and systems engineers.
RULES:
1. Avoid superficial analogies, corporate buzzwords, and AI cliches ("delve into", "testament to", "in conclusion", "tapestry").
2. Ground explanations in hardware, memory layout, system calls, and physical runtime realities.
3. Every article MUST follow this 6-part structure:
   - Part 1: Historical Context & The Core Bottleneck
   - Part 2: Architecture & Hardware/Memory Layout (Include ASCII or Mermaid diagram)
   - Part 3: Step-by-Step Code Implementation & Idioms (Include runnable code)
   - Part 4: Production Benchmarks & Quantitative Trade-Offs (Include comparison table: Throughput, P99 Latency, CPU %)
   - Part 5: Where This Pattern Breaks Down (Failure modes, anti-patterns, edge cases)
   - Part 6: Practitioner's Decision Framework & Takeaways`;

  const userPrompt = `Topic: "${topic}"
Target Category: "${cat}"
Target Length: Approximately ${targetWords} words.

Primary Research Sources to cite:
${sourcesList || 'Primary specifications and RFCs.'}

Invariants to enforce:
${invariantsList || 'Hardware alignment and deterministic concurrency guarantees.'}

Write the complete, unabridged technical deep dive in Markdown.`;

  const res = await generateWithProvider({
    provider,
    model,
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.7
  });

  const content = res.text.trim();
  const words = content.split(/\s+/).filter(Boolean).length;
  const readingTime = calculateReadingTime(content);

  // Estimate tokens and costs for audit log
  const tokensInput = Math.round(userPrompt.length / 4);
  const tokensOutput = Math.round(content.length / 4);
  const costUsd = parseFloat(((tokensInput * 0.000003) + (tokensOutput * 0.000015)).toFixed(4));

  if (jobId) {
    recordAgentRun({
      jobId,
      agentName: 'WritingAgent',
      provider: res.provider || provider,
      model: res.model || model || 'writer-v1',
      tokensInput,
      tokensOutput,
      costUsd,
      outputSummary: `Generated ${words} word deep dive across 6 sections.`
    });
  }

  return {
    content,
    wordCount: words,
    readingTime,
    modelUsed: `${res.provider} (${res.model})`,
    simulated: !!res.simulated,
    durationMs: Date.now() - startTime
  };
}

module.exports = {
  runWritingAgent
};
