export interface Author {
  /** Unique author identifier used in article frontmatter (e.g. 'editorial-desk') */
  id: string;
  /** Full display name of the author or collective */
  name: string;
  /** Professional role or title */
  role: string;
  /** Brief biographical description */
  bio: string;
  /** Optional path or URL to author photograph/avatar */
  avatar?: string;
  /** Short 2-3 letter monogram initials used for avatar badge */
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
 * Centralized registry of authors for Micro Signal Cosmos.
 *
 * NOTE: Only genuine, verified contributors are registered here.
 * To add a new real contributor, append their profile below using a unique ID key.
 */
export const AUTHORS: Record<string, Author> = {
  'editorial-desk': {
    id: 'editorial-desk',
    name: 'Micro Signal Cosmos Editorial Desk',
    role: 'Editorial Collective & Technical Fact-checking',
    bio: 'Our multidisciplinary editorial collective synthesizes complex developments in computing, astrophysics, artificial intelligence, and digital infrastructure into grounded, peer-level educational dispatches.',
    initials: 'MSC',
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
