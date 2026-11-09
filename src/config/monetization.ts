/**
 * Micro Signal Cosmos - Monetization, Analytics & Privacy Configuration
 *
 * This configuration manages all advertising, affiliate, analytics, and consent settings.
 * All monetization and tracking integrations are DISABLED BY DEFAULT to ensure privacy,
 * performance, and compliance until explicitly configured with legitimate account IDs.
 *
 * Configuration is managed via environment variables (e.g., in Cloudflare Pages dashboard):
 * - PUBLIC_ADS_ENABLED: Set to "true" to activate advertising slots (default: false)
 * - PUBLIC_ADSENSE_CLIENT_ID: Your Google AdSense publisher ID (e.g., "ca-pub-XXXXXXXXXXXXXXXX")
 * - PUBLIC_GA_MEASUREMENT_ID: Your Google Analytics 4 ID (e.g., "G-XXXXXXXXXX")
 * - PUBLIC_GSC_VERIFICATION: Your Google Search Console HTML verification token
 * - PUBLIC_AFFILIATE_ENABLED: Set to "false" to globally disable affiliate modules (default: true)
 * - PUBLIC_CONSENT_ENABLED: Set to "false" to disable the privacy consent banner (default: true)
 */

export interface MonetizationConfig {
  ads: {
    enabled: boolean;
    adsenseClientId: string | null;
    placements: {
      articleAboveFold: boolean;
      articleInContent: boolean;
      articlePostArticle: boolean;
      articleSidebar: boolean;
      homepageMidFeed: boolean;
    };
  };
  analytics: {
    gaMeasurementId: string | null;
    gscVerification: string | null;
  };
  affiliate: {
    enabled: boolean;
    defaultDisclosureText: string;
  };
  consent: {
    enabled: boolean;
    cookieName: string;
    cookieMaxAgeDays: number;
  };
  aiDisclosure: {
    enabled: boolean;
    statement: string;
  };
}

// Helper to safely read environment variables across Astro SSR/SSG
const getEnv = (key: string): string | undefined => {
  return (
    (typeof process !== 'undefined' && process.env ? process.env[key] : undefined) ||
    (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as any)[key] : undefined)
  );
};

export const monetizationConfig: MonetizationConfig = {
  ads: {
    // Strictly disabled by default until verified in production environment
    enabled: getEnv('PUBLIC_ADS_ENABLED') === 'true',
    adsenseClientId: getEnv('PUBLIC_ADSENSE_CLIENT_ID') || null,
    placements: {
      articleAboveFold: getEnv('PUBLIC_AD_ARTICLE_ABOVE_FOLD') !== 'false',
      articleInContent: getEnv('PUBLIC_AD_ARTICLE_IN_CONTENT') !== 'false',
      articlePostArticle: getEnv('PUBLIC_AD_ARTICLE_POST_ARTICLE') !== 'false',
      articleSidebar: getEnv('PUBLIC_AD_ARTICLE_SIDEBAR') !== 'false',
      homepageMidFeed: getEnv('PUBLIC_AD_HOMEPAGE_MID_FEED') !== 'false',
    },
  },
  analytics: {
    // Disabled until valid measurement ID is provided
    gaMeasurementId: getEnv('PUBLIC_GA_MEASUREMENT_ID') || null,
    gscVerification: getEnv('PUBLIC_GSC_VERIFICATION') || null,
  },
  affiliate: {
    enabled: getEnv('PUBLIC_AFFILIATE_ENABLED') !== 'false',
    defaultDisclosureText:
      'Disclosure: Some links on Micro Signal Cosmos may be affiliate links. If you click through and make a purchase, we may earn an affiliate commission at no additional cost to you. We only recommend tools and resources we find genuinely useful.',
  },
  consent: {
    // Privacy consent banner enabled by default to respect GDPR, ePrivacy, and CCPA
    enabled: getEnv('PUBLIC_CONSENT_ENABLED') !== 'false',
    cookieName: 'msc_consent_status',
    cookieMaxAgeDays: 180,
  },
  aiDisclosure: {
    enabled: true,
    statement:
      'Micro Signal Cosmos is an independent blogging publication. We use modern AI tools (including ChatGPT, Claude, Gemini, and Perplexity) to assist with research and drafting. All published articles and tutorials are reviewed, edited, and verified by our human team to ensure genuine clarity and usefulness.',
  },
};

/**
 * Convenience helper to determine whether advertising should be rendered.
 */
export function isAdsEnabled(): boolean {
  return monetizationConfig.ads.enabled && Boolean(monetizationConfig.ads.adsenseClientId);
}

/**
 * Checks if a specific placement slot is enabled.
 */
export function isSlotEnabled(
  slot: 'above-fold' | 'in-content' | 'post-article' | 'sidebar' | 'homepage'
): boolean {
  if (!isAdsEnabled()) return false;
  switch (slot) {
    case 'above-fold':
      return monetizationConfig.ads.placements.articleAboveFold;
    case 'in-content':
      return monetizationConfig.ads.placements.articleInContent;
    case 'post-article':
      return monetizationConfig.ads.placements.articlePostArticle;
    case 'sidebar':
      return monetizationConfig.ads.placements.articleSidebar;
    case 'homepage':
      return monetizationConfig.ads.placements.homepageMidFeed;
    default:
      return false;
  }
}

