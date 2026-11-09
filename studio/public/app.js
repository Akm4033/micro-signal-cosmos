/**
 * Micro Signal Cosmos — AI Editorial Studio Client Application
 * Modular, reactive single-page interface for topics, multi-LLM drafting,
 * dual-pane markdown editing, quality checklists, and publishing.
 */

(function () {
  // Application State
  const state = {
    user: null,
    activeTab: 'dashboard',
    topics: [],
    articles: [],
    currentArticle: null,
    filterStatus: 'all',
    generatedText: ''
  };

  // DOM Elements Cache
  const el = {
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    userDisplay: document.getElementById('user-display'),
    userRoleDisplay: document.getElementById('user-role-display'),
    userInitial: document.getElementById('user-initial'),
    btnLogout: document.getElementById('btn-logout'),
    navItems: document.querySelectorAll('.nav-item'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    pageTitle: document.getElementById('current-page-title'),
    btnQuickNew: document.getElementById('btn-quick-new'),

    // Dashboard
    statPublished: document.getElementById('stat-published'),
    statDrafts: document.getElementById('stat-drafts'),
    statTopics: document.getElementById('stat-topics'),
    statApproved: document.getElementById('stat-approved'),
    auditLogs: document.getElementById('audit-logs-container'),

    // Topics
    topicsTable: document.getElementById('topics-table-body'),
    btnAddTopic: document.getElementById('btn-add-topic'),
    topicCreateCard: document.getElementById('topic-create-card'),
    btnCloseTopicForm: document.getElementById('btn-close-topic-form'),
    newTopicForm: document.getElementById('new-topic-form'),
    topicTitleInput: document.getElementById('topic-title'),
    topicDupWarn: document.getElementById('topic-dup-warn'),
    btnGenerateFromTopic: document.getElementById('btn-generate-from-topic'),

    // Generator
    genTopic: document.getElementById('gen-topic'),
    genCategory: document.getElementById('gen-category'),
    genProvider: document.getElementById('gen-provider'),
    genTargetWords: document.getElementById('gen-target-words'),
    genWordVal: document.getElementById('gen-word-val'),
    genMode: document.getElementById('gen-mode'),
    genPrompt: document.getElementById('gen-prompt'),
    btnRunGenerate: document.getElementById('btn-run-generate'),
    outputTitle: document.getElementById('output-title'),
    outputMeta: document.getElementById('output-meta'),
    outputSpinner: document.getElementById('output-spinner'),
    outputContainer: document.getElementById('output-container'),
    btnSendToEditor: document.getElementById('btn-send-to-editor'),

    // Articles Table
    articlesTable: document.getElementById('articles-table-body'),
    filterBtns: document.querySelectorAll('.filter-btn'),

    // Editor
    editorTitle: document.getElementById('editor-title'),
    editorSlug: document.getElementById('editor-slug'),
    editorContent: document.getElementById('editor-content'),
    editorPreview: document.getElementById('editor-preview'),
    editorMetrics: document.getElementById('editor-metrics'),
    editorStatusBadge: document.getElementById('editor-status-badge'),
    btnSaveDraft: document.getElementById('btn-save-draft'),
    btnQualityCheck: document.getElementById('btn-quality-check'),
    btnPublishNow: document.getElementById('btn-publish-now'),
    metaDesc: document.getElementById('meta-desc'),
    metaCategory: document.getElementById('meta-category'),
    metaAuthor: document.getElementById('meta-author'),
    metaTags: document.getElementById('meta-tags'),
    metaCover: document.getElementById('meta-cover'),
    metaFeatured: document.getElementById('meta-featured'),
    metaAffiliate: document.getElementById('meta-affiliate'),
    metaSeoTitle: document.getElementById('meta-seo-title'),
    metaSeoDesc: document.getElementById('meta-seo-desc'),

    // Quality Modal
    qualityModal: document.getElementById('quality-modal'),
    btnCloseQuality: document.getElementById('btn-close-quality'),
    btnCancelQuality: document.getElementById('btn-cancel-quality'),
    btnRunAiCheck: document.getElementById('btn-run-ai-check'),
    qualityScanResults: document.getElementById('quality-scan-results'),
    btnApproveArticle: document.getElementById('btn-approve-article'),
    gateCheckboxes: document.querySelectorAll('.checklist-items input[type="checkbox"]'),
    gate10: document.getElementById('gate-10'),

    // SEO
    crossLinksPreview: document.getElementById('cross-links-preview'),
    affiliateListContainer: document.getElementById('affiliate-list-container')
  };

  // API Client Helper
  async function api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {})
      },
      ...options
    });

    if (res.status === 401) {
      showLogin();
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async function checkAuth() {
    try {
      const data = await api('/auth/me');
      if (data.authenticated && data.user) {
        state.user = data.user;
        updateUserUI();
        hideLogin();
        loadInitialData();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    el.loginOverlay.classList.remove('hidden');
  }

  function hideLogin() {
    el.loginOverlay.classList.add('hidden');
    el.loginError.classList.add('hidden');
  }

  function updateUserUI() {
    if (!state.user) return;
    el.userDisplay.textContent = state.user.username;
    el.userInitial.textContent = state.user.username.charAt(0).toUpperCase();
    el.userRoleDisplay.textContent = state.user.role === 'admin' ? 'Lead Editor (Admin)' : 'Staff Editor';
  }

  el.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      state.user = data.user;
      state.token = data.token;
      updateUserUI();
      hideLogin();
      loadInitialData();
    } catch (err) {
      el.loginError.textContent = err.message;
      el.loginError.classList.remove('hidden');
    }
  });

  el.btnLogout.addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    state.user = null;
    showLogin();
  });

  // -------------------------------------------------------------
  // NAVIGATION & TAB SWITCHING
  // -------------------------------------------------------------
  function switchTab(tabId) {
    state.activeTab = tabId;

    el.navItems.forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    el.tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    const titles = {
      dashboard: 'Dashboard Overview',
      topics: 'Topic Discovery & Ingestion',
      generator: 'Multi-LLM Drafting Studio',
      articles: 'Articles & Publication Pipeline',
      editor: 'Dual-Pane Markdown Editor',
      seo: 'SEO & Monetization Architecture'
    };
    el.pageTitle.textContent = titles[tabId] || 'Editorial Studio';

    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'topics') loadTopics();
    if (tabId === 'articles') loadArticles();
    if (tabId === 'seo') loadSeo();
  }

  el.navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  el.btnQuickNew.addEventListener('click', () => {
    resetEditor();
    switchTab('editor');
  });

  // -------------------------------------------------------------
  // DATA LOADERS
  // -------------------------------------------------------------
  async function loadInitialData() {
    await loadDashboard();
    await loadTopics();
    await loadArticles();
  }

  async function loadDashboard() {
    try {
      const stats = await api('/dashboard/stats');
      el.statPublished.textContent = stats.articles?.published || 0;
      el.statDrafts.textContent = stats.articles?.drafts || 0;
      el.statTopics.textContent = stats.topics?.total || 0;
      el.statApproved.textContent = stats.articles?.approved || 0;

      // Render recent audit logs
      if (stats.recentLogs && stats.recentLogs.length > 0) {
        el.auditLogs.innerHTML = stats.recentLogs.map(log => {
          const date = new Date(log.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let detailsText = '';
          try {
            const parsed = JSON.parse(log.details || '{}');
            detailsText = parsed.title || parsed.slug || parsed.username || '';
          } catch {
            detailsText = log.details || '';
          }
          return `
            <div class="audit-item">
              <span class="audit-time">${timeStr}</span>
              <span class="audit-action">${escapeHtml(log.action.replace('_', ' '))}</span>
              <span class="audit-detail">${escapeHtml(detailsText)}</span>
            </div>
          `;
        }).join('');
      } else {
        el.auditLogs.innerHTML = '<div class="text-muted p-4">No audit logs recorded yet.</div>';
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }

  // -------------------------------------------------------------
  // TOPIC DISCOVERY & BACKLOG
  // -------------------------------------------------------------
  async function loadTopics() {
    try {
      const topics = await api('/topics');
      state.topics = topics;
      renderTopicsTable();
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  }

  function renderTopicsTable() {
    if (!state.topics || state.topics.length === 0) {
      el.topicsTable.innerHTML = '<tr><td colspan="6" class="text-center p-6 text-muted">No topics in backlog. Add one above.</td></tr>';
      return;
    }

    el.topicsTable.innerHTML = state.topics.map(t => {
      const intentClass = {
        architectural: 'badge-info',
        comparative: 'badge-warning',
        troubleshooting: 'badge-danger',
        informational: 'badge-success'
      }[t.intent] || 'badge-neutral';

      const keywords = (t.keywords || []).map(k => `<span class="badge badge-neutral text-xs">${escapeHtml(k)}</span>`).join(' ');

      return `
        <tr>
          <td>
            <div class="font-bold text-main">${escapeHtml(t.title)}</div>
            <div class="text-xs text-muted mt-1">${escapeHtml(t.notes || 'No notes')}</div>
          </td>
          <td><span class="badge badge-neutral">${escapeHtml(t.category)}</span></td>
          <td><span class="badge ${intentClass}">${escapeHtml(t.intent)}</span></td>
          <td><span class="badge badge-info">${escapeHtml(t.status)}</span></td>
          <td>${keywords || '<span class="text-muted text-xs">—</span>'}</td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="window.cosmosStudio.draftFromTopic('${t.id}')">Draft</button>
              <button class="btn-icon" title="Delete" onclick="window.cosmosStudio.deleteTopic('${t.id}')">&times;</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  el.btnAddTopic.addEventListener('click', () => {
    el.topicCreateCard.classList.remove('hidden');
    el.topicTitleInput.focus();
  });

  el.btnCloseTopicForm.addEventListener('click', () => {
    el.topicCreateCard.classList.add('hidden');
  });

  el.newTopicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = el.topicTitleInput.value.trim();
    const category = document.getElementById('topic-category').value;
    const intent = document.getElementById('topic-intent').value;
    const keywordsRaw = document.getElementById('topic-keywords').value;
    const notes = document.getElementById('topic-notes').value.trim();

    const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(Boolean);

    try {
      await api('/topics', {
        method: 'POST',
        body: JSON.stringify({ title, category, intent, keywords, notes })
      });
      el.topicCreateCard.classList.add('hidden');
      el.newTopicForm.reset();
      await loadTopics();
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  el.btnGenerateFromTopic.addEventListener('click', () => {
    const title = el.topicTitleInput.value.trim();
    const category = document.getElementById('topic-category').value;
    if (!title) {
      alert('Please enter a topic title first.');
      return;
    }
    el.genTopic.value = title;
    el.genCategory.value = category;
    switchTab('generator');
  });

  window.cosmosStudio = {
    draftFromTopic(topicId) {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return;
      el.genTopic.value = topic.title;
      el.genCategory.value = topic.category;
      el.genPrompt.value = topic.notes || '';
      switchTab('generator');
    },

    async deleteTopic(topicId) {
      if (!confirm('Are you sure you want to remove this topic idea?')) return;
      try {
        await api(`/topics/${topicId}`, { method: 'DELETE' });
        await loadTopics();
        await loadDashboard();
      } catch (err) {
        alert(err.message);
      }
    },

    editArticle(articleId) {
      loadArticleIntoEditor(articleId);
    },

    openQualityModal(articleId) {
      const article = state.articles.find(a => a.id === articleId);
      if (!article) return;
      state.currentArticle = article;
      openQualityChecklist(article);
    },

    async publishArticle(articleId) {
      try {
        const res = await api(`/articles/${articleId}/publish`, { method: 'POST' });
        alert(`Success! Published "${res.slug}" to src/content/articles/.\n\nAstro static regeneration triggered.`);
        await loadArticles();
        await loadDashboard();
      } catch (err) {
        alert(`Publishing Error: ${err.message}`);
      }
    }
  };

  // -------------------------------------------------------------
  // MULTI-LLM STUDIO
  // -------------------------------------------------------------
  el.genTargetWords.addEventListener('input', (e) => {
    el.genWordVal.textContent = Number(e.target.value).toLocaleString();
  });

  el.btnRunGenerate.addEventListener('click', async () => {
    const topic = el.genTopic.value.trim();
    const category = el.genCategory.value;
    const provider = el.genProvider.value;
    const targetWords = parseInt(el.genTargetWords.value, 10);
    const mode = el.genMode.value;
    const prompt = el.genPrompt.value.trim();

    if (!topic) {
      alert('Please enter a topic or headline to generate.');
      el.genTopic.focus();
      return;
    }

    el.outputSpinner.classList.remove('hidden');
    el.outputContainer.classList.add('hidden');
    el.btnSendToEditor.classList.add('hidden');
    el.btnRunGenerate.disabled = true;

    try {
      if (mode === 'compare') {
        el.outputTitle.textContent = `Side-by-Side Model Comparison: "${topic}"`;
        el.outputMeta.textContent = 'Evaluating Anthropic Claude 3.5 Sonnet vs OpenAI GPT-4o vs Google Gemini 1.5 Pro';

        const data = await api('/llm/compare', {
          method: 'POST',
          body: JSON.stringify({ topic, prompt })
        });

        el.outputSpinner.classList.add('hidden');
        el.outputContainer.classList.remove('hidden');

        // Render comparative columns
        el.outputContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            ${data.comparisons.map(c => `
              <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                  <strong class="text-accent">${escapeHtml(c.provider.toUpperCase())}</strong>
                  <span class="badge badge-neutral text-xs">${escapeHtml(c.model)}</span>
                </div>
                <div style="font-size: 12px; max-height: 400px; overflow-y: auto; white-space: pre-wrap;">
                  ${escapeHtml(c.text || c.error)}
                </div>
                <button class="btn btn-secondary btn-sm btn-block mt-3" onclick="window.cosmosStudio.useComparisonText('${escapeHtml(c.provider)}')">Use this output</button>
              </div>
            `).join('')}
          </div>
        `;
        window._comparisonData = data.comparisons;
      } else {
        const data = await api('/llm/generate', {
          method: 'POST',
          body: JSON.stringify({
            topic,
            category,
            provider,
            targetWords,
            prompt: mode === 'outline' ? `Generate an outline for: ${topic}. ${prompt}` : prompt
          })
        });

        state.generatedText = data.text;
        el.outputTitle.textContent = `Generated Draft: "${topic}"`;
        el.outputMeta.textContent = `Synthesized via ${data.provider} (${data.model}) ${data.simulated ? '• Intelligent Engine' : ''}`;

        el.outputSpinner.classList.add('hidden');
        el.outputContainer.classList.remove('hidden');
        el.outputContainer.textContent = data.text;
        el.btnSendToEditor.classList.remove('hidden');
      }
    } catch (err) {
      el.outputSpinner.classList.add('hidden');
      el.outputContainer.classList.remove('hidden');
      el.outputContainer.innerHTML = `<div class="error-banner">Generation failed: ${escapeHtml(err.message)}</div>`;
    } finally {
      el.btnRunGenerate.disabled = false;
    }
  });

  window.cosmosStudio.useComparisonText = function (provider) {
    const comp = (window._comparisonData || []).find(c => c.provider.toLowerCase() === provider.toLowerCase());
    if (comp && comp.text) {
      state.generatedText = comp.text;
      transferToEditor(el.genTopic.value, el.genCategory.value, comp.text);
    }
  };

  el.btnSendToEditor.addEventListener('click', () => {
    transferToEditor(el.genTopic.value, el.genCategory.value, state.generatedText);
  });

  function transferToEditor(title, category, content) {
    resetEditor();
    el.editorTitle.value = title;
    el.editorSlug.value = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    el.metaCategory.value = category;
    el.editorContent.value = content;
    updateEditorPreview();
    switchTab('editor');
  }

  // -------------------------------------------------------------
  // ARTICLES & PIPELINE
  // -------------------------------------------------------------
  async function loadArticles() {
    try {
      const articles = await api('/articles');
      state.articles = articles;
      renderArticlesTable();
    } catch (err) {
      console.error('Failed to load articles:', err);
    }
  }

  function renderArticlesTable() {
    let filtered = state.articles;
    if (state.filterStatus !== 'all') {
      filtered = state.articles.filter(a => a.status === state.filterStatus);
    }

    if (!filtered || filtered.length === 0) {
      el.articlesTable.innerHTML = '<tr><td colspan="7" class="text-center p-6 text-muted">No articles found in this filter state.</td></tr>';
      return;
    }

    el.articlesTable.innerHTML = filtered.map(a => {
      const statusBadges = {
        published: 'badge-success',
        approved: 'badge-info',
        draft: 'badge-neutral',
        under_review: 'badge-warning',
        archived: 'badge-danger'
      };
      const badgeClass = statusBadges[a.status] || 'badge-neutral';
      const updatedDate = new Date(a.updated_at || a.published_at || Date.now()).toLocaleDateString();

      return `
        <tr>
          <td>
            <div class="font-bold text-main">${escapeHtml(a.title)}</div>
            <div class="text-xs text-muted font-mono mt-1">/articles/${escapeHtml(a.slug)}/</div>
          </td>
          <td><span class="badge badge-neutral">${escapeHtml(a.category)}</span></td>
          <td><span class="text-secondary text-xs">${escapeHtml(a.author)}</span></td>
          <td><span class="text-muted text-xs">${escapeHtml(a.reading_time || '10 min')}</span></td>
          <td><span class="badge ${badgeClass}">${escapeHtml(a.status.replace('_', ' '))}</span></td>
          <td><span class="text-muted text-xs">${updatedDate}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="window.cosmosStudio.editArticle('${a.id}')">Edit</button>
              ${a.status !== 'published' ? `
                <button class="btn btn-info btn-sm" onclick="window.cosmosStudio.openQualityModal('${a.id}')">Review</button>
              ` : ''}
              ${a.status === 'approved' ? `
                <button class="btn btn-primary btn-sm" onclick="window.cosmosStudio.publishArticle('${a.id}')">Publish</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  el.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterStatus = btn.dataset.filter;
      renderArticlesTable();
    });
  });

  // -------------------------------------------------------------
  // DUAL-PANE MARKDOWN EDITOR
  // -------------------------------------------------------------
  function resetEditor() {
    state.currentArticle = null;
    el.editorTitle.value = '';
    el.editorSlug.value = '';
    el.editorContent.value = '';
    el.metaDesc.value = '';
    el.metaCategory.value = 'technology';
    el.metaAuthor.value = 'editorial-desk';
    el.metaTags.value = '';
    el.metaCover.value = '';
    el.metaFeatured.checked = false;
    el.metaAffiliate.checked = false;
    el.metaSeoTitle.value = '';
    el.metaSeoDesc.value = '';
    el.editorStatusBadge.textContent = 'Draft';
    el.editorStatusBadge.className = 'badge badge-neutral';
    updateEditorPreview();
  }

  async function loadArticleIntoEditor(articleId) {
    try {
      const a = await api(`/articles/${articleId}`);
      state.currentArticle = a;

      el.editorTitle.value = a.title || '';
      el.editorSlug.value = a.slug || '';
      el.editorContent.value = a.content || '';
      el.metaDesc.value = a.description || '';
      el.metaCategory.value = a.category || 'technology';
      el.metaAuthor.value = a.author || 'editorial-desk';
      el.metaTags.value = (a.tags || []).join(', ');
      el.metaCover.value = a.cover_image || '';
      el.metaFeatured.checked = a.featured === 1;
      el.metaAffiliate.checked = a.has_affiliate_links === 1;
      el.metaSeoTitle.value = a.seo_title || '';
      el.metaSeoDesc.value = a.seo_description || '';

      const statusMap = {
        published: ['Published', 'badge badge-success'],
        approved: ['Approved', 'badge badge-info'],
        draft: ['Draft', 'badge badge-neutral'],
        under_review: ['Under Review', 'badge badge-warning']
      };
      const [label, cls] = statusMap[a.status] || ['Draft', 'badge badge-neutral'];
      el.editorStatusBadge.textContent = label;
      el.editorStatusBadge.className = cls;

      updateEditorPreview();
      switchTab('editor');
    } catch (err) {
      alert('Failed to load article: ' + err.message);
    }
  }

  el.editorContent.addEventListener('input', updateEditorPreview);
  el.editorTitle.addEventListener('input', () => {
    if (!state.currentArticle && !el.editorSlug.value) {
      el.editorSlug.value = el.editorTitle.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  });

  function updateEditorPreview() {
    const raw = el.editorContent.value;
    const words = raw.trim().split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.ceil(words / 200));
    el.editorMetrics.textContent = `${words.toLocaleString()} words • ~${readMin} min read`;

    el.editorPreview.innerHTML = parseMarkdownToHtml(raw);
  }

  // Lightweight Client-Side Markdown Parser
  function parseMarkdownToHtml(md) {
    if (!md) return '<p class="text-muted italic">Type markdown in the left pane to preview...</p>';

    let html = escapeHtml(md);

    // Code blocks
    html = html.replace(/```([a-z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^>\s?(.*$)/gim, '<blockquote>$1</blockquote>');

    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim().length > 0);
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });

    // Paragraphs
    html = html.split('\n\n').map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<tr>')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  }

  el.btnSaveDraft.addEventListener('click', async () => {
    const title = el.editorTitle.value.trim();
    const slug = el.editorSlug.value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const content = el.editorContent.value.trim();

    if (!title || !content) {
      alert('Article title and Markdown content are required.');
      return;
    }

    const payload = {
      title,
      slug,
      content,
      description: el.metaDesc.value.trim() || title,
      category: el.metaCategory.value,
      author: el.metaAuthor.value,
      tags: el.metaTags.value.split(',').map(t => t.trim()).filter(Boolean),
      coverImage: el.metaCover.value.trim() || `/og/${slug}.svg`,
      featured: el.metaFeatured.checked,
      hasAffiliateLinks: el.metaAffiliate.checked,
      seoTitle: el.metaSeoTitle.value.trim() || null,
      seoDescription: el.metaSeoDesc.value.trim() || null
    };

    try {
      if (state.currentArticle && state.currentArticle.id) {
        await api(`/articles/${state.currentArticle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert('Draft saved successfully.');
      } else {
        const res = await api('/articles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        state.currentArticle = { id: res.id, slug: res.slug };
        alert(`New article draft created: "${res.slug}"`);
      }
      await loadArticles();
      await loadDashboard();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  });

  el.btnQualityCheck.addEventListener('click', () => {
    if (!state.currentArticle) {
      alert('Please save the draft first before opening Quality Gate.');
      return;
    }
    openQualityChecklist(state.currentArticle);
  });

  el.btnPublishNow.addEventListener('click', async () => {
    if (!state.currentArticle) {
      alert('Please save the draft first.');
      return;
    }

    if (state.currentArticle.status !== 'approved') {
      alert('Article cannot be published yet because it has not passed the 10-point Editorial Quality Gate.\n\nPlease click "Quality Gate" and sign off as Lead Editor.');
      openQualityChecklist(state.currentArticle);
      return;
    }

    try {
      const res = await api(`/articles/${state.currentArticle.id}/publish`, { method: 'POST' });
      alert(`Success! Published "${res.slug}" to src/content/articles/${res.slug}.md.\n\nReading time: ${res.readingTime}`);
      await loadArticles();
      await loadDashboard();
      switchTab('articles');
    } catch (err) {
      alert(`Publishing failed: ${err.message}`);
    }
  });

  // -------------------------------------------------------------
  // QUALITY CONTROL & FACT-CHECKING MODAL
  // -------------------------------------------------------------
  function openQualityChecklist(article) {
    state.currentArticle = article;
    el.qualityModal.classList.remove('hidden');
    el.qualityScanResults.innerHTML = '';

    // Reset checkboxes
    el.gateCheckboxes.forEach(cb => { cb.checked = false; });
    el.btnApproveArticle.disabled = true;
  }

  el.btnCloseQuality.addEventListener('click', () => { el.qualityModal.classList.add('hidden'); });
  el.btnCancelQuality.addEventListener('click', () => { el.qualityModal.classList.add('hidden'); });

  el.gate10.addEventListener('change', () => {
    el.btnApproveArticle.disabled = !el.gate10.checked;
  });

  el.btnRunAiCheck.addEventListener('click', async () => {
    if (!state.currentArticle) return;
    el.btnRunAiCheck.disabled = true;
    el.qualityScanResults.innerHTML = '<span class="text-muted">Scanning draft for cliches, code runnability, and primary source links...</span>';

    try {
      const res = await api(`/articles/${state.currentArticle.id}/quality-check`, { method: 'POST' });
      
      let warningsHtml = '';
      if (res.redFlags && res.redFlags.length > 0) {
        warningsHtml = `<div class="text-warning mt-2">${res.redFlags.map(f => `• ${escapeHtml(f)}`).join('<br>')}</div>`;
      } else {
        warningsHtml = `<div class="text-success mt-2">✓ Zero generic AI cliches detected. Rigorous systems tone confirmed.</div>`;
      }

      el.qualityScanResults.innerHTML = `
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px;">
          <strong>Automated Analysis Results (Score: ${res.verificationScore}/100)</strong><br>
          <span class="text-muted">Length: ${res.wordCount} words (${res.readingTime}) • Code blocks: ${res.codeBlocks} • Subsections: ${res.h2Count}</span>
          ${warningsHtml}
        </div>
      `;

      // Auto-check automated criteria if passing
      if (res.verificationScore >= 80) {
        document.getElementById('gate-1').checked = true;
        document.getElementById('gate-2').checked = res.codeBlocks > 0;
        document.getElementById('gate-3').checked = true;
        document.getElementById('gate-4').checked = res.redFlags.length === 0;
        document.getElementById('gate-5').checked = true;
        document.getElementById('gate-7').checked = true;
        document.getElementById('gate-8').checked = true;
      }
    } catch (err) {
      el.qualityScanResults.innerHTML = `<span class="text-danger">Scan error: ${escapeHtml(err.message)}</span>`;
    } finally {
      el.btnRunAiCheck.disabled = false;
    }
  });

  el.btnApproveArticle.addEventListener('click', async () => {
    if (!state.currentArticle) return;

    try {
      await api(`/articles/${state.currentArticle.id}/approve`, { method: 'POST' });
      state.currentArticle.status = 'approved';
      el.qualityModal.classList.add('hidden');
      alert(`Article "${state.currentArticle.title}" has been APPROVED!\n\nYou may now safely publish it to the live public site.`);
      await loadArticles();
      await loadDashboard();
      if (state.activeTab === 'editor') {
        el.editorStatusBadge.textContent = 'Approved';
        el.editorStatusBadge.className = 'badge badge-info';
      }
    } catch (err) {
      alert('Approval failed: ' + err.message);
    }
  });

  // -------------------------------------------------------------
  // SEO & AFFILIATES
  // -------------------------------------------------------------
  async function loadSeo() {
    try {
      const data = await api('/seo/overview');
      if (data.affiliatePrograms && data.affiliatePrograms.length > 0) {
        el.affiliateListContainer.innerHTML = data.affiliatePrograms.map(p => `
          <div class="integration-item">
            <div class="integration-icon">★</div>
            <div class="integration-info">
              <div class="integration-title">${escapeHtml(p.name)} (${escapeHtml(p.commission || 'Partner')})</div>
              <div class="integration-status">Keywords: ${(p.keywords || []).map(escapeHtml).join(', ')}</div>
            </div>
            <span class="badge badge-neutral">${escapeHtml(p.category)}</span>
          </div>
        `).join('');
      }

      el.crossLinksPreview.textContent = `# Verified Cross-Link Clusters\n# Auto-inserted when target slugs appear in technical discussions:\n\n` +
        `- Browser Internals -> WebAssembly & JIT Compilation\n` +
        `- Transformer Architecture -> RAG From Scratch & Inference Economics\n` +
        `- Gravitational Lensing -> Exoplanet Spectroscopy & Dark Matter\n` +
        `- Database Internals -> TLS 1.3 & Distributed Consensus\n`;
    } catch (err) {
      console.error('Failed to load SEO data:', err);
    }
  }

  // Utility: HTML Escaping
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize
  checkAuth();
})();

