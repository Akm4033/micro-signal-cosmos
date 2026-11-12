# Signal Insight — Production Deployment Guide

*Discover More. Understand Better.*

This guide provides step-by-step instructions for deploying the **Signal Insight** static publishing platform to production.

---

## 1. Architecture & Build Overview

- **Framework:** Astro 7.4.7 (Static Site Generation / SSG)
- **Styling:** Tailwind CSS 4.3.5 with `@tailwindcss/vite`
- **Output Directory:** `dist/`
- **Build Command:** `npm run build`
- **Node Version Requirement:** `>= 22.23.4` (LTS recommended)

The website compiles to 100% static HTML, CSS, client-side assets, RSS 2.0 XML, and XML Sitemap. It requires no server-side Node.js daemon or persistent database runtime.

---

## 2. Hosting Platform Evaluation & Recommendation

| Feature | Cloudflare Pages (Recommended) | Netlify | Vercel |
| :--- | :--- | :--- | :--- |
| **Bandwidth (Free Tier)** | **Unlimited** | 100 GB / month | 100 GB / month |
| **Global Edge Network** | 300+ Edge Data Centers | High-Performance CDN | Global Edge Network |
| **DDoS & Security** | Enterprise-grade Cloudflare Shield | Standard Protection | Standard Protection |
| **Contact Form Backend** | External (Formspree / Web3Forms) | **Native Built-in Forms** | External / Serverless API |
| **Build Limits (Free)** | 500 builds / month | 300 build mins / month | 6,000 build mins / month |
| **Commercial Terms** | Generous, creator-friendly | Fair use limits | Strict non-commercial limit on hobby tier |

### Primary Recommendation: Cloudflare Pages
**Cloudflare Pages** is recommended as the primary hosting platform for Signal Insight:
1. **Unlimited Bandwidth:** Crucial for a media magazine as traffic grows and articles circulate on social platforms.
2. **Lowest Global Latency:** Direct integration with Cloudflare's Anycast edge delivers sub-50ms TTFB worldwide.
3. **HTTP/3 & Automatic Brotli/Gzip:** Enabled automatically out-of-the-box.
4. **Zero Cost & Zero Lock-in:** The static build outputs standard HTML without proprietary runtime dependencies.

*(Secondary Choice: If you prefer handling contact form submissions without any third-party account, **Netlify** is supported via the included `netlify.toml` file.)*

---

## 3. Cloudflare Pages Deployment (Step-by-Step)

### Step 1: Push Code to GitHub
Ensure all code is committed to your repository:
```bash
git remote -v
# origin  https://github.com/Akm4033/Signal Insight.git
```

### Step 2: Connect Repository to Cloudflare Pages
1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, select **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub account and choose `Signal Insight`.
4. Click **Begin setup**.

### Step 3: Configure Build Settings
Fill in the deployment settings:
- **Project Name:** `Signal Insight`
- **Production Branch:** `main`
- **Framework Preset:** `Astro`
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`

### Step 4: Configure Environment Variables
Under **Environment Variables (Advanced)**, add:
- `NODE_VERSION` = `22.23.4`
- `SITE_URL` = `https://yourdomain.com` *(Replace with your approved production domain once registered)*

Click **Save and Deploy**. Cloudflare will build the site and provide a live `*.pages.dev` URL.

---

## 4. Custom Domain & DNS Setup

Once your domain is registered (e.g. at Cloudflare Registrar, Namecheap, Google Domains/Squarespace):

### A. If using Cloudflare DNS (Recommended):
1. In Cloudflare Pages, go to **Custom domains** > **Set up a custom domain**.
2. Enter your apex domain: `yourdomain.com`.
3. Cloudflare automatically provisions the CNAME and DNSSEC records.
4. Repeat for `www.yourdomain.com`.
5. Under **SSL/TLS**, set encryption mode to **Full (strict)**.
6. Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.

### B. If using an External DNS Registrar:
Add the following DNS records in your registrar's control panel:

| Type | Name / Host | Target / Destination | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` (or root) | `Signal Insight.pages.dev` | Auto / 1 Hour |
| **CNAME** | `www` | `Signal Insight.pages.dev` | Auto / 1 Hour |

*(Note: If your DNS registrar does not support CNAME flattening on root `@`, use their ALIAS/ANAME record or point nameservers directly to Cloudflare.)*

---

## 5. Contact Form Backend Activation (Zero-Code Via Environment Variable)

The contact form in `src/pages/contact.astro` is pre-engineered to activate automatically when an access key is detected in the environment:

### Primary Method: Web3Forms (Recommended for Cloudflare Pages)
1. Visit [web3forms.com](https://web3forms.com/) and enter your destination email address to generate a free Access Key.
2. In your **Cloudflare Pages Dashboard**, navigate to **Settings** > **Environment variables**.
3. Add a new variable:
   - **Variable name:** `PUBLIC_WEB3FORMS_KEY`
   - **Value:** `your-access-key-here`
4. Re-deploy the site (or push a commit). The form automatically transitions from the "In Preparation" notice to the live Web3Forms submission relay with honeypot spam protection.

### Alternative Method: Formspree
1. Create a free form at [formspree.io](https://formspree.io/) and copy your Form ID.
2. In `src/pages/contact.astro`, set the form action to `https://formspree.io/f/{YOUR_FORM_ID}`.

---

## 6. Search Engine Onboarding (Post-Launch)

Do **NOT** submit search console verifications until the real production domain is live.

### Google Search Console
1. Visit [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property and verify via DNS TXT record, OR choose **URL prefix** and download the verification HTML file into `public/`.
3. Under **Sitemaps**, submit: `https://yourdomain.com/sitemap.xml`.
4. Verify indexing of the root URL and the 3 published articles.

### Bing Webmaster Tools
1. Visit [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Import directly from verified Google Search Console (one click).
3. Confirm that `https://yourdomain.com/sitemap.xml` is recognized.

---

## 7. Rollback & Redeployment Strategy

- **Instant Rollback:**
  - Both Cloudflare Pages and Netlify store immutable artifacts for every build deployment.
  - In the event of an unwanted change, navigate to the **Deployments** tab in the dashboard, find the previously working commit, and click **Rollback to this deployment**. The previous version goes live at the edge in under 5 seconds.
- **Preview Deployments:**
  - Every pull request or non-main branch automatically receives a private preview URL (`https://<branch>.Signal Insight.pages.dev`) for testing prior to merging to `main`.

