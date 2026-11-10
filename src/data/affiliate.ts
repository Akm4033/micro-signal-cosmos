export interface AffiliateTool {
  id: string;
  name: string;
  category: 'Cloud & Infrastructure' | 'AI & ML Infrastructure' | 'Databases & Backend' | 'Developer Productivity & Security';
  description: string;
  link: string;
  tag: string;
  featured?: boolean;
}

export const AFFILIATE_TOOLS: AffiliateTool[] = [
  // Cloud & Infrastructure
  {
    id: 'hetzner',
    name: 'Hetzner Cloud',
    category: 'Cloud & Infrastructure',
    description: 'Unbeatable price-to-performance dedicated and cloud servers in Europe and North America. Our top recommendation for self-hosting.',
    link: 'https://hetzner.cloud/?ref=microsignal',
    tag: 'VPS & Dedicated Servers',
    featured: true,
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'Cloud & Infrastructure',
    description: 'Developer-friendly cloud platform with intuitive Droplets, managed Kubernetes, and managed databases.',
    link: 'https://www.digitalocean.com/?ref=microsignal',
    tag: 'Cloud Compute',
  },
  // AI & ML Infrastructure
  {
    id: 'lambdalabs',
    name: 'Lambda Labs',
    category: 'AI & ML Infrastructure',
    description: 'The most cost-effective on-demand GPU cloud for LLM fine-tuning, training, and vLLM inference clusters.',
    link: 'https://lambdalabs.com/?via=microsignal',
    tag: 'GPU Cloud',
    featured: true,
  },
  {
    id: 'qdrant',
    name: 'Qdrant Cloud',
    category: 'AI & ML Infrastructure',
    description: 'High-performance open-source vector search engine written in Rust with production-grade hybrid search and filtering.',
    link: 'https://qdrant.tech/?partner=microsignal',
    tag: 'Vector Database',
    featured: true,
  },
  // Databases & Backend
  {
    id: 'neon',
    name: 'Neon',
    category: 'Databases & Backend',
    description: 'Serverless Postgres with instant branching, bottomless storage, and scale-to-zero compute economics.',
    link: 'https://neon.tech/?utm_source=microsignal',
    tag: 'Serverless Postgres',
    featured: true,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Databases & Backend',
    description: 'The open-source Firebase alternative: Postgres database, authentication, instant APIs, and edge functions.',
    link: 'https://supabase.com/?utm_source=microsignal',
    tag: 'Postgres & Backend',
  },
  {
    id: 'turso',
    name: 'Turso',
    category: 'Databases & Backend',
    description: 'Distributed database powered by libSQL (open-source SQLite fork). Ultra-low latency edge data replicated worldwide.',
    link: 'https://turso.tech/?ref=microsignal',
    tag: 'Edge SQLite',
  },
  {
    id: 'upstash',
    name: 'Upstash',
    category: 'Databases & Backend',
    description: 'Serverless Redis, Kafka, and Vector data services with per-request pricing and zero connection management headaches.',
    link: 'https://upstash.com/?utm_source=microsignal',
    tag: 'Serverless Redis',
  },
  // Developer Productivity & Security
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'Developer Productivity & Security',
    description: 'Complete user management and authentication. Flawless passkey, WebAuthn, and multi-session architecture.',
    link: 'https://clerk.com/?ref=microsignal',
    tag: 'Auth & Passkeys',
    featured: true,
  },
  {
    id: '1password',
    name: '1Password',
    category: 'Developer Productivity & Security',
    description: 'Industry standard for secrets management, passkey synchronization, and secure developer credential storage.',
    link: 'https://1password.com/?aff=microsignal',
    tag: 'Passkeys & Security',
  },
  {
    id: 'yubikey',
    name: 'YubiKey',
    category: 'Developer Productivity & Security',
    description: 'Hardware security keys providing phishing-resistant FIDO2/WebAuthn authentication for developers and infrastructure.',
    link: 'https://www.yubico.com/?aff=microsignal',
    tag: 'Hardware Security',
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    category: 'Developer Productivity & Security',
    description: 'Lightweight, cookie-free, privacy-first web analytics. Fully GDPR/CCPA compliant out of the box.',
    link: 'https://plausible.io/?ref=microsignal',
    tag: 'Privacy Analytics',
  },
  {
    id: 'miniflux',
    name: 'Miniflux',
    category: 'Developer Productivity & Security',
    description: 'Minimalist, open-source, opinionated feed reader written in Go. Free, self-hostable, and fast.',
    link: 'https://miniflux.app/',
    tag: 'RSS & Syndication',
  },
  {
    id: 'raycast',
    name: 'Raycast',
    category: 'Developer Productivity & Security',
    description: 'Blazing fast, extensible launcher that replaces Spotlight with developer scripts, snippets, and window management.',
    link: 'https://raycast.com/?ref=microsignal',
    tag: 'Developer Workflow',
  },
  {
    id: 'warp',
    name: 'Warp',
    category: 'Developer Productivity & Security',
    description: 'Modern Rust-based terminal built for speed, collaborative debugging, and integrated AI command generation.',
    link: 'https://warp.dev/?ref=microsignal',
    tag: 'Terminal',
  },
];
