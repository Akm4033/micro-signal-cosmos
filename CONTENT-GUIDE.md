# Micro Signal Cosmos — Editorial Publishing & Content Guide

Welcome to the **Micro Signal Cosmos** editorial publishing guide. This document provides simple, step-by-step instructions for writers, editors, and contributors to draft, preview, format, and publish articles on [microsignalcosmos.com](https://microsignalcosmos.com).

No deep coding knowledge is required. All articles are written in plain text using standard **Markdown (`.md`)**.

---

## Table of Contents

1. [Quick-Start: Publishing in 4 Steps](#quick-start-publishing-in-4-steps)
2. [Copy-Paste Article Template](#copy-paste-article-template)
3. [Frontmatter Fields Explained](#frontmatter-fields-explained)
4. [Official Categories & Taxonomy](#official-categories--taxonomy)
5. [Author Registry & Identity Guidelines](#author-registry--identity-guidelines)
6. [Image Standards & File Management](#image-standards--file-management)
7. [Academic & Research References](#academic--research-references)
8. [Automatic Reading Time](#automatic-reading-time)
9. [Draft & Preview Workflow](#draft--preview-workflow)
10. [Git & Cloudflare Deployment Safety](#git--cloudflare-deployment-safety)

---

## 1. Quick-Start: Publishing in 4 Steps

Whenever you want to publish a new article:

1. **Create a file:** Inside the directory `src/content/articles/`, create a new file named `your-article-slug.md` (use lowercase letters and hyphens only).
2. **Paste the frontmatter:** Copy the template from [Section 2](#copy-paste-article-template) into the top of your file and fill in your article title, description, category, and tags.
3. **Write your article:** Use standard Markdown formatting underneath the `---` closing line.
4. **Publish:** Push your commit to the `main` branch on GitHub. Cloudflare Pages will automatically build and publish the live page in ~45 seconds.

---

## 2. Copy-Paste Article Template

Create a new file (e.g., `src/content/articles/quantum-computing-frontiers.md`) and paste this template:

```markdown
---
title: "The Next Frontier in Quantum Supercomputing"
description: "A comprehensive examination of how quantum coherence and error-correction algorithms are reshaping computational physics."
publishDate: 2026-11-10
category: "technology"
tags: ["Quantum Computing", "Physics", "Supercomputers", "Emerging Tech"]
author: "editorial-desk"
draft: false
featured: false
coverImage: "/images/articles/quantum-computing-frontiers-cover.webp"
coverImageAlt: "Cryogenic dilution refrigerator chamber housing a quantum processor chip"
coverImageCaption: "Superconducting quantum circuits operating inside a sub-kelvin cryostat."
coverImageCredit: "Micro Signal Cosmos Visual Research / Open Science Commons"
seoTitle: "The Next Frontier in Quantum Supercomputing | Micro Signal Cosmos"
seoDescription: "An in-depth analysis of quantum coherence and error mitigation transforming next-generation computational physics."
references:
  - title: "Quantum error correction using surface codes"
    url: "https://doi.org/10.1038/nature12345"
    source: "Nature Physics"
    accessDate: "2026-11-09"
  - title: "Cryogenic CMOS interfaces for scalable quantum processors"
    url: "https://ieeexplore.ieee.org/document/9876543"
    source: "IEEE Transactions on Quantum Engineering"
    accessDate: "2026-11-09"
---

## Introduction

Write an engaging, authoritative opening paragraph that clearly introduces the topic and contextualizes why it matters to modern technology, science, or society.

## Technological Foundations

Use second-level headings (`##`) for your primary article sections. These automatically populate the interactive **Table of Contents** on both desktop and mobile screens.

### Error Mitigation and Coherence

Use third-level headings (`###`) for subtopics. Avoid skipping heading levels (e.g., don't jump directly from `##` to `####`).

- **Key Finding 1:** Bullet points can highlight important technical insights.
- **Key Finding 2:** Explanations should balance technical depth with accessibility.

> "A pull-quote or highlighted quote block can emphasize critical editorial thoughts or direct citations from researchers."

## Practical Implications

Discuss what this development means for software engineers, scientists, and industry leaders.

## Conclusion

Summarize the primary takeaways and offer forward-looking perspective on future research directions.
```

---

## 3. Frontmatter Fields Explained

The metadata block between the triple-dashed lines (`---`) at the top of your article is called the **frontmatter**.

| Field Name | Type | Required? | Description & Example |
| :--- | :--- | :--- | :--- |
| `title` | string | **Yes** | The public display headline. Keep it clear, informative, and compelling. |
| `description` | string | **Yes** | 1–2 sentence summary (60–160 characters) used for article previews, category listings, and search results. |
| `publishDate` | date | **Yes** | ISO date (`YYYY-MM-DD`). Determines chronological sorting on the homepage and archives. |
| `updatedDate` | date | Optional | ISO date (`YYYY-MM-DD`) when substantial revisions or corrections occur. |
| `category` | string | **Yes** | Must match one of the 7 official category slugs or names (see [Section 4](#official-categories--taxonomy)). |
| `tags` | string[] | **Yes** | Array of 2 to 6 specific topic keywords (e.g. `["Artificial Intelligence", "Neural Networks"]`). |
| `author` | string | Optional | Defaults to `"editorial-desk"`. Must resolve to a valid registered ID or name in `src/data/authors.ts`. |
| `draft` | boolean | Optional | Defaults to `false`. Set to `true` while drafting to prevent premature publication. |
| `featured` | boolean | Optional | Defaults to `false`. When `true`, displays prominently in the homepage Featured hero carousel. |
| `coverImage` | string | Optional | Relative URL to image in `public/` (e.g. `"/images/articles/my-slug-cover.webp"`). |
| `coverImageAlt` | string | Optional | Descriptive alternative text for screen readers and SEO. Mandatory whenever `coverImage` is present. |
| `coverImageCaption` | string | Optional | Explanatory caption displayed directly beneath the image in the reader. |
| `coverImageCredit` | string | Optional | Attribution/source acknowledgment (e.g. `"NASA / JPL-Caltech"`). |
| `readingTime` | string | Optional | Manual override (e.g. `"8 min read"`). If omitted, **calculated automatically** at ~200 wpm. |
| `seoTitle` | string | Optional | Custom `<title>` tag for search engines (defaults to `{title} \| Micro Signal Cosmos`). |
| `seoDescription`| string | Optional | Custom meta description for search engines and social cards (defaults to `description`). |
| `references` | object[] | Optional | List of academic citations with `title`, `url`, `source`, and `accessDate` (see [Section 7](#academic--research-references)). |

---

## 4. Official Categories & Taxonomy

Micro Signal Cosmos enforces a consistent 7-category taxonomy. Always set `category` to one of the following exact slugs (or formal names):

| Slug | Display Name | Core Editorial Subject Matter |
| :--- | :--- | :--- |
| `technology` | **Technology** | Computing architectures, hardware, software systems, semiconductors, cloud infrastructure. |
| `science` | **Science** | Astrophysics, astronomy, physics, cosmology, biology, materials science, planetary research. |
| `artificial-intelligence` | **Artificial Intelligence** | Machine learning, neural architectures, LLMs, computer vision, robotics, AI ethics and governance. |
| `digital-world` | **Digital World** | Internet governance, cybersecurity, privacy protocols, network infrastructure, open-source culture. |
| `tutorials` | **Tutorials & How-to Guides** | Practical developer guides, technical workflows, step-by-step implementation walk-throughs. |
| `software-tools` | **Software & Digital Tools** | In-depth evaluations of developer tools, CLI utilities, databases, frameworks, productivity platforms. |
| `innovation` | **Innovation & Discoveries** | Breakthrough research, interdisciplinary advances, patents, energy transitions, next-generation concepts. |

---

## 5. Author Registry & Identity Guidelines

To protect reader trust and comply with search engine E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) criteria:

- **Default Editorial Identity:** All institutional and collaborative analysis is authored by `"editorial-desk"`, representing the **Micro Signal Cosmos Editorial Desk**.
- **No Fabricated Personas:** **Never create fictional author names, synthetic avatars, or false academic credentials.**
- **Adding Real Contributors:** When onboarding real-world human writers, engineers, or academic guest columnists, register their verified profile in `src/data/authors.ts`:
  ```typescript
  export const AUTHORS: Record<string, Author> = {
    'editorial-desk': { ... },
    'jane-doe': {
      id: 'jane-doe',
      name: 'Dr. Jane Doe',
      role: 'Guest Science Contributor',
      bio: 'Astrophysicist and researcher focusing on exoplanet atmospheres and spectroscopic observation.',
      expertise: ['Astrophysics', 'Cosmology', 'Observational Astronomy'],
    },
  };
  ```

---

## 6. Image Standards & File Management

All article cover photos, architectural diagrams, and illustrations should be placed inside:
```
public/images/articles/
```

### Formatting Specifications
1. **Dimensions:** Standard 1.91:1 landscape aspect ratio. Recommended size: **1200 x 630 pixels** (or **1600 x 840 pixels** for high-DPI displays).
2. **Format:** Use modern **WebP (`.webp`)** or **AVIF (`.avif`)** for fast delivery. For clean technical schematics, **PNG (`.png`)** is also acceptable.
3. **File Size:** Target under **200 KB** per image (ideally between 80 KB and 150 KB). Compress images using tools like Squoosh, TinyPNG, or ImageMagick before committing.
4. **Naming Convention:** Match the article slug: `[article-slug]-cover.webp`.

---

## 7. Academic & Research References

High-quality research references distinguish Micro Signal Cosmos from generic tech blogs. Whenever your article draws from academic papers, preprints, or official technical standards, add a structured `references` array to the frontmatter:

```yaml
references:
  - title: "Attention Is All You Need"
    url: "https://arxiv.org/abs/1706.03762"
    source: "NeurIPS Conference Proceedings"
    accessDate: "2026-11-09"
  - title: "NIST Special Publication 800-207: Zero Trust Architecture"
    url: "https://csrc.nist.gov/publications/detail/sp/800-207/final"
    source: "National Institute of Standards and Technology"
    accessDate: "2026-11-09"
```

The article reader template automatically renders an accessible, beautifully styled **"References & Citations"** section at the conclusion of the article.

---

## 8. Automatic Reading Time

You **do not need to calculate or guess reading time manually**.

The publishing engine automatically:
1. Strips code blocks, HTML tags, and Markdown syntax from your article.
2. Counts the remaining prose words.
3. Divides by standard reading speed (~200 words per minute).
4. Rounds up to the nearest whole minute (e.g., `"6 min read"`).
5. Displays the identical reading time across homepage cards, category lists, the search index, and the reader header.

*Optional:* If an article contains extensive diagrams or complex equations that take longer to digest, you can manually override it in the frontmatter with `readingTime: "12 min read"`.

---

## 9. Draft & Preview Workflow

### Working on a Draft
When writing a draft that is not yet ready for public distribution:
```yaml
draft: true
```
While `draft: true`:
- The article is **100% excluded** from the homepage, article directory, category archives, search results, RSS feed (`/rss.xml`), and XML sitemap (`/sitemap.xml`).
- Production Cloudflare builds will safely skip generating its static route.

### Previewing Drafts Locally
To preview your draft on your computer before publishing:
1. Start the local development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:4321/articles/your-draft-slug/` in your web browser.
3. To view drafts across the homepage and archive lists during local review, run:
   ```bash
   ENABLE_DRAFTS=true npm run dev
   ```
4. When your article is reviewed and ready for the world, change `draft: true` to `draft: false`.

---

## 10. Git & Cloudflare Deployment Safety

Micro Signal Cosmos is hosted on **Cloudflare Pages** and automatically synchronized with the GitHub repository.

### Publishing Checklist
Before pushing to production:
1. Ensure `draft: false` on your article.
2. Verify that `category` matches one of the 7 valid categories.
3. Run the local build check in your terminal:
   ```bash
   npm run build
   ```
   If there are any broken markdown frontmatter fields or schema errors, the build will alert you immediately.
4. Stage and commit your new article:
   ```bash
   git add src/content/articles/your-article-slug.md public/images/articles/
   git commit -m "Publish: [Article Title]"
   git push origin main
   ```
5. Cloudflare Pages detects the commit, runs `astro build`, and deploys the update globally across 300+ edge locations in less than a minute.

