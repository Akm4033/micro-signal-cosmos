#!/usr/bin/env node
/**
 * Signal Insight — Command-Line Pipeline Runner
 * Usage:
 *   node studio/cli.cjs --next
 *   node studio/cli.cjs --topic "Speculative Decoding in LLMs" --category "artificial-intelligence"
 */

const { db, getSetting, canPublishToday, isAutoPublishEnabled } = require('./db.cjs');
const { runEditorialPipeline } = require('./pipeline.cjs');

async function main() {
  const args = process.argv.slice(2);
  let topicTitle = null;
  let category = 'technology';
  let isNext = false;
  let stage = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) {
      topicTitle = args[++i];
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[++i];
    } else if (args[i] === '--next') {
      isNext = true;
    } else if (args[i] === '--stage' && args[i + 1]) {
      stage = args[++i];
    }
  }

  let targetTopic = null;

  if (isNext) {
    const row = db.prepare("SELECT * FROM topics WHERE status = 'backlog' ORDER BY created_at ASC LIMIT 1").get();
    if (!row) {
      console.log('[Pipeline CLI] No topics currently in backlog.');
      process.exit(0);
    }
    targetTopic = row;
    topicTitle = row.title;
    category = row.category;
  } else if (!topicTitle) {
    console.log(`
Signal Insight — Autonomous Editorial Pipeline CLI
======================================================
Usage:
  node studio/cli.cjs --next
  node studio/cli.cjs --topic "Topic Title" --category "technology" [--stage STAGE_B]

Options:
  --next          Picks the next backlog topic and executes the 4-agent pipeline
  --topic <str>   Custom topic headline
  --category <str> Domain pillar: technology, artificial-intelligence, science, developer-tools
  --stage <str>   Override staging level: STAGE_A, STAGE_B, STAGE_C
`);
    process.exit(0);
  }

  console.log('=======================================================');
  console.log(` EXECUTING AUTONOMOUS PIPELINE: "${topicTitle}"`);
  console.log(` Category: ${category} | Stage: ${stage || getSetting('rollout_stage', 'STAGE_B')}`);
  console.log('=======================================================');

  const quota = canPublishToday();
  console.log(`Daily Quota: ${quota.count}/${quota.limit} published today (${quota.remaining} remaining)`);

  const result = await runEditorialPipeline({
    topicId: targetTopic ? targetTopic.id : null,
    title: topicTitle,
    category,
    notes: targetTopic ? targetTopic.notes : '',
    stage
  });

  console.log('\n=======================================================');
  console.log(' PIPELINE EXECUTION COMPLETED');
  console.log(` Success:  ${result.success}`);
  console.log(` Decision: ${result.decision}`);
  if (result.score) console.log(` Score:    ${result.score}/100`);
  if (result.message) console.log(` Message:  ${result.message}`);
  if (result.error) console.log(` Error:    ${result.error}`);
  console.log('=======================================================\n');
}

main().catch(err => {
  console.error('[CLI Error]', err);
  process.exit(1);
});

