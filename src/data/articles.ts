import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from './categories';
import { calculateReadingTime } from '../utils/readingTime';

export type Article = CollectionEntry<'articles'>;

/**
 * Returns all published articles sorted by publishDate descending.
 * Draft articles are strictly excluded from public listings and sitemaps.
 *
 * @param includeDrafts - Set to true ONLY in local editorial preview environments
 */
export async function getPublishedArticles(includeDrafts = false): Promise<Article[]> {
  const allowDrafts =
    includeDrafts ||
    process.env.ENABLE_DRAFTS === 'true' ||
    Boolean(import.meta.env?.ENABLE_DRAFTS === 'true');

  const now = new Date();
  const articles = await getCollection('articles', ({ data }) => {
    if (allowDrafts) return true;
    return !data.draft && data.publishDate.getTime() <= now.getTime();
  });

  return articles.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/**
 * Returns all featured, non-draft articles sorted by publish date.
 */
export async function getFeaturedArticles(): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter((article) => article.data.featured);
}

/**
 * Returns non-draft articles belonging to a specific category slug or formal name.
 */
export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const articles = await getPublishedArticles();
  const normalizedSlug = categorySlug.toLowerCase().trim();
  const matchedCategory = CATEGORIES.find(
    (c) => c.slug.toLowerCase() === normalizedSlug || c.name.toLowerCase() === normalizedSlug
  );
  const targetSlug = matchedCategory ? matchedCategory.slug.toLowerCase() : normalizedSlug;
  const targetName = matchedCategory ? matchedCategory.name.toLowerCase() : normalizedSlug;

  return articles.filter((article) => {
    const artCat = article.data.category.toLowerCase().trim();
    return artCat === targetSlug || artCat === targetName;
  });
}

/**
 * Consistently resolves reading time across the entire site.
 * Uses manual frontmatter override if provided; otherwise calculates dynamically
 * at approximately 200 words per minute from the Markdown article body.
 */
export function getArticleReadingTime(article: Article): string {
  if (article.data.readingTime) {
    return article.data.readingTime;
  }
  return calculateReadingTime(article.body);
}

/**
 * Helper to resolve the canonical slug for an article.
 */
export function getArticleSlug(article: Article): string {
  return article.data.slug || article.id;
}
