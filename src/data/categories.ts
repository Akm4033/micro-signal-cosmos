export interface Category {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  href: string;
  number: string;
  icon: string;
  accent: 'sky' | 'purple' | 'emerald';
}

export const CATEGORIES: Category[] = [
  {
    number: '01',
    slug: 'technology',
    name: 'Technology',
    shortName: 'Technology',
    description: 'Browser internals, CPU architecture, WebAssembly, networking, and core computing systems.',
    href: '/category/technology/',
    icon: '01',
    accent: 'sky',
  },
  {
    number: '02',
    slug: 'artificial-intelligence',
    name: 'AI & ML',
    shortName: 'AI & ML',
    description: 'LLM training and inference, RAG systems, model evaluation, AI tooling, and engineering workflows.',
    href: '/category/artificial-intelligence/',
    icon: 'AI',
    accent: 'emerald',
  },
  {
    number: '03',
    slug: 'science',
    name: 'Science',
    shortName: 'Science',
    description: 'Astrophysics, nuclear fusion, particle physics, observational cosmology, and scientific inquiry.',
    href: '/category/science/',
    icon: '02',
    accent: 'purple',
  },
  {
    number: '04',
    slug: 'developer-tools',
    name: 'Developer Tools',
    shortName: 'Dev Tools',
    description: 'Databases, caching, search engines, observability, self-hosting infrastructure, and CLI tools.',
    href: '/category/developer-tools/',
    icon: '03',
    accent: 'sky',
  },
];

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'digital-world': 'technology',
  'innovation': 'technology',
  'tutorials': 'developer-tools',
  'software-tools': 'developer-tools',
  'tutorials & how-to guides': 'developer-tools',
  'software & digital tools': 'developer-tools',
  'innovation & discoveries': 'technology',
};

export function getCategoryInfo(slugOrName?: string | null): Category {
  if (!slugOrName) return CATEGORIES[0];
  const normalized = slugOrName.trim().toLowerCase();

  const direct = CATEGORIES.find(
    (c) => c.slug === normalized || c.name.toLowerCase() === normalized
  );
  if (direct) return direct;

  const mappedSlug = LEGACY_CATEGORY_MAP[normalized];
  if (mappedSlug) {
    const mapped = CATEGORIES.find((c) => c.slug === mappedSlug);
    if (mapped) return mapped;
  }

  return CATEGORIES[0];
}
