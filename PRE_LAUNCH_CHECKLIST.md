# Micro Signal Cosmos — Pre-Launch Checklist

*Review and complete these items prior to announcing the website publicly.*

---

## Phase 1: Domain & Infrastructure (Owner Action Required)

- [ ] **Domain Approval & Purchase:**
  - Secure the official production domain (e.g. `microsignalcosmos.com`).
  - Configure DNS records to point to the chosen hosting provider (Cloudflare Pages or Netlify).
- [ ] **SSL / TLS Certificate:**
  - Verify HTTPS certificate is active (`Full (strict)` mode on Cloudflare).
  - Verify HTTP to HTTPS automatic redirect is operational.
- [ ] **Environment Variable Configuration:**
  - Set `SITE_URL=https://yourdomain.com` in your hosting dashboard build settings.
  - Re-run production build to verify canonical URLs, Open Graph tags, Sitemap, and RSS feed use the real domain.

---

## Phase 2: Legal & Informational Readiness (Completed)

All editorial placeholders have been replaced with honest, digital-first publication disclosures and contact channels:

- [x] **`src/pages/contact.astro`**: Formalized editorial inboxes (`editorial@microsignalcosmos.com`, `corrections@microsignalcosmos.com`, `contact@microsignalcosmos.com`) with clean digital-first publishing disclosures.
- [x] **`src/pages/privacy-policy.astro` & `src/pages/privacy.astro`**: Established effective date (November 2026), dedicated privacy desk (`privacy@microsignalcosmos.com`), and dual-route support (`/privacy` and `/privacy-policy`).
- [x] **`src/pages/terms.astro`**: Clean terms of service with designated legal desk (`legal@microsignalcosmos.com`) and standard electronic publishing governance.
- [x] **`src/pages/disclaimer.astro`**: Clear educational, scientific, and technical disclaimers with direct corrections and reader communication channels.
- [x] **Monetization Architecture**: Pre-allocated zero-CLS ad placement slots (Above-the-fold, Mid-article in-feed, Post-article) ready for ad network script insertion.

---

## Phase 3: Interactive Features & Socials

- [ ] **Contact Form Activation:**
  - Obtain a free access key at [web3forms.com](https://web3forms.com/).
  - Add `PUBLIC_WEB3FORMS_KEY` in your Cloudflare Pages environment variables.
  - Test submission delivery to your inbox.
  - The form automatically handles honeypot spam protection and live dispatch.
- [ ] **Social Media Verification:**
  - Verify Facebook link (`https://www.facebook.com/profile.php?id=61596288235891`).
  - Verify YouTube link (`https://www.youtube.com/@MicroSignalCosmos`).
  - Update any future handles (X / Bluesky / LinkedIn) in `Footer.astro` and `contact.astro`.

---

## Phase 4: Search Engines & Analytics (Post-Launch)

- [ ] **Google Search Console:**
  - Add domain property.
  - Submit sitemap URL: `https://yourdomain.com/sitemap.xml`.
  - Request indexing for the homepage.
- [ ] **Bing Webmaster Tools:**
  - Import property from Google Search Console.
  - Confirm sitemap status is `Success`.
- [ ] **RSS Feed Readers:**
  - Test `https://yourdomain.com/rss.xml` in an RSS validator (e.g. W3C Feed Validation Service) or feed reader.
- [ ] **Privacy-Focused Analytics (Optional):**
  - If adding analytics, choose a cookie-free, privacy-preserving provider (e.g. Cloudflare Web Analytics, Plausible, Fathom) to preserve privacy policy compliance without requiring cookie consent banners.

---

## Phase 5: Final Production Sanity Check

- [ ] Run `npm run build` locally or on CI/CD with `SITE_URL` set.
- [ ] Check 404 page by visiting `https://yourdomain.com/non-existent-page`.
- [ ] Test mobile navigation drawer on iOS and Android.
- [ ] Test live search and category filtering on `/articles/`.

