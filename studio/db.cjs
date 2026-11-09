const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', '.editorial');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'studio.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for performance
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    created_at TEXT NOT NULL,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    pillar TEXT NOT NULL,
    intent TEXT NOT NULL DEFAULT 'informational',
    status TEXT NOT NULL DEFAULT 'backlog',
    keywords TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS research_notes (
    id TEXT PRIMARY KEY,
    topic_id TEXT,
    title TEXT NOT NULL,
    sources TEXT NOT NULL DEFAULT '[]',
    key_findings TEXT NOT NULL DEFAULT '[]',
    summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'editorial-desk',
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    reading_time TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    has_affiliate_links INTEGER NOT NULL DEFAULT 0,
    cover_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    references_data TEXT NOT NULL DEFAULT '[]',
    model_used TEXT,
    editorial_notes TEXT,
    checklist TEXT NOT NULL DEFAULT '{}',
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
  );

  -- ==============================================================
  -- PHASE 2 EXTENSIONS: PRODUCTION SAFETY, AGENTS & REVIEW QUEUE
  -- ==============================================================

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    article_id TEXT,
    stage TEXT NOT NULL DEFAULT 'STAGE_B',
    status TEXT NOT NULL DEFAULT 'PENDING',
    current_agent TEXT,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    idempotency_key TEXT UNIQUE NOT NULL,
    started_at TEXT,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    output_summary TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(job_id) REFERENCES pipeline_jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quality_verifications (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    citation_score INTEGER NOT NULL,
    code_score INTEGER NOT NULL,
    tone_score INTEGER NOT NULL,
    depth_score INTEGER NOT NULL,
    overall_score INTEGER NOT NULL,
    gate_status TEXT NOT NULL,
    diagnostics TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS human_review_queue (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    failure_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    assigned_editor TEXT,
    editor_notes TEXT,
    escalated_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
  );
`);

// Password helper
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return verify === hash;
}

// Ensure default admin user exists
function ensureDefaultAdmin() {
  const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
  const existing = checkUser.get('admin');

  if (!existing) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Cosmos@Editorial2026!';
    const { hash, salt } = hashPassword(adminPassword);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, salt, role, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `);
    insertUser.run(userId, 'admin', hash, salt, now);
    console.log('[Studio DB] Default administrator initialized: admin');
  }
}

// Sync existing 15 markdown articles from src/content/articles into SQLite
function syncExistingArticles() {
  const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');
  if (!fs.existsSync(articlesDir)) return;

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
  const checkStmt = db.prepare('SELECT id FROM articles WHERE slug = ?');
  const insertStmt = db.prepare(`
    INSERT INTO articles (
      id, slug, title, description, category, author, content, status,
      reading_time, tags, featured, has_affiliate_links, cover_image,
      seo_title, seo_description, references_data, published_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, 'published',
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  let count = 0;
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    if (checkStmt.get(slug)) continue;

    const fullPath = path.join(articlesDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');

    // Parse simple frontmatter
    let frontmatter = {};
    let content = raw;
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (match) {
      content = match[2];
      const lines = match[1].split('\n');
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          frontmatter[key] = val;
        }
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const pubDate = frontmatter.publishDate || now;

    insertStmt.run(
      id,
      slug,
      frontmatter.title || slug,
      frontmatter.description || '',
      frontmatter.category || 'technology',
      frontmatter.author || 'marina',
      content,
      frontmatter.readingTime || '10 min read',
      JSON.stringify(frontmatter.tags ? [frontmatter.tags] : []),
      frontmatter.featured === 'true' ? 1 : 0,
      frontmatter.hasAffiliateLinks === 'true' ? 1 : 0,
      frontmatter.coverImage || `/og/${slug}.svg`,
      frontmatter.seoTitle || null,
      frontmatter.seoDescription || null,
      '[]',
      pubDate,
      pubDate,
      now
    );
    count++;
  }

  if (count > 0) {
    console.log(`[Studio DB] Synchronized ${count} published markdown articles into editorial database.`);
  }
}

// Initial seed topics if table is empty
function seedTopicsIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM topics').get().cnt;
  if (count === 0) {
    const insertTopic = db.prepare(`
      INSERT INTO topics (id, title, category, pillar, intent, status, keywords, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();

    const seed = [
      {
        title: 'Zero-Copy Networking in Linux with io_uring and eBPF',
        category: 'technology',
        pillar: 'Pillar 01: Technology',
        intent: 'architectural',
        keywords: ['io_uring', 'eBPF', 'zero-copy', 'networking', 'linux kernel'],
        notes: 'Investigate high-throughput packet processing and socket ring buffers.'
      },
      {
        title: 'Speculative Decoding: Speeding Up LLM Inference Without Accuracy Loss',
        category: 'artificial-intelligence',
        pillar: 'Pillar 02: AI & ML',
        intent: 'comparative',
        keywords: ['speculative decoding', 'draft model', 'vLLM', 'latency', 'tokens per second'],
        notes: 'Draft models vs medusa heads; benchmark tokens/sec on A100 vs H100.'
      },
      {
        title: 'Gravitational Lensing: How Massive Galaxy Clusters Act as Cosmic Telescopes',
        category: 'science',
        pillar: 'Pillar 03: Science',
        intent: 'informational',
        keywords: ['gravitational lensing', 'einstein rings', 'jwst', 'dark matter mass', 'cosmology'],
        notes: 'Trace light bending through general relativity and Bullet cluster mass mapping.'
      },
      {
        title: 'Designing Zero-Downtime Database Migrations for High-Traffic PostgreSQL',
        category: 'developer-tools',
        pillar: 'Pillar 04: Developer Tools',
        intent: 'troubleshooting',
        keywords: ['postgresql', 'table lock', 'zero-downtime', 'schema migration', 'pg_repack'],
        notes: 'Safe table alterations, adding indexes concurrently, foreign key validation.'
      }
    ];

    for (const item of seed) {
      insertTopic.run(
        crypto.randomUUID(),
        item.title,
        item.category,
        item.pillar,
        item.intent,
        'backlog',
        JSON.stringify(item.keywords),
        item.notes,
        now,
        now
      );
    }
    console.log('[Studio DB] Initialized 4 high-value seed research topics across 4 pillars.');
  }
}

// -------------------------------------------------------------
// SYSTEM SETTINGS & PRODUCTION SAFETY GUARDS
// -------------------------------------------------------------

function getSetting(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

function setSetting(key, value, description = '') {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO system_settings (key, value, description, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      description = coalesce(nullif(excluded.description, ''), system_settings.description),
      updated_at = excluded.updated_at
  `).run(key, String(value), description, now);
}

function seedSystemSettings() {
  const today = new Date().toISOString().slice(0, 10);
  const defaults = [
    { key: 'rollout_stage', value: 'STAGE_B', description: 'Active rollout stage: STAGE_A (Draft), STAGE_B (Approval Queue), STAGE_C (Auto-Publish)' },
    { key: 'auto_publish_kill_switch', value: 'DISABLED', description: 'Master safety kill switch for automated publishing: ENABLED or DISABLED' },
    { key: 'daily_publish_limit', value: '2', description: 'Maximum allowed articles published per calendar day' },
    { key: 'max_daily_api_cost_usd', value: '10.0', description: 'Maximum allowed daily LLM API expenditure in USD' },
    { key: 'current_daily_api_cost_usd', value: '0.0', description: 'Accumulated API spend for the current calendar day' },
    { key: 'last_cost_reset_date', value: today, description: 'Calendar date for daily API cost tracking reset' }
  ];

  const checkStmt = db.prepare('SELECT key FROM system_settings WHERE key = ?');
  for (const def of defaults) {
    if (!checkStmt.get(def.key)) {
      setSetting(def.key, def.value, def.description);
    }
  }
  console.log('[Studio DB] System settings & production safety guards initialized.');
}

// Daily publishing quota checker (Max 2 articles per UTC day)
function getDailyPublishedCount(dateStr = new Date().toISOString().slice(0, 10)) {
  const row = db.prepare(`
    SELECT COUNT(*) as count
    FROM articles
    WHERE status = 'published' AND published_at LIKE ?
  `).get(`${dateStr}%`);
  return row ? row.count : 0;
}

function canPublishToday() {
  const limit = parseInt(getSetting('daily_publish_limit', '2'), 10);
  const count = getDailyPublishedCount();
  const remaining = Math.max(0, limit - count);
  return {
    allowed: count < limit,
    count,
    limit,
    remaining
  };
}

// Master autonomous publishing authorization check
function isAutoPublishEnabled() {
  const stage = getSetting('rollout_stage', 'STAGE_B');
  const killSwitch = getSetting('auto_publish_kill_switch', 'DISABLED');
  const quota = canPublishToday();

  if (stage !== 'STAGE_C') {
    return {
      enabled: false,
      reason: `Automated publishing is locked under ${stage}. Human review queue is active.`
    };
  }

  if (killSwitch !== 'ENABLED') {
    return {
      enabled: false,
      reason: 'Global auto-publish kill switch is set to DISABLED.'
    };
  }

  if (!quota.allowed) {
    return {
      enabled: false,
      reason: `Daily publishing quota exhausted (${quota.count}/${quota.limit} articles published today).`
    };
  }

  return {
    enabled: true,
    quota
  };
}

// API Cost Accounting & Budget Guard
function trackApiCost(costUsd) {
  const today = new Date().toISOString().slice(0, 10);
  let lastReset = getSetting('last_cost_reset_date', today);
  let currentSpend = parseFloat(getSetting('current_daily_api_cost_usd', '0.0'));
  const maxSpend = parseFloat(getSetting('max_daily_api_cost_usd', '10.0'));

  if (lastReset !== today) {
    currentSpend = 0.0;
    setSetting('last_cost_reset_date', today);
  }

  currentSpend += Number(costUsd) || 0.0;
  setSetting('current_daily_api_cost_usd', currentSpend.toFixed(4));

  return {
    withinBudget: currentSpend <= maxSpend,
    currentSpend,
    maxSpend,
    remainingBudget: Math.max(0, maxSpend - currentSpend)
  };
}

// -------------------------------------------------------------
// PIPELINE JOBS & AGENT EXECUTION RECORDS
// -------------------------------------------------------------

function createPipelineJob({ topicId, stage = 'STAGE_B', idempotencyKey }) {
  const key = idempotencyKey || `job-${topicId}-${Date.now()}`;
  const existing = db.prepare('SELECT * FROM pipeline_jobs WHERE idempotency_key = ?').get(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO pipeline_jobs (id, topic_id, stage, status, idempotency_key, started_at)
    VALUES (?, ?, ?, 'RUNNING', ?, ?)
  `).run(id, topicId, stage, key, now);

  return db.prepare('SELECT * FROM pipeline_jobs WHERE id = ?').get(id);
}

function updatePipelineJob(id, updates = {}) {
  const existing = db.prepare('SELECT * FROM pipeline_jobs WHERE id = ?').get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE pipeline_jobs
    SET article_id = coalesce(?, article_id),
        status = coalesce(?, status),
        current_agent = coalesce(?, current_agent),
        error_message = coalesce(?, error_message),
        retry_count = coalesce(?, retry_count),
        cost_usd = coalesce(?, cost_usd),
        completed_at = case when ? in ('COMPLETED', 'FAILED', 'ESCALATED') then ? else completed_at end
    WHERE id = ?
  `).run(
    updates.articleId || null,
    updates.status || null,
    updates.currentAgent || null,
    updates.errorMessage || null,
    updates.retryCount !== undefined ? updates.retryCount : null,
    updates.costUsd !== undefined ? updates.costUsd : null,
    updates.status || null,
    now,
    id
  );

  return db.prepare('SELECT * FROM pipeline_jobs WHERE id = ?').get(id);
}

function recordAgentRun({ jobId, agentName, provider, model, tokensInput = 0, tokensOutput = 0, costUsd = 0.0, outputSummary = '' }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO agent_runs (id, job_id, agent_name, provider, model, tokens_input, tokens_output, cost_usd, output_summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, jobId, agentName, provider, model, tokensInput, tokensOutput, costUsd, outputSummary, now);

  trackApiCost(costUsd);
  return id;
}

function recordQualityVerification({ articleId, citationScore, codeScore, toneScore, depthScore, overallScore, gateStatus, diagnostics = {} }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO quality_verifications (id, article_id, citation_score, code_score, tone_score, depth_score, overall_score, gate_status, diagnostics, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, articleId, citationScore, codeScore, toneScore, depthScore, overallScore, gateStatus, JSON.stringify(diagnostics), now);
  return id;
}

// -------------------------------------------------------------
// HUMAN REVIEW QUEUE
// -------------------------------------------------------------

function escalateToHumanReview({ articleId, reason, failureDetails = {} }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO human_review_queue (id, article_id, reason, failure_details, status, escalated_at)
    VALUES (?, ?, ?, ?, 'PENDING', ?)
  `).run(id, articleId, reason, JSON.stringify(failureDetails), now);

  // Update article status to under_review
  db.prepare("UPDATE articles SET status = 'under_review', updated_at = ? WHERE id = ?").run(now, articleId);

  // Record audit log
  db.prepare("INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, 'system', 'ESCALATED_TO_REVIEW_QUEUE', ?, ?)").run(
    crypto.randomUUID(),
    JSON.stringify({ articleId, reason }),
    now
  );

  return id;
}

function getHumanReviewQueue(status = 'PENDING') {
  let query = `
    SELECT q.*, a.title, a.slug, a.category, a.author, a.reading_time
    FROM human_review_queue q
    JOIN articles a ON q.article_id = a.id
  `;
  const params = [];
  if (status) {
    query += ' WHERE q.status = ?';
    params.push(status);
  }
  query += ' ORDER BY q.escalated_at DESC';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    failure_details: JSON.parse(r.failure_details || '{}')
  }));
}

function resolveHumanReview({ id, status, editorNotes = '', assignedEditor = 'admin' }) {
  const now = new Date().toISOString();
  const queueItem = db.prepare('SELECT * FROM human_review_queue WHERE id = ?').get(id);
  if (!queueItem) throw new Error('Review queue item not found');

  db.prepare(`
    UPDATE human_review_queue
    SET status = ?, editor_notes = ?, assigned_editor = ?, resolved_at = ?
    WHERE id = ?
  `).run(status, editorNotes, assignedEditor, now, id);

  if (status === 'APPROVED') {
    db.prepare("UPDATE articles SET status = 'approved', updated_at = ? WHERE id = ?").run(now, queueItem.article_id);
  } else if (status === 'REJECTED') {
    db.prepare("UPDATE articles SET status = 'archived', updated_at = ? WHERE id = ?").run(now, queueItem.article_id);
  }

  db.prepare("INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, 'RESOLVED_REVIEW_QUEUE', ?, ?)").run(
    crypto.randomUUID(),
    assignedEditor,
    JSON.stringify({ queueId: id, articleId: queueItem.article_id, status }),
    now
  );

  return { success: true, status };
}

// Startup initializations
ensureDefaultAdmin();
syncExistingArticles();
seedTopicsIfEmpty();
seedSystemSettings();

module.exports = {
  db,
  hashPassword,
  verifyPassword,
  getSetting,
  setSetting,
  canPublishToday,
  getDailyPublishedCount,
  isAutoPublishEnabled,
  trackApiCost,
  createPipelineJob,
  updatePipelineJob,
  recordAgentRun,
  recordQualityVerification,
  escalateToHumanReview,
  getHumanReviewQueue,
  resolveHumanReview
};
