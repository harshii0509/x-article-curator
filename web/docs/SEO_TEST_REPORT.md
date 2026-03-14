# SEO Testing Report – Nightstand

**Date:** 2026-03-14  
**Scope:** Landing page (`/`), local dev and Lighthouse audit.

---

## 1. Open Graph & Twitter Card Meta Tags

Verified in HTML source (local dev `http://localhost:3000/`):

| Tag | Status | Value |
|-----|--------|--------|
| `og:title` | ✅ | Nightstand - Your Reading Pile, But It Actually Works |
| `og:description` | ✅ | Save articles you discover into a quiet weekly reading list for the weekend. |
| `og:url` | ✅ | https://yournightstand.com |
| `og:site_name` | ✅ | Nightstand |
| `og:locale` | ✅ | en_US |
| `og:image` | ✅ | https://yournightstand.com/og-image.png |
| `og:type` | ✅ | website |
| `twitter:card` | ✅ | summary_large_image |
| `twitter:creator` | ✅ | @harshii04 |
| `twitter:title` | ✅ | Nightstand - Your Reading Pile, But It Actually Works |
| `twitter:description` | ✅ | Save articles you discover into a quiet weekly reading list for the weekend. |
| `twitter:image` | ✅ | https://yournightstand.com/og-image.png |

**Post-deploy:** After deploying, test the live URL with:

- **OG preview:** [opengraph.xyz](https://www.opengraph.xyz/) — enter `https://yournightstand.com`
- **Facebook:** [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter/X:** [Card Validator](https://cards-dev.twitter.com/validator)

---

## 2. Structured Data (JSON-LD)

Verified in HTML (local dev): three `application/ld+json` blocks:

1. **Organization** – name, url, logo, sameAs, @id  
2. **WebSite** – name, url, description, publisher, inLanguage  
3. **WebApplication** – name, url, applicationCategory, description, operatingSystem  

**Post-deploy:** Validate live structured data with:

- [Google Rich Results Test](https://search.google.com/test/rich-results) — enter `https://yournightstand.com`

---

## 3. Lighthouse SEO Audit

**Run:** `npx lighthouse http://localhost:3000/ --only-categories=seo`

| Audit | Result |
|-------|--------|
| Document has a `<title>` element | ✅ PASS |
| Document has a meta description | ✅ PASS |
| Links have descriptive text | ✅ PASS |
| Image elements have `[alt]` attributes | ✅ PASS |
| Page isn't blocked from indexing | ✅ PASS |
| Links are crawlable | ✅ PASS |
| robots.txt is valid | ✅ PASS |
| Document has a valid `hreflang` | ✅ PASS |
| Page has successful HTTP status code | ✅ PASS |

**SEO category score: 100**

---

## 4. Summary

- OG and Twitter meta tags are present and correctly set in the app (confirmed in dev HTML).
- JSON-LD (Organization, WebSite, WebApplication) is present and valid in the page.
- Lighthouse SEO audit passes with a score of 100 for the landing page.

**Recommended after each production deploy:** Re-run OG preview (opengraph.xyz + Facebook/Twitter tools) and the Rich Results Test with `https://yournightstand.com` to confirm crawlers see the same metadata and structured data.
