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

## Phase 2: Legal & Informational Placeholders (Owner Confirmation Required)

Replace the bracketed `[...]` editorial placeholders across the following files:

### 1. `src/pages/contact.astro`
- [ ] Replace `[editorial@microsignalcosmos.com]` with confirmed inbox.
- [ ] Replace `[corrections@microsignalcosmos.com]` with confirmed inbox.
- [ ] Replace `[contact@microsignalcosmos.com]` with confirmed inbox.
- [ ] Replace `[Publisher Address: To be specified upon registration]` with physical or mailing address.
- [ ] Replace `[Operational Jurisdiction: To be confirmed]` with registered state/country.

### 2. `src/pages/privacy-policy.astro`
- [ ] Confirm `[Effective Date: November 2026]` and `[Last Revised: November 2026]`.
- [ ] Replace `[privacy@microsignalcosmos.com]` with dedicated privacy inbox.
- [ ] Replace `[Entity Name: To be confirmed by owner]` with official corporate or publishing trade entity.
- [ ] Replace `[Physical Address: To be confirmed by owner]` with mailing location.
- [ ] Replace `[Jurisdiction: To be confirmed by owner]` with governing legal jurisdiction.

### 3. `src/pages/terms.astro`
- [ ] Replace `[Your Governing Jurisdiction / State]` and `[Your Jurisdiction]` with legal venue (e.g., State of Delaware, UK, etc.).
- [ ] Replace `[legal@microsignalcosmos.com]` with legal contact address.
- [ ] Replace `[Entity Name: To be confirmed by owner]` with official entity name.

### 4. `src/pages/disclaimer.astro`
- [ ] Replace `[corrections@microsignalcosmos.com]` and `[contact@microsignalcosmos.com]`.
- [ ] Replace `[Entity Name: To be confirmed by owner]`.

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

