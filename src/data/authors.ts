import { site } from '../config/site';

export interface Author {
  key: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  color?: string;
  bgColor?: string;
  initials?: string;
  links: Record<string, string>;
}

export const authors: Record<string, Author> = {
  editor: {
    key: 'editor',
    name: site.author.name,
    role: site.author.credential,
    bio: site.author.bio,
    avatar: '/favicon.svg',
    color: '#2563eb',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    initials: 'ED',
    links: {
      about: '/about/',
      github: 'https://github.com/Akm4033/signal-insight',
    },
  },
  'editorial-desk': {
    key: 'editorial-desk',
    name: 'Signal Insight',
    role: 'Editorial & Research Desk',
    bio: 'Independent technical knowledge platform exploring systems infrastructure, AI/ML architectures, and observational astrophysics through rigorous research and reproducible code.',
    avatar: '/favicon.svg',
    color: '#1d4ed8',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    initials: 'SI',
    links: {
      github: 'https://github.com/Akm4033/signal-insight',
      about: '/about/',
    },
  },
  marina: {
    key: 'marina',
    name: 'Signal Insight',
    role: 'Systems & Infrastructure',
    bio: 'Technical investigations into browser engines, CPU architecture, WebAssembly, networking, TLS 1.3, and production database internals.',
    avatar: '/favicon.svg',
    color: '#1d4ed8',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    initials: 'SI',
    links: {
      github: 'https://github.com/Akm4033/signal-insight',
      about: '/about/',
    },
  },
  kai: {
    key: 'kai',
    name: 'Signal Insight',
    role: 'AI & Machine Learning',
    bio: 'Algorithmic explorations into transformer architectures, inference economics, RAG systems, and evaluation benchmarks.',
    avatar: '/favicon.svg',
    color: '#059669',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    initials: 'SI',
    links: {
      github: 'https://github.com/Akm4033/signal-insight',
      about: '/about/',
    },
  },
  arun: {
    key: 'arun',
    name: 'Signal Insight',
    role: 'Science & Physics',
    bio: 'Rigorous deep dives into observational astrophysics, stellar spectroscopy, exoplanet atmospheres, and nuclear fusion.',
    avatar: '/favicon.svg',
    color: '#7c3aed',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    initials: 'SI',
    links: {
      github: 'https://github.com/Akm4033/signal-insight',
      about: '/about/',
    },
  },
};

export function getAuthor(key?: string): Author {
  if (!key) return authors.editor || authors['editorial-desk'];
  return authors[key] || authors.editor || authors['editorial-desk'];
}

export function getAllAuthors(): Author[] {
  return Object.values(authors);
}
