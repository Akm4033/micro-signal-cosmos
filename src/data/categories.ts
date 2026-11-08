export interface Category {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  href: string;
  number: string;
  icon: string;
  accent: 'sky' | 'purple';
}

export const CATEGORIES: Category[] = [
  {
    number: '01',
    slug: 'technology',
    name: 'Technology',
    shortName: 'Technology',
    description: 'Explore modern technologies, computing, gadgets and the innovations transforming our world.',
    href: '/category/technology/',
    icon: '01',
    accent: 'sky',
  },
  {
    number: '02',
    slug: 'science',
    name: 'Science',
    shortName: 'Science',
    description: 'Discover scientific discoveries, research, space, physics and the mysteries of nature.',
    href: '/category/science/',
    icon: '02',
    accent: 'purple',
  },
  {
    number: '03',
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    description: 'Understand AI, machine learning, automation and the future of intelligent systems.',
    href: '/category/artificial-intelligence/',
    icon: 'AI',
    accent: 'sky',
  },
  {
    number: '04',
    slug: 'digital-world',
    name: 'Digital World',
    shortName: 'Digital World',
    description: 'Navigate the internet, cybersecurity, digital trends and our connected lives.',
    href: '/category/digital-world/',
    icon: '04',
    accent: 'purple',
  },
  {
    number: '05',
    slug: 'tutorials',
    name: 'Tutorials & How-to Guides',
    shortName: 'Tutorials',
    description: 'Learn practical skills through clear explanations, step-by-step guides and useful tutorials.',
    href: '/category/tutorials/',
    icon: '05',
    accent: 'sky',
  },
  {
    number: '06',
    slug: 'software-tools',
    name: 'Software & Digital Tools',
    shortName: 'Tools',
    description: 'Discover software, useful applications, digital platforms and productivity tools.',
    href: '/category/software-tools/',
    icon: '06',
    accent: 'purple',
  },
  {
    number: '07',
    slug: 'innovation',
    name: 'Innovation & Discoveries',
    shortName: 'Innovation',
    description: 'Explore emerging ideas, breakthroughs, inventions and technologies shaping tomorrow.',
    href: '/category/innovation/',
    icon: '07',
    accent: 'sky',
  },
];
