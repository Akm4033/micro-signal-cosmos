import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORIES } from './data/categories';

// Official valid category values (both slugs and formal names accepted)
const validSlugs = CATEGORIES.map((c) => c.slug);
const validNames = CATEGORIES.map((c) => c.name.toLowerCase());

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().refine(
      (val) => validSlugs.includes(val.toLowerCase()) || validNames.includes(val.toLowerCase()),
      {
        message: `Category must match one of the seven official categories: ${validSlugs.join(', ')}`,
      }
    ),
    author: z.string().default('Micro Signal Cosmos Editorial'),
    coverImage: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
  }),
});

export const collections = { articles };

