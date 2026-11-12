# Signal Insight — Monetization & Traffic Growth Guide

This guide details the monetization architecture, traffic analytics, affiliate linking standards, and privacy compliance systems implemented across [signal-insight.pages.dev](https://signal-insight.pages.dev).

---

## 1. Architectural Principles

Signal Insight is an independent blogging and knowledge-sharing platform. Our monetization architecture is engineered with the following non-negotiable standards:

1. **Disabled by Default:** All advertising containers, third-party network scripts, and analytics collectors remain **completely disabled** until you explicitly provide your genuine account IDs via environment variables.
2. **Zero Empty Containers & Zero Layout Shift (CLS):** When advertising is disabled, the website renders **zero empty boxes, borders, or blank gaps**. When advertising is enabled, containers reserve fixed min-heights matching standard IAB dimensions to eliminate Cumulative Layout Shift.
3. **No Hardcoded Credentials:** Account IDs and network configurations are managed securely via environment variables in the Cloudflare Pages dashboard. Private API keys are never committed to git.
4. **Independent Identity:** We are independent bloggers, technologists, and knowledge curators. We openly disclose our use of AI research tools (ChatGPT, Claude, Gemini, Perplexity) paired with rigorous human review.

---

## 2. Environment Variables Reference

Configure these variables in your **Cloudflare Pages Dashboard** (`Project Settings > Environment variables`) or in a local `.env` file:

| Variable | Default | Purpose & Format |
| :--- | :--- | :--- |
| `PUBLIC_ADS_ENABLED` | `false` | Master switch for advertising. Set to `"true"` to enable ad units. |
| `PUBLIC_ADSENSE_CLIENT_ID` | `null` | Your Google AdSense Publisher ID (e.g., `ca-pub-1234567890123456`). |
| `PUBLIC_GA_MEASUREMENT_ID` | `null` | Your Google Analytics 4 ID (e.g., `G-XXXXXXXXXX`). |
| `PUBLIC_GSC_VERIFICATION` | `null` | Your Google Search Console HTML meta tag verification string. |
| `PUBLIC_AFFILIATE_ENABLED` | `true` | Globally enables affiliate disclosures and module formatting. |
| `PUBLIC_CONSENT_ENABLED` | `true` | Enables the GDPR/ePrivacy/CCPA privacy consent banner. |
| `PUBLIC_AD_ARTICLE_ABOVE_FOLD` | `true` | Controls the ad placement below the article header (if ads enabled). |
| `PUBLIC_AD_ARTICLE_IN_CONTENT` | `true` | Controls mid-article in-feed ad placement (if ads enabled). |
| `PUBLIC_AD_ARTICLE_POST_ARTICLE` | `true` | Controls post-article ad placement (if ads enabled). |
| `PUBLIC_AD_ARTICLE_SIDEBAR` | `true` | Controls desktop sticky sidebar ad placement (if ads enabled). |
| `PUBLIC_AD_HOMEPAGE_MID_FEED` | `true` | Controls homepage transition ad placement (if ads enabled). |

---

## 3. Advertising Integration (Google AdSense & Networks)

### Placements Available
* **Article Above-Fold:** Renders after the article metadata and intro (`ArticleAd position="above-fold"`).
* **Article Mid-Content:** Renders between key paragraphs (`ArticleAd position="in-content"`).
* **Article Post-Content:** Renders at the conclusion of the article, before citations and author box (`ArticleAd position="post-article"`).
* **Desktop Sidebar:** Sticky placement in the right-hand column beneath the Table of Contents (`SidebarAd`).
* **Homepage Transition:** Horizontal responsive banner between the Latest Articles feed and Popular stream (`HomepageAd`).

### Step-by-Step Activation (Once Approved)
1. Apply directly through [Google AdSense](https://adsense.google.com/) with your production custom domain (`https://signal-insight.pages.dev`).
2. Once approved, note your publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`).
3. In Cloudflare Pages:
   - Navigate to **Workers & Pages** > **Signal Insight** > **Settings** > **Environment variables**.
   - Add `PUBLIC_ADS_ENABLED = "true"`.
   - Add `PUBLIC_ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX"`.
   - Save and trigger a deployment.
4. All ad placements will activate automatically with compliant "ADVERTISEMENT" micro-labels and responsive containers.

---

## 4. Affiliate Monetization & Ethical Disclosures

Signal Insight supports legitimate affiliate relationships for recommending genuinely useful developer tools, software platforms, and science books.

### FTC & Search Engine Compliance
Whenever an article contains affiliate links:
1. In the Markdown frontmatter, set:
   ```yaml
   hasAffiliateLinks: true
   ```
2. The article page automatically renders an FTC-compliant **Affiliate & Sponsorship Disclosure Box** before the article body.
3. **Link Attribute Standard:** Always apply sponsored and nofollow link attributes to affiliate links:
   ```html
   <a href="https://partner.example.com/deal" rel="sponsored nofollow noopener" target="_blank">
     Tool Name
   </a>
   ```
4. **Editorial Integrity Rule:** Never fabricate product reviews, testing experiences, pricing discounts, or endorsements. Only recommend software or tools that have been genuinely researched.

---

## 5. Traffic Analytics & Search Console

### Google Analytics 4 (GA4) with Consent Mode v2
* To activate GA4, add `PUBLIC_GA_MEASUREMENT_ID = "G-XXXXXXXXXX"`.
* The site automatically initializes **Google Consent Mode v2**:
  * Default state: `analytics_storage: 'denied'`, `ad_storage: 'denied'`, `ad_user_data: 'denied'`, `ad_personalization: 'denied'`.
  * When a visitor clicks **"Accept All"** on the consent banner, consent signals update instantly without requiring a page reload.
  * If a visitor clicks **"Essential Only"**, non-essential cookies remain blocked.

### Google Search Console Verification
* To verify domain ownership in Google Search Console:
  1. Choose **HTML tag** verification method in Search Console.
  2. Copy the content code (e.g. `google-site-verification=abcdef123456...`).
  3. Set `PUBLIC_GSC_VERIFICATION = "abcdef123456..."` in Cloudflare Pages.
  4. Deploy and click **Verify** in Search Console.

---

## 6. Privacy & Cookie Consent Management

The built-in consent banner (`CookieConsent.astro`) complies with international privacy frameworks (GDPR, ePrivacy Directive, CCPA):
* **Zero Bloat:** Pure vanilla JavaScript (< 2 KB), zero heavy external tracking libraries (like OneTrust or Cookiebot) that hurt page speed.
* **Persistent Preference:** Stores the visitor's choice in `localStorage` (`msc_consent_status`).
* **Direct Policy Links:** Links directly to your transparent `/privacy-policy/` and `/terms/`.

---

## 7. Content Discoverability & Growth Checklist

To maximize organic search traffic and reader retention:
1. **Taxonomy Tags:** Add 3–5 specific tags to each article. Tags are now clickable links that open instant filtered search results.
2. **Related Stories:** The upgraded recommendation algorithm scores candidate articles by matching category (+5) and shared tags (+2 per tag).
3. **Sequential Navigation:** Previous and Next analysis links keep readers engaged within knowledge streams.
4. **Structured Data:** Every article outputs `NewsArticle`, `TechArticle`, and `BreadcrumbList` JSON-LD schemas.
5. **Fast Static Delivery:** Static HTML generated with zero client-side hydration overhead ensures perfect 100/100 Core Web Vitals on mobile and desktop.

