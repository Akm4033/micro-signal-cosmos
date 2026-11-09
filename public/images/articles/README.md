# Micro Signal Cosmos - Article Images Guide

This directory holds featured cover images, diagrams, and inline media for Micro Signal Cosmos articles.

## Image Specification Standards

1. **Cover Image Dimensions:**
   - Recommended resolution: **1200 x 630 pixels** (Standard 1.91:1 landscape aspect ratio for Open Graph, social cards, and hero displays).
   - High-DPI alternative: **1600 x 840 pixels** (maximum 2400 x 1260).

2. **File Formats:**
   - Preferred: **WebP** (`.webp`) or **AVIF** (`.avif`) for optimal compression and edge delivery.
   - Acceptable: **PNG** (`.png`) for high-contrast technical diagrams and charts; **JPG** (`.jpg`) for photography.

3. **File Size Target:**
   - Under **200 KB** for cover images (ideally 80 KB - 150 KB).
   - Never commit uncompressed multi-megabyte raw camera or high-res stock files.

4. **Naming Conventions:**
   - Use lowercase kebab-case matching the article slug or subject matter.
   - Format: `[article-slug]-cover.webp` or `[article-slug]-[figure-descriptor].webp`
   - Examples:
     - `/images/articles/quantum-computing-breakthroughs-cover.webp`
     - `/images/articles/ai-neural-networks-architecture-diagram.webp`

5. **Frontmatter Configuration:**
   Reference the image in your Markdown article frontmatter:
   ```yaml
   coverImage: "/images/articles/quantum-computing-breakthroughs-cover.webp"
   coverImageAlt: "Conceptual visualization of a superconducting quantum processor with luminous qubit circuits"
   coverImageCaption: "Superconducting quantum circuits operating at sub-kelvin temperatures."
   coverImageCredit: "Micro Signal Cosmos Visual Research / Open Science Commons"
   ```

6. **Accessibility & Licensing:**
   - Every image must have an accurate, descriptive `coverImageAlt`.
   - Never use generic alt text like "photo" or "image".
   - Ensure you hold the publishing rights or provide clear attribution in `coverImageCredit`.

