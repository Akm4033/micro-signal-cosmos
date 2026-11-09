import type { APIRoute } from 'astro';
import { CATEGORIES } from '../data/categories';
import { getPublishedArticles } from '../data/articles';

export const GET: APIRoute = async (context) => {
  const publishedArticles = await getPublishedArticles();

  // Determine site base URL (from astro.config.mjs `site` property if configured, defaulting to production canonical)
  const siteUrl = (context.site ? context.site.href.replace(/\/$/, '') : '') || process.env.SITE_URL || 'https://micro-signal-cosmos.pages.dev';
  const channelLink = siteUrl;
  const feedSelfLink = `${siteUrl}/rss.xml`;

  const itemsXml = publishedArticles
    .map((article) => {
      const slug = article.data.slug || article.id;
      const articleUrl = siteUrl ? `${siteUrl}/articles/${slug}/` : `/articles/${slug}/`;
      const pubDate = article.data.publishDate.toUTCString();

      const categoryInfo = CATEGORIES.find(
        (c) =>
          c.slug.toLowerCase() === article.data.category.toLowerCase().trim() ||
          c.name.toLowerCase() === article.data.category.toLowerCase().trim()
      );
      const categoryName = categoryInfo?.name || article.data.category;

      return `    <item>
      <title><![CDATA[${article.data.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${article.data.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${categoryName}</category>
      <author><![CDATA[${article.data.author}]]></author>
    </item>`;
    })
    .join('\n');

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[CURION]]></title>
    <description><![CDATA[Understand the world. Explore beyond it. CURION is an AI-powered global knowledge discovery and learning platform.]]></description>
    <link>${channelLink}</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedSelfLink}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssContent.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

