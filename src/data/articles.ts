import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from './categories';

export type Article = CollectionEntry<'articles'>;

/**
 * Returns all published articles sorted by publishDate descending.
 * Draft articles are strictly excluded from public listings.
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const articles = await getCollection('articles', ({ data }) => {
    return !data.draft;
  });

  return articles.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/**
 * Returns all featured, non-draft articles sorted by date.
 */
export async function getFeaturedArticles(): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter((article) => article.data.featured);
}

/**
 * Returns non-draft articles belonging to a specific category slug or name.
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


