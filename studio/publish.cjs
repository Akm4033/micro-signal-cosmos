/**
 * Micro Signal Cosmos — Production Publishing Engine
 * Converts approved SQLite article records into strictly typed Astro Markdown collection files.
 * Enforces editorial approval, schema validation, and audit trail logging.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, canPublishToday } = require('./db.cjs');

const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articles');
const VALID_CATEGORIES = ['technology', 'artificial-intelligence', 'science', 'developer-tools'];
const VALID_AUTHORS = ['editorial-desk', 'marina', 'kai', 'arun'];

/**
 * Calculate reading time (200 words/min)
 */
function calculateReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Format string as safe YAML string
 */
function yamlQuote(str) {
  if (!str) return '""';
  return JSON.stringify(str);
}

/**
 * Publish an article by ID or Slug
 */
function publishArticle(articleIdOrSlug, options = {}) {
  // Find article
  const stmt = db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?');
  const article = stmt.get(articleIdOrSlug, articleIdOrSlug);

  if (!article) {
    throw new Error(`Article not found with ID or slug: "${articleIdOrSlug}"`);
  }

  // Check approval gate
  if (article.status !== 'approved' && !options.force) {
    throw new Error(`Cannot publish article "${article.slug}" because its status is "${article.status}". It must be APPROVED by an editor first.`);
  }

  // Check Daily Publishing Quota (Max 2 articles per calendar day)
  const quota = canPublishToday();
  if (!quota.allowed && !options.force) {
    throw new Error(`Daily publishing limit reached: ${quota.count}/${quota.limit} articles already published today. Additional articles must wait for tomorrow's quota or be forced.`);
  }

  // Validate Category
  const cat = (article.category || '').toLowerCase().trim();
  if (!VALID_CATEGORIES.includes(cat)) {
    throw new Error(`Invalid category "${article.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Validate Author
  let authorKey = (article.author || 'editorial-desk').toLowerCase().trim();
  if (!VALID_AUTHORS.includes(authorKey)) {
    authorKey = 'editorial-desk';
  }

  // Parse JSON fields
  let tags = [];
  try {
    tags = JSON.parse(article.tags || '[]');
    if (!Array.isArray(tags)) tags = [tags];
  } catch {
    tags = [];
  }

  let references = [];
  try {
    references = JSON.parse(article.references_data || '[]');
  } catch {
    references = [];
  }

  // Reading time
  const readingTime = article.reading_time || calculateReadingTime(article.content);
  const now = new Date().toISOString();
  const publishDate = article.published_at || now;

  // Build Frontmatter
  let frontmatterLines = [
    '---',
    `title: ${yamlQuote(article.title)}`,
    `description: ${yamlQuote(article.description)}`,
    `publishDate: ${yamlQuote(publishDate)}`,
    `updatedDate: ${yamlQuote(now)}`,
    `category: ${yamlQuote(cat)}`,
    `author: ${yamlQuote(authorKey)}`,
    `readingTime: ${yamlQuote(readingTime)}`,
    'tags:'
  ];

  if (tags.length === 0) {
    frontmatterLines.push('  - "Technical Architecture"');
  } else {
    for (const t of tags) {
      frontmatterLines.push(`  - ${yamlQuote(t)}`);
    }
  }

  frontmatterLines.push(`featured: ${article.featured === 1 ? 'true' : 'false'}`);
  frontmatterLines.push('draft: false');

  // Cover image
  const coverImg = article.cover_image || `/og/${article.slug}.svg`;
  frontmatterLines.push(`coverImage: ${yamlQuote(coverImg)}`);
  frontmatterLines.push(`coverImageAlt: ${yamlQuote(`Technical illustration for ${article.title}`)}`);

  if (article.seo_title) {
    frontmatterLines.push(`seoTitle: ${yamlQuote(article.seo_title)}`);
  }
  if (article.seo_description) {
    frontmatterLines.push(`seoDescription: ${yamlQuote(article.seo_description)}`);
  }

  frontmatterLines.push(`hasAffiliateLinks: ${article.has_affiliate_links === 1 ? 'true' : 'false'}`);
  frontmatterLines.push('hasAiAssistance: true');

  if (references.length > 0) {
    frontmatterLines.push('references:');
    for (const ref of references) {
      if (typeof ref === 'string') {
        frontmatterLines.push(`  - title: ${yamlQuote(ref)}`);
      } else {
        frontmatterLines.push(`  - title: ${yamlQuote(ref.title || 'Technical Reference')}`);
        if (ref.url) frontmatterLines.push(`    url: ${yamlQuote(ref.url)}`);
        if (ref.source) frontmatterLines.push(`    source: ${yamlQuote(ref.source)}`);
      }
    }
  }

  frontmatterLines.push('---');
  frontmatterLines.push('');

  // Assemble full markdown
  const cleanBody = article.content.trim();
  const fullMarkdown = frontmatterLines.join('\n') + '\n' + cleanBody + '\n';

  // Ensure target folder exists
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const targetFile = path.join(ARTICLES_DIR, `${article.slug}.md`);
  fs.writeFileSync(targetFile, fullMarkdown, 'utf8');

  // Update SQLite record
  const updateStmt = db.prepare(`
    UPDATE articles
    SET status = 'published',
        published_at = ?,
        reading_time = ?,
        updated_at = ?
    WHERE id = ?
  `);
  updateStmt.run(publishDate, readingTime, now, article.id);

  // Record audit log
  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  auditStmt.run(
    crypto.randomUUID(),
    options.userId || 'admin',
    'ARTICLE_PUBLISHED',
    JSON.stringify({ slug: article.slug, title: article.title, path: targetFile }),
    now
  );

  return {
    success: true,
    slug: article.slug,
    filePath: targetFile,
    publishedAt: publishDate,
    readingTime
  };
}

/**
 * Unpublish / archive an article
 */
function unpublishArticle(articleIdOrSlug, options = {}) {
  const stmt = db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?');
  const article = stmt.get(articleIdOrSlug, articleIdOrSlug);
  if (!article) throw new Error('Article not found.');

  const targetFile = path.join(ARTICLES_DIR, `${article.slug}.md`);
  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE articles SET status = 'archived', updated_at = ? WHERE id = ?").run(now, article.id);
  db.prepare("INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    options.userId || 'admin',
    'ARTICLE_ARCHIVED',
    JSON.stringify({ slug: article.slug }),
    now
  );

  return { success: true, slug: article.slug };
}

module.exports = {
  publishArticle,
  unpublishArticle,
  calculateReadingTime
};

