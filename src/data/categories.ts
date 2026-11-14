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
    description: 'Clear, foundational explorations of how computers, browsers, chips, and networks actually work under the hood.',
    href: '/category/technology/',
    icon: '01',
    accent: 'sky',
  },
  {
    number: '02',
    slug: 'artificial-intelligence',
    name: 'AI & ML',
    shortName: 'AI & ML',
    description: 'Demystifying neural networks, transformer architectures, and machine learning from first principles and code.',
    href: '/category/artificial-intelligence/',
    icon: 'AI',
    accent: 'emerald',
  },
  {
    number: '03',
    slug: 'science',
    name: 'Science',
    shortName: 'Science',
    description: 'Exploring astrophysics, stellar spectroscopy, cosmic discoveries, and energy physics for curious minds.',
    href: '/category/science/',
    icon: '02',
    accent: 'purple',
  },
  {
    number: '04',
    slug: 'developer-tools',
    name: 'Developer Tools',
    shortName: 'Dev Tools',
    description: 'Practical, accessible guides to modern databases, self-hosting, web cryptography, and builder infrastructure.',
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

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  'developer-tools': 'Developer Tools',
  'devtools': 'Developer Tools',
  'artificial-intelligence': 'Artificial Intelligence',
  'ai': 'Artificial Intelligence',
  'technology': 'Technology',
  'tech': 'Technology',
  'science': 'Science',
  'digital-world': 'Technology',
  'innovation': 'Technology',
  'tutorials': 'Developer Tools',
  'software-tools': 'Developer Tools',
};

export function formatCategoryLabel(raw?: string | null): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  if (CATEGORY_DISPLAY_MAP[key]) return CATEGORY_DISPLAY_MAP[key];
  return raw
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
