/**
 * Micro Signal Cosmos — Master Autonomous Pipeline & Guardrails
 * Coordinates the 4 specialized agents in sequence:
 * 1. ResearchAgent -> 2. WritingAgent -> 3. ReviewingAgent -> 4. SeoAgent
 * Enforces rate limits (max 2/day), API budget caps, idempotency locks,
 * quality gates, human review escalation, and staged publishing.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  db,
  getSetting,
  canPublishToday,
  isAutoPublishEnabled,
  createPipelineJob,
  updatePipelineJob,
  escalateToHumanReview
} = require('./db.cjs');
const {
  runResearchAgent,
  runWritingAgent,
  runReviewingAgent,
  runSeoAgent
} = require('./agents/index.cjs');
const { publishArticle, unpublishArticle, calculateReadingTime } = require('./publish.cjs');

/**
 * Execute the Complete 4-Agent Editorial Pipeline
 */
async function runEditorialPipeline({
  topicId,
  title,
  category = 'technology',
  notes = '',
  intent = 'architectural',
  provider = 'anthropic',
  model = null,
  targetWords = 2500,
  stage = null
}) {
  const currentStage = stage || getSetting('rollout_stage', 'STAGE_B');
  const idempotencyKey = `pipeline-${topicId || 'custom'}-${Date.now()}`;

  // 1. Create or retrieve pipeline job
  const job = createPipelineJob({
    topicId: topicId || 'ad-hoc-topic',
    stage: currentStage,
    idempotencyKey
  });

  const cleanTitle = title || 'High-Throughput Systems Architecture';
  const cleanCategory = (category || 'technology').toLowerCase();
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  console.log(`[Pipeline] Starting Job ${job.id} for "${cleanTitle}" under ${currentStage}...`);

  try {
    // -------------------------------------------------------------
    // PRE-FLIGHT CHECK 1: DUPLICATE TITLE & SLUG
    // -------------------------------------------------------------
    const existingArticle = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
    if (existingArticle) {
      throw new Error(`Duplicate article prevention: An article with slug "${slug}" already exists in the publication.`);
    }

    // -------------------------------------------------------------
    // STEP 1: RESEARCH AGENT
    // -------------------------------------------------------------
    updatePipelineJob(job.id, { currentAgent: 'ResearchAgent', status: 'RUNNING' });
    console.log(`[Pipeline] Step 1: Invoking ResearchAgent...`);

    const researchData = await runResearchAgent({
      topic: cleanTitle,
      category: cleanCategory,
      notes,
      jobId: job.id,
      provider,
      model
    });

    // -------------------------------------------------------------
    // STEP 2: WRITING AGENT
    // -------------------------------------------------------------
    updatePipelineJob(job.id, { currentAgent: 'WritingAgent' });
    console.log(`[Pipeline] Step 2: Invoking WritingAgent...`);

    const writingData = await runWritingAgent({
      topic: cleanTitle,
      category: cleanCategory,
      researchData,
      targetWords,
      provider,
      model,
      jobId: job.id
    });

    // -------------------------------------------------------------
    // STEP 3: REVIEWING AGENT (QUALITY GATEKEEPER)
    // -------------------------------------------------------------
    updatePipelineJob(job.id, { currentAgent: 'ReviewingAgent' });
    console.log(`[Pipeline] Step 3: Invoking ReviewingAgent...`);

    const reviewData = await runReviewingAgent({
      title: cleanTitle,
      content: writingData.content,
      sources: researchData.sources,
      category: cleanCategory,
      jobId: job.id
    });

    console.log(`[Pipeline] Quality Score: ${reviewData.overallScore}/100 | Gate Status: ${reviewData.gateStatus}`);

    // If critical failure / fabricated citations detected -> REJECT
    if (reviewData.gateStatus === 'REJECTED') {
      const errorMsg = `Article rejected by ReviewingAgent. Critical flags: ${reviewData.diagnostics.criticalFlags.join('; ')}`;
      updatePipelineJob(job.id, {
        status: 'FAILED',
        errorMessage: errorMsg
      });

      db.prepare("INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, 'system', 'PIPELINE_REJECTED', ?, ?)").run(
        crypto.randomUUID(),
        JSON.stringify({ title: cleanTitle, reasons: reviewData.diagnostics.criticalFlags }),
        new Date().toISOString()
      );

      return {
        success: false,
        jobId: job.id,
        stage: currentStage,
        decision: 'REJECTED',
        error: errorMsg,
        reviewData
      };
    }

    // -------------------------------------------------------------
    // STEP 4: SEO AGENT
    // -------------------------------------------------------------
    updatePipelineJob(job.id, { currentAgent: 'SeoAgent' });
    console.log(`[Pipeline] Step 4: Invoking SeoAgent...`);

    const authorMap = {
      technology: 'marina',
      'artificial-intelligence': 'kai',
      science: 'arun',
      'developer-tools': 'marina'
    };
    const authorKey = authorMap[cleanCategory] || 'editorial-desk';

    const seoData = await runSeoAgent({
      slug,
      title: cleanTitle,
      content: writingData.content,
      category: cleanCategory,
      author: authorKey,
      readingTime: writingData.readingTime,
      jobId: job.id
    });

    // -------------------------------------------------------------
    // STEP 5: SAVE AS ARTICLE IN SQLITE
    // -------------------------------------------------------------
    const articleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const hasAffiliates = seoData.affiliateOpportunities.length > 0;

    // Determine initial status based on quality check
    const initialStatus = reviewData.gateStatus === 'PASSED' ? 'approved' : 'draft';

    db.prepare(`
      INSERT INTO articles (
        id, slug, title, description, category, author, content, status,
        reading_time, tags, featured, has_affiliate_links, cover_image,
        seo_title, seo_description, references_data, model_used, checklist,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 0, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      articleId,
      slug,
      cleanTitle,
      seoData.seoDescription,
      cleanCategory,
      authorKey,
      writingData.content,
      initialStatus,
      writingData.readingTime,
      JSON.stringify([cleanCategory, intent]),
      hasAffiliates ? 1 : 0,
      seoData.ogCoverUrl,
      seoData.seoTitle,
      seoData.seoDescription,
      JSON.stringify(researchData.sources),
      writingData.modelUsed,
      JSON.stringify(reviewData.breakdown),
      now,
      now
    );

    updatePipelineJob(job.id, { articleId });

    // Update topic status if topicId provided
    if (topicId) {
      db.prepare("UPDATE topics SET status = 'completed', updated_at = ? WHERE id = ?").run(now, topicId);
    }

    // -------------------------------------------------------------
    // STEP 6: ROUTING DECISION & STAGED ROLLOUT ENFORCEMENT
    // -------------------------------------------------------------

    // CASE A: Fails quality threshold (< 90) or has warnings -> Human Review Queue
    if (reviewData.gateStatus === 'ESCALATED') {
      const queueId = escalateToHumanReview({
        articleId,
        reason: 'QUALITY_GATE_ESCALATION',
        failureDetails: {
          score: reviewData.overallScore,
          warnings: reviewData.diagnostics.citationWarnings,
          cliches: reviewData.diagnostics.clichesDetected
        }
      });

      updatePipelineJob(job.id, {
        status: 'ESCALATED',
        currentAgent: 'Completed'
      });

      console.log(`[Pipeline] Article escalated to Human Review Queue (Queue ID: ${queueId})`);
      return {
        success: true,
        jobId: job.id,
        articleId,
        slug,
        stage: currentStage,
        decision: 'ESCALATED_TO_HUMAN_REVIEW',
        queueId,
        score: reviewData.overallScore,
        reviewData
      };
    }

    // CASE B: Passed Quality Gate. Handle by Staged Rollout:
    if (currentStage === 'STAGE_A') {
      // Stage A: Drafts generated in database only.
      updatePipelineJob(job.id, { status: 'COMPLETED', currentAgent: 'Completed' });
      return {
        success: true,
        jobId: job.id,
        articleId,
        slug,
        stage: 'STAGE_A',
        decision: 'SAVED_AS_DRAFT',
        message: 'Stage A active: Draft generated in SQLite. Automatic publishing disabled.'
      };
    }

    if (currentStage === 'STAGE_B') {
      // Stage B (Default): Validated & Approved in database, requires manual human 1-click publishing.
      updatePipelineJob(job.id, { status: 'COMPLETED', currentAgent: 'Completed' });
      return {
        success: true,
        jobId: job.id,
        articleId,
        slug,
        stage: 'STAGE_B',
        decision: 'READY_FOR_APPROVAL',
        message: 'Stage B active: Article validated and marked APPROVED. Awaiting Lead Editor 1-click publish.'
      };
    }

    if (currentStage === 'STAGE_C') {
      // Stage C: Autonomous Publishing
      const autoAuth = isAutoPublishEnabled();
      if (!autoAuth.enabled) {
        console.warn(`[Pipeline] Stage C active but publishing blocked: ${autoAuth.reason}. Routing to approval queue.`);
        updatePipelineJob(job.id, { status: 'COMPLETED', currentAgent: 'Completed' });
        return {
          success: true,
          jobId: job.id,
          articleId,
          slug,
          stage: 'STAGE_C',
          decision: 'HELD_FOR_APPROVAL',
          reason: autoAuth.reason
        };
      }

      // Check daily rate limit
      const quota = canPublishToday();
      if (!quota.allowed) {
        console.warn(`[Pipeline] Daily quota reached (${quota.count}/${quota.limit}). Delaying to queue.`);
        updatePipelineJob(job.id, { status: 'COMPLETED', currentAgent: 'Completed' });
        return {
          success: true,
          jobId: job.id,
          articleId,
          slug,
          stage: 'STAGE_C',
          decision: 'DAILY_QUOTA_REACHED',
          quota
        };
      }

      // Publish directly to Astro collection
      console.log(`[Pipeline] Stage C authorized. Publishing "${slug}" to src/content/articles/...`);
      const pubResult = publishArticle(articleId, { force: false, userId: 'pipeline-autonomous' });
      updatePipelineJob(job.id, { status: 'COMPLETED', currentAgent: 'Completed' });

      return {
        success: true,
        jobId: job.id,
        articleId,
        slug,
        stage: 'STAGE_C',
        decision: 'PUBLISHED_AUTONOMOUSLY',
        pubResult
      };
    }

  } catch (err) {
    console.error(`[Pipeline Error] ${err.message}`, err.stack);
    updatePipelineJob(job.id, {
      status: 'FAILED',
      errorMessage: err.message
    });
    return {
      success: false,
      jobId: job.id,
      error: err.message
    };
  }
}

/**
 * 1-Click Article Rollback / Unpublish
 */
function rollbackArticle(articleIdOrSlug, options = {}) {
  return unpublishArticle(articleIdOrSlug, options);
}

module.exports = {
  runEditorialPipeline,
  rollbackArticle
};

