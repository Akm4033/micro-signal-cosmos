export interface Author {
  /** Unique author identifier used in article frontmatter (e.g. 'marina', 'kai', 'arun') */
  id: string;
  /** Full display name of the author */
  name: string;
  /** Professional role or title */
  role: string;
  /** Biographical description */
  bio: string;
  /** List of technical expertise domains */
  expertise?: string[];
  /** Accent brand color code */
  color?: string;
  /** Path to author photograph/avatar */
  avatar?: string;
  /** Short 2-letter monogram initials used for avatar badge */
  initials: string;
  /** Optional verified public links */
  socials?: {
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

/**
 * Author Personas for Micro Signal Cosmos (Disclosed as domain lenses)
 */
export const AUTHORS: Record<string, Author> = {
  marina: {
    id: 'marina',
    name: 'Dr. Marina Kowalski',
    role: 'Systems Engineer',
    bio: 'Marina builds and dissects the invisible infrastructure powering the modern web. She spent a decade optimizing JavaScript engines at Google and now writes about the systems nobody notices—until they break.',
    expertise: ['Distributed Systems', 'Browser Internals', 'WebAssembly', 'Performance Engineering'],
    color: '#0ea5e9',
    avatar: '/authors/marina/avatar.svg',
    initials: 'MK',
    socials: {
      website: '/about/',
    },
  },
  kai: {
    id: 'kai',
    name: 'Kai Nakamura',
    role: 'ML Engineer',
    bio: "Kai builds the plumbing that makes AI useful—retrieval systems, serving infrastructure, evaluation harnesses. He's deployed models from 7B to 70B parameters in production and has the cloud bills to prove it.",
    expertise: ['LLM Training', 'Inference Optimization', 'RAG Systems', 'Model Evaluation'],
    color: '#10b981',
    avatar: '/authors/kai/avatar.svg',
    initials: 'KN',
    socials: {
      website: '/about/',
    },
  },
  arun: {
    id: 'arun',
    name: 'Dr. Arun Mehta',
    role: 'Astrophysicist',
    bio: "Arun studies the chemical fingerprints of distant galaxies using the world's largest telescopes. He believes the best science writing reconstructs the detective story behind every discovery.",
    expertise: ['Observational Astrophysics', 'Spectroscopy', 'Scientific Method', 'Instrumentation'],
    color: '#8b5cf6',
    avatar: '/authors/arun/avatar.svg',
    initials: 'AM',
    socials: {
      website: '/about/',
    },
  },
  // Fallback for legacy editorial-desk references
  'editorial-desk': {
    id: 'editorial-desk',
    name: 'Micro Signal Cosmos',
    role: 'Technical Publication',
    bio: 'Independent technical publication exploring technology, systems architecture, AI infrastructure, and observational science.',
    initials: 'MSC',
    color: '#0ea5e9',
    avatar: '/authors/marina/avatar.svg',
    socials: {
      website: '/about/',
    },
  },
};

/**
 * Resolves an author ID or name to a verified Author profile.
 * Defaults to the genuine Editorial Desk profile if unassigned or matching legacy editorial strings.
 *
 * @param authorIdOrName - Author ID (e.g. 'editorial-desk') or full name
 * @returns Resolved Author profile
 */
export function getAuthor(authorIdOrName?: string | null): Author {
  if (!authorIdOrName) {
    return AUTHORS['editorial-desk'];
  }

  const normalized = authorIdOrName.trim().toLowerCase();

  // 1. Direct ID match in registry
  if (AUTHORS[normalized]) {
    return AUTHORS[normalized];
  }

  // 2. Name match in registry
  const matched = Object.values(AUTHORS).find(
    (a) => a.name.toLowerCase() === normalized
  );
  if (matched) {
    return matched;
  }

  // 3. Fallback for legacy editorial variations
  if (normalized.includes('editorial') || normalized.includes('micro signal cosmos')) {
    return AUTHORS['editorial-desk'];
  }

  // 4. Safe dynamic representation for any genuine new author name entered directly in frontmatter
  const cleanName = authorIdOrName.trim();
  const initials = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return {
    id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: cleanName,
    role: 'Contributing Author',
    bio: `${cleanName} writes and researches for Micro Signal Cosmos.`,
    initials: initials || 'MS',
  };
}
