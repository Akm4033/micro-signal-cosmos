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

ensureDefaultAdmin();
syncExistingArticles();
seedTopicsIfEmpty();

module.exports = {
  db,
  hashPassword,
  verifyPassword
};
