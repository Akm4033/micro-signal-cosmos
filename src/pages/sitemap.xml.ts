import type { APIRoute } from 'astro';
import { CATEGORIES } from '../data/categories';
import { getPublishedArticles } from '../data/articles';

export const GET: APIRoute = async (context) => {
  const publishedArticles = await getPublishedArticles();

  // Determine site base URL (from astro.config.mjs `site` property if configured)
  const siteUrl = context.site ? context.site.href.replace(/\/$/, '') : '';

  // Core static pages
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/articles/', changefreq: 'daily', priority: '0.9' },
    { url: '/about/', changefreq: 'monthly', priority: '0.6' },
    { url: '/contact/', changefreq: 'monthly', priority: '0.6' },
    { url: '/privacy-policy/', changefreq: 'yearly', priority: '0.3' },
    { url: '/terms/', changefreq: 'yearly', priority: '0.3' },
    { url: '/disclaimer/', changefreq: 'yearly', priority: '0.3' },
  ];

  // Category archive pages (all 7 official categories)
  const categoryPages = CATEGORIES.map((cat) => ({
    url: cat.href,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  // Article detail pages (published, non-draft articles)
  const articlePages = publishedArticles.map((article) => {
    const slug = article.data.slug || article.id;
    const lastMod = (article.data.updatedDate || article.data.publishDate).toISOString().split('T')[0];
    return {
      url: `/articles/${slug}/`,
      lastmod: lastMod,
      changefreq: 'monthly',
      priority: '0.8',
    };
  });

  const allUrls = [...staticPages, ...categoryPages, ...articlePages];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map((page) => {
    const loc = siteUrl ? `${siteUrl}${page.url}` : page.url;
    const lastmodTag = 'lastmod' in page ? `\n    <lastmod>${page.lastmod}</lastmod>` : '';
    return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xmlContent.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

