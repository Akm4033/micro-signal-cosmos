import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORIES } from './data/categories';

// Official valid category values (both slugs and formal names accepted)
const validCategorySlugs = CATEGORIES.map((c) => c.slug);
const validCategoryNames = CATEGORIES.map((c) => c.name.toLowerCase());

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    /** Primary headline of the article */
    title: z.string({ required_error: 'Article title is required.' }),

    /** Editorial summary used for previews, search, and social cards */
    description: z.string({ required_error: 'Article description is required.' }),

    /** Custom URL slug (optional, defaults to Markdown file name) */
    slug: z.string().optional(),

    /** Initial publication timestamp */
    publishDate: z.coerce.date({ required_error: 'publishDate is required.' }),

    /** Optional last modified timestamp for revisions */
    updatedDate: z.coerce.date().optional(),

    /** Content stream pillar (must match one of the 7 official publication categories) */
    category: z.string().refine(
      (val) =>
        validCategorySlugs.includes(val.toLowerCase()) ||
        validCategoryNames.includes(val.toLowerCase()),
      {
        message: `Category must match one of the seven official categories: ${validCategorySlugs.join(', ')}`,
      }
    ),

    /** Author ID matching registry in src/data/authors.ts (defaults to 'editorial-desk') */
    author: z.string().default('editorial-desk'),

    /** Topic keywords for classification and search indexing */
    tags: z.array(z.string()).default([]),

    /** Editorial spotlight flag for homepage and category feature placements */
    featured: z.boolean().default(false),

    /** Draft state flag (draft articles are strictly excluded from production builds) */
    draft: z.boolean().default(false),

    /** Path or URL to editorial cover image (e.g. '/images/articles/my-image.webp') */
    coverImage: z.string().optional(),

    /** Descriptive accessibility alt text for cover image */
    coverImageAlt: z.string().optional(),

    /** Attribution or photo credit (e.g. 'NASA / ESA / STScI') */
    coverImageCredit: z.string().optional(),

    /** Caption displayed beneath cover image */
    coverImageCaption: z.string().optional(),

    /** Optional manual reading time override (e.g. '8 min read'); automatically calculated if omitted */
    readingTime: z.string().optional(),

    /** Optional search engine title override for SERP optimization */
    seoTitle: z.string().optional(),

    /** Optional meta description override for SERP optimization */
    seoDescription: z.string().optional(),

    /** Optional academic references, papers, and data source citations */
    references: z
      .array(
        z.union([
          z.string(),
          z.object({
            title: z.string(),
            url: z.string().optional(),
            source: z.string().optional(),
          }),
        ])
      )
      .default([]),

    /** Whether the article contains affiliate or sponsored product links */
    hasAffiliateLinks: z.boolean().default(false),

    /** Optional custom affiliate disclosure copy for specific partner programs */
    affiliateDisclosure: z.string().optional(),

    /** Transparent AI research assistance indicator */
    hasAiAssistance: z.boolean().default(true),
  }),
});

export const collections = { articles };
