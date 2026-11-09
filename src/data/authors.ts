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
  marina: {
    key: 'marina',
    name: 'Marina Kowalski',
    role: 'Systems Engineer',
    bio: 'Marina builds and dissects the invisible infrastructure powering the modern web. She spent a decade optimizing JavaScript engines at Google and now writes about the systems nobody notices—until they break.',
    avatar: '/authors/marina/avatar.svg',
    color: '#0ea5e9',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    initials: 'MK',
    links: {
      github: 'https://github.com/mkowalski',
      mastodon: 'https://hachyderm.io/@marina',
      site: 'https://marinakowalski.dev',
    },
  },
  kai: {
    key: 'kai',
    name: 'Kai Nakamura',
    role: 'ML Engineer',
    bio: 'Kai builds the plumbing that makes AI useful—retrieval systems, serving infrastructure, evaluation harnesses. He has deployed models from 7B to 70B parameters in production and has the cloud bills to prove it.',
    avatar: '/authors/kai/avatar.svg',
    color: '#10b981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    initials: 'KN',
    links: {
      github: 'https://github.com/k-nakamura',
      blog: 'https://kai.fyi',
      huggingface: 'https://huggingface.co/knakamura',
    },
  },
  arun: {
    key: 'arun',
    name: 'Arun Mehta',
    role: 'Astrophysicist',
    bio: 'Arun studies the chemical fingerprints of distant galaxies using the world\'s largest telescopes. He believes the best science writing reconstructs the detective story behind every discovery.',
    avatar: '/authors/arun/avatar.svg',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    initials: 'AM',
    links: {
      orcid: 'https://orcid.org/0000-0002-XXXX-XXXX',
      scholar: 'https://scholar.google.com/citations?user=XXXX',
      twitter: 'https://x.com/arunmehta_astro',
    },
  },
};

export function getAuthor(key: string): Author {
  return authors[key] || authors.marina;
}

export function getAllAuthors(): Author[] {
  return Object.values(authors);
}
