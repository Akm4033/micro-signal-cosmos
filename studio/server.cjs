/**
 * Micro Signal Cosmos — AI Editorial Studio API Server
 * Lightweight, zero-dependency Node.js HTTP server.
 * Provides complete REST API for Topic Discovery, Multi-LLM Drafting, Article Editing,
 * Fact-Checking, Approval Workflow, Publishing, and Real-time Auditing.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, hashPassword, verifyPassword } = require('./db.cjs');
const { generateWithProvider, compareModels, verifyDraftQuality } = require('./llm.cjs');
const { publishArticle, unpublishArticle, calculateReadingTime } = require('./publish.cjs');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

/**
 * Parse JSON body from request stream
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

/**
 * Authentication middleware
 */
function getAuthUser(req) {
  // Check Authorization header or cookie
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['cookie']) {
    const cookies = req.headers['cookie'].split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('cosmos_session=')) {
        token = c.slice('cosmos_session='.length);
        break;
      }
    }
  }

  if (!token) return null;

  const now = Date.now();
  const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(token);
  if (!session || session.expires_at < now) {
    if (session) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(session.user_id);
  return user ? { ...user, token } : null;
}

/**
 * Request Handler
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // -------------------------------------------------------------
    // API: AUTHENTICATION
    // -------------------------------------------------------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { username, password } = await parseBody(req);
      if (!username || !password) {
        return sendJSON(res, 400, { error: 'Username and password are required.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
        return sendJSON(res, 401, { error: 'Invalid username or password.' });
      }

      // Generate session token (valid 7 days)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const now = new Date().toISOString();

      db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
        token,
        user.id,
        expiresAt,
        now
      );

      db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);

      // Audit log
      db.prepare('INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        crypto.randomUUID(),
        user.id,
        'USER_LOGIN',
        JSON.stringify({ username: user.username }),
        now
      );

      res.setHeader('Set-Cookie', `cosmos_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}`);
      return sendJSON(res, 200, {
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token
      });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const user = getAuthUser(req);
      if (user && user.token) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(user.token);
      }
      res.setHeader('Set-Cookie', 'cosmos_session=; Path=/; HttpOnly; Max-Age=0');
      return sendJSON(res, 200, { success: true });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = getAuthUser(req);
      if (!user) {
        return sendJSON(res, 401, { authenticated: false });
      }
      return sendJSON(res, 200, { authenticated: true, user });
    }

    // Guard all remaining /api routes with authentication
    if (pathname.startsWith('/api/')) {
      const user = getAuthUser(req);
      if (!user) {
        return sendJSON(res, 401, { error: 'Unauthorized. Please sign in to the AI Editorial Studio.' });
      }

      // -------------------------------------------------------------
      // API: DASHBOARD STATS
      // -------------------------------------------------------------
      if (pathname === '/api/dashboard/stats' && method === 'GET') {
        const articleStats = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
            SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
          FROM articles
        `).get();

        const topicStats = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'backlog' THEN 1 ELSE 0 END) as backlog,
            SUM(CASE WHEN status = 'researching' THEN 1 ELSE 0 END) as researching,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
          FROM topics
        `).get();

        const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8').all();

        const integrations = {
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          gemini: !!process.env.GEMINI_API_KEY,
          analytics: false, // Set to true when GA4 / GSC configured
          adsense: false
        };

        return sendJSON(res, 200, {
          articles: articleStats,
          topics: topicStats,
          integrations,
          recentLogs
        });
      }

      // -------------------------------------------------------------
      // API: TOPICS
      // -------------------------------------------------------------
      if (pathname === '/api/topics' && method === 'GET') {
        const topics = db.prepare('SELECT * FROM topics ORDER BY created_at DESC').all();
        const formatted = topics.map(t => ({
          ...t,
          keywords: JSON.parse(t.keywords || '[]')
        }));
        return sendJSON(res, 200, formatted);
      }

      if (pathname === '/api/topics' && method === 'POST') {
        const { title, category, pillar, intent, keywords, notes } = await parseBody(req);
        if (!title || !category) {
          return sendJSON(res, 400, { error: 'Topic title and category are required.' });
        }

        // Duplicate check against existing topics and articles
        const existingTopic = db.prepare('SELECT id FROM topics WHERE LOWER(title) = LOWER(?)').get(title.trim());
        const existingArticle = db.prepare('SELECT id FROM articles WHERE LOWER(title) = LOWER(?)').get(title.trim());
        if (existingTopic || existingArticle) {
          return sendJSON(res, 409, { error: 'A topic or article with this title already exists in the system.' });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO topics (id, title, category, pillar, intent, status, keywords, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'backlog', ?, ?, ?, ?)
        `).run(
          id,
          title.trim(),
          category.toLowerCase(),
          pillar || 'Pillar',
          intent || 'informational',
          JSON.stringify(Array.isArray(keywords) ? keywords : []),
          notes || '',
          now,
          now
        );

        db.prepare('INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)').run(
          crypto.randomUUID(),
          user.id,
          'TOPIC_CREATED',
          JSON.stringify({ title, category }),
          now
        );

        return sendJSON(res, 201, { success: true, id });
      }

      const topicMatch = pathname.match(/^\/api\/topics\/([a-zA-Z0-9-]+)$/);
      if (topicMatch && method === 'PUT') {
        const topicId = topicMatch[1];
        const body = await parseBody(req);
        const existing = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
        if (!existing) return sendJSON(res, 404, { error: 'Topic not found' });

        const now = new Date().toISOString();
        db.prepare(`
          UPDATE topics
          SET title = ?, category = ?, pillar = ?, intent = ?, status = ?, keywords = ?, notes = ?, updated_at = ?
          WHERE id = ?
        `).run(
          body.title || existing.title,
          body.category || existing.category,
          body.pillar || existing.pillar,
          body.intent || existing.intent,
          body.status || existing.status,
          JSON.stringify(body.keywords || JSON.parse(existing.keywords || '[]')),
          body.notes !== undefined ? body.notes : existing.notes,
          now,
          topicId
        );

        return sendJSON(res, 200, { success: true });
      }

      if (topicMatch && method === 'DELETE') {
        const topicId = topicMatch[1];
        db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);
        return sendJSON(res, 200, { success: true });
      }

      // -------------------------------------------------------------
      // API: RESEARCH NOTES
      // -------------------------------------------------------------
      if (pathname.startsWith('/api/research') && method === 'GET') {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const topicId = parsedUrl.searchParams.get('topicId');

        let notes;
        if (topicId) {
          notes = db.prepare('SELECT * FROM research_notes WHERE topic_id = ?').all(topicId);
        } else {
          notes = db.prepare('SELECT * FROM research_notes ORDER BY updated_at DESC').all();
        }

        const formatted = notes.map(n => ({
          ...n,
          sources: JSON.parse(n.sources || '[]'),
          key_findings: JSON.parse(n.key_findings || '[]')
        }));
        return sendJSON(res, 200, formatted);
      }

      if (pathname === '/api/research' && method === 'POST') {
        const { topicId, title, sources, keyFindings, summary } = await parseBody(req);
        if (!title) return sendJSON(res, 400, { error: 'Research title is required' });

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO research_notes (id, topic_id, title, sources, key_findings, summary, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          topicId || null,
          title,
          JSON.stringify(sources || []),
          JSON.stringify(keyFindings || []),
          summary || '',
          now,
          now
        );

        return sendJSON(res, 201, { success: true, id });
      }

      // -------------------------------------------------------------
      // API: MULTI-LLM GENERATION & COMPARISON
      // -------------------------------------------------------------
      if (pathname === '/api/llm/generate' && method === 'POST') {
        const { provider, model, prompt, systemPrompt, topic, category, targetWords, temperature } = await parseBody(req);
        if (!prompt && !topic) return sendJSON(res, 400, { error: 'Prompt or topic is required' });

        const result = await generateWithProvider({
          provider: provider || 'anthropic',
          model,
          prompt: prompt || `Generate a deep architectural breakdown for the topic: "${topic}". Target words: ${targetWords || 2500}. Category: ${category || 'technology'}.`,
          systemPrompt,
          temperature: temperature ? parseFloat(temperature) : 0.7
        });

        return sendJSON(res, 200, result);
      }

      if (pathname === '/api/llm/compare' && method === 'POST') {
        const { topic, prompt, models } = await parseBody(req);
        if (!topic && !prompt) return sendJSON(res, 400, { error: 'Topic or prompt is required for comparison.' });

        const results = await compareModels({
          topic,
          prompt,
          models: Array.isArray(models) && models.length > 0 ? models : ['anthropic', 'openai', 'gemini']
        });

        return sendJSON(res, 200, { comparisons: results });
      }

      // -------------------------------------------------------------
      // API: ARTICLES (CRUD & WORKFLOW)
      // -------------------------------------------------------------
      if (pathname === '/api/articles' && method === 'GET') {
        const status = parsedUrl.searchParams.get('status');
        let query = 'SELECT id, slug, title, description, category, author, status, reading_time, featured, published_at, updated_at FROM articles';
        const params = [];

        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }
        query += ' ORDER BY updated_at DESC';

        const articles = db.prepare(query).all(...params);
        return sendJSON(res, 200, articles);
      }

      if (pathname === '/api/articles' && method === 'POST') {
        const body = await parseBody(req);
        const { title, slug, description, category, author, content, tags, coverImage, seoTitle, seoDescription } = body;

        if (!title || !content) {
          return sendJSON(res, 400, { error: 'Title and content are required.' });
        }

        // Generate clean slug if not given
        const finalSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

        // Check uniqueness
        const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(finalSlug);
        if (existing) {
          return sendJSON(res, 409, { error: `An article with slug "${finalSlug}" already exists.` });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const readingTime = calculateReadingTime(content);

        db.prepare(`
          INSERT INTO articles (
            id, slug, title, description, category, author, content, status,
            reading_time, tags, featured, has_affiliate_links, cover_image,
            seo_title, seo_description, references_data, model_used, checklist,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, 'draft',
            ?, ?, 0, 0, ?,
            ?, ?, '[]', ?, '{}',
            ?, ?
          )
        `).run(
          id,
          finalSlug,
          title,
          description || title,
          (category || 'technology').toLowerCase(),
          (author || 'editorial-desk').toLowerCase(),
          content,
          readingTime,
          JSON.stringify(Array.isArray(tags) ? tags : []),
          coverImage || `/og/${finalSlug}.svg`,
          seoTitle || null,
          seoDescription || null,
          body.modelUsed || 'human-author',
          now,
          now
        );

        // Record revision snapshot
        db.prepare('INSERT INTO revisions (id, article_id, content, summary, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          crypto.randomUUID(),
          id,
          content,
          'Initial Draft Creation',
          user.username,
          now
        );

        return sendJSON(res, 201, { success: true, id, slug: finalSlug });
      }

      const articleMatch = pathname.match(/^\/api\/articles\/([a-zA-Z0-9-]+)$/);
      if (articleMatch && method === 'GET') {
        const idOrSlug = articleMatch[1];
        const article = db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);
        if (!article) return sendJSON(res, 404, { error: 'Article not found' });

        const revisions = db.prepare('SELECT id, summary, author_name, created_at FROM revisions WHERE article_id = ? ORDER BY created_at DESC').all(article.id);

        return sendJSON(res, 200, {
          ...article,
          tags: JSON.parse(article.tags || '[]'),
          references_data: JSON.parse(article.references_data || '[]'),
          checklist: JSON.parse(article.checklist || '{}'),
          revisions
        });
      }

      if (articleMatch && method === 'PUT') {
        const id = articleMatch[1];
        const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        if (!article) return sendJSON(res, 404, { error: 'Article not found' });

        const body = await parseBody(req);
        const now = new Date().toISOString();
        const readingTime = calculateReadingTime(body.content || article.content);

        db.prepare(`
          UPDATE articles
          SET title = ?, description = ?, category = ?, author = ?, content = ?,
              reading_time = ?, tags = ?, featured = ?, has_affiliate_links = ?,
              cover_image = ?, seo_title = ?, seo_description = ?, references_data = ?,
              status = ?, checklist = ?, updated_at = ?
          WHERE id = ?
        `).run(
          body.title !== undefined ? body.title : article.title,
          body.description !== undefined ? body.description : article.description,
          (body.category || article.category).toLowerCase(),
          (body.author || article.author).toLowerCase(),
          body.content !== undefined ? body.content : article.content,
          readingTime,
          JSON.stringify(body.tags !== undefined ? body.tags : JSON.parse(article.tags || '[]')),
          body.featured ? 1 : 0,
          body.hasAffiliateLinks ? 1 : 0,
          body.coverImage || article.cover_image,
          body.seoTitle !== undefined ? body.seoTitle : article.seo_title,
          body.seoDescription !== undefined ? body.seoDescription : article.seo_description,
          JSON.stringify(body.references || JSON.parse(article.references_data || '[]')),
          body.status || article.status,
          JSON.stringify(body.checklist || JSON.parse(article.checklist || '{}')),
          now,
          id
        );

        // Record revision snapshot if content changed
        if (body.content && body.content !== article.content) {
          db.prepare('INSERT INTO revisions (id, article_id, content, summary, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
            crypto.randomUUID(),
            id,
            body.content,
            body.revisionSummary || 'Draft update',
            user.username,
            now
          );
        }

        return sendJSON(res, 200, { success: true, readingTime });
      }

      if (articleMatch && method === 'DELETE') {
        const id = articleMatch[1];
        const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        if (!article) return sendJSON(res, 404, { error: 'Article not found' });

        if (article.status === 'published') {
          return sendJSON(res, 400, { error: 'Cannot delete a published article. Unpublish it first to preserve site integrity.' });
        }

        db.prepare('DELETE FROM articles WHERE id = ?').run(id);
        return sendJSON(res, 200, { success: true });
      }

      // -------------------------------------------------------------
      // API: QUALITY CHECK & EDITORIAL APPROVAL WORKFLOW
      // -------------------------------------------------------------
      const qualityMatch = pathname.match(/^\/api\/articles\/([a-zA-Z0-9-]+)\/quality-check$/);
      if (qualityMatch && method === 'POST') {
        const id = qualityMatch[1];
        const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        if (!article) return sendJSON(res, 404, { error: 'Article not found' });

        const quality = await verifyDraftQuality({ content: article.content, title: article.title });
        return sendJSON(res, 200, quality);
      }

      const approveMatch = pathname.match(/^\/api\/articles\/([a-zA-Z0-9-]+)\/approve$/);
      if (approveMatch && method === 'POST') {
        const id = approveMatch[1];
        const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        if (!article) return sendJSON(res, 404, { error: 'Article not found' });

        const now = new Date().toISOString();
        db.prepare("UPDATE articles SET status = 'approved', updated_at = ? WHERE id = ?").run(now, id);
        db.prepare('INSERT INTO audit_logs (id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)').run(
          crypto.randomUUID(),
          user.id,
          'ARTICLE_APPROVED',
          JSON.stringify({ slug: article.slug, title: article.title }),
          now
        );

        return sendJSON(res, 200, { success: true, status: 'approved' });
      }

      const publishMatch = pathname.match(/^\/api\/articles\/([a-zA-Z0-9-]+)\/publish$/);
      if (publishMatch && method === 'POST') {
        const id = publishMatch[1];
        try {
          const result = publishArticle(id, { userId: user.id });
          return sendJSON(res, 200, result);
        } catch (err) {
          return sendJSON(res, 400, { error: err.message });
        }
      }

      const unpublishMatch = pathname.match(/^\/api\/articles\/([a-zA-Z0-9-]+)\/unpublish$/);
      if (unpublishMatch && method === 'POST') {
        const id = unpublishMatch[1];
        try {
          const result = unpublishArticle(id, { userId: user.id });
          return sendJSON(res, 200, result);
        } catch (err) {
          return sendJSON(res, 400, { error: err.message });
        }
      }

      // -------------------------------------------------------------
      // API: SEO & MONETIZATION CROSS-REFERENCE
      // -------------------------------------------------------------
      if (pathname === '/api/seo/overview' && method === 'GET') {
        const crossLinksPath = path.join(__dirname, '..', 'src', 'content', 'config', 'cross-links.yml');
        const affiliatePath = path.join(__dirname, '..', 'src', 'content', 'config', 'affiliate-map.json');

        let affiliateCount = 0;
        let affiliatePrograms = [];
        if (fs.existsSync(affiliatePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(affiliatePath, 'utf8'));
            affiliatePrograms = data.programs || [];
            affiliateCount = affiliatePrograms.length;
          } catch {}
        }

        return sendJSON(res, 200, {
          affiliateCount,
          affiliatePrograms: affiliatePrograms.slice(0, 10),
          hasCrossLinksConfig: fs.existsSync(crossLinksPath)
        });
      }

      return sendJSON(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
    }

    // -------------------------------------------------------------
    // STATIC FILE SERVING (Studio Dashboard Web Client)
    // -------------------------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/plain';

    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }

  } catch (err) {
    console.error(`[Studio Error] ${err.message}`, err.stack);
    sendJSON(res, 500, { error: 'Internal Server Error: ' + err.message });
  }
});

// Start Server
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` MICRO SIGNAL COSMOS — AI EDITORIAL STUDIO RUNNING`);
    console.log(` Local Dashboard URL: http://localhost:${PORT}`);
    console.log(` API Endpoint:        http://localhost:${PORT}/api/`);
    console.log(` Storage Engine:      .editorial/studio.db (SQLite WAL)`);
    console.log(`=======================================================`);
  });
}

module.exports = { server, PORT };
