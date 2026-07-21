# jonathanwallace.ca: SEO + AEO Audit and Action Plan

Prepared 2026-07-21. The goal: when anyone searches "Jonathan Wallace" or a Georgian Bay real estate question, in Google or in an AI answer engine, they find Jonathan Wallace, and the site converts them. This document is the single source of truth for search strategy. It follows the brand voice rules in content/brand-voice.md (no em dashes, full name always, concrete local copy, no filler).

Audit basis: full crawl of the repo at commit f4f8ede (live site), the QR newsletter landing page (georgian-bay-newsletter.netlify.app), the resources hub (jonathanwallace-resources.netlify.app), the June handoff and strategy docs, brand-voice.md, stats.json, and the jw-brand-kit visual identity.

---

## The one-paragraph verdict

The foundation is better than most agent sites: clean titles and metas on all 16 pages, one H1 per page, real verifiable proof numbers from a single source, fast static hosting, and honest content in a distinct voice. But the site is currently invisible on purpose (noindex, staying on per your call until photos and IDX are in), carries zero structured data, has no canonical or social-share tags, no sitemap file, dead lead capture (Netlify Forms never enabled), and its two satellite pages (QR newsletter, resources hub) live on separate netlify.app domains that leak authority away from jonathanwallace.ca. Fix the plumbing now while noindex is on, so the day the switch flips, Google and the AI engines meet a finished site.

---

## Scorecard

| Dimension | Grade | One-line reason |
|---|---|---|
| 1. SEO fundamentals | C+ | Good on-page basics; no schema, no canonicals, no sitemap, noindex on |
| 2. AEO / AI discoverability | D | Nothing machine-readable about who Jonathan Wallace is; no FAQ content |
| 3. Content strategy | B- | Strong bios and 5 community pages, but [XX] stat placeholders and only one blog post |
| 4. QR landing pages | C | Converts fine, but orphaned on netlify.app with no trust signals or path deeper |
| 5. Resource discoverability | D+ | Good guide, wrong domain, no email capture, invisible from the main site |
| 6. Cross-channel authority | C+ | Links exist everywhere, but no sameAs graph ties the profiles together |
| 7. MLS readiness | B- | Honest scaffold and a redirect slot already in netlify.toml; needs interim CTA |

---

## What is working (keep and protect)

- Titles and meta descriptions: every page has a unique, keyword-sensible title in the pattern "Topic | Jonathan Wallace, Georgian Bay" and a description under 160 characters. Do not let future edits break this.
- Heading discipline: exactly one H1 per page, wrapping the actual value proposition.
- Proof numbers from one source: assets/data/stats.json injects $300M+, 500+, 4.95 stars (9 reviews), and the number one RateMyAgent ranking into every data-stat span. This is exactly the "one number everywhere" consistency both Google and AI engines reward. The 4.95 from 9 reviews is honest and verifiable at RateMyAgent, which matters more for E-E-A-T than a bigger invented number ever could.
- Speed: static HTML, no build step, no framework payload, Netlify edge, YouTube feed cached at the edge for an hour with stale-while-revalidate. This site will score well on Core Web Vitals once images are optimized.
- Internal linking: 289 verified internal links, zero broken. Communities hub links down to five town pages, every page cross-links the money pages (sell, home-value, contact).
- Voice: the copy sounds like a person, not a template. AI engines quote distinctive, concrete sentences. "Georgian Bay is not a territory I cover. It is home." is exactly the kind of line that gets extracted.
- Compliance: TRESA footer on every page, CASL consent plus honeypot on every form.

---

## What is broken or missing, in priority order

### P0. Blockers: fix before anything else matters

**P0-1. Lead capture is dead.** Netlify reports Forms "not enabled" on the site. Every form (newsletter, contact, home value) currently submits into nothing. This is a conversion emergency independent of SEO: QR scanners and site visitors who try to reach Jonathan Wallace are being dropped. Fix: enable form detection in Netlify (Site settings, Forms, Enable form detection), redeploy, submit a test on each of the three forms, then wire the outgoing webhook to Make.com and on to Follow Up Boss (auto response + task, honour the CASL flag). The netlify.toml already documents this flow.

**P0-2. sitemap.xml does not exist** but robots.txt references it. The day noindex lifts, Google gets a 404 where the map should be. Fix: committed in this pass (see Implemented below).

**P0-3. Zero structured data.** No Person, no RealEstateAgent, no LocalBusiness, no FAQ, no Article schema anywhere. For AEO this is the single highest-leverage gap: structured data is how ChatGPT, Perplexity, Copilot and Google's AI results learn, with confidence, that Jonathan Wallace is a REALTOR in Midland serving Georgian Bay, rated 4.95 on RateMyAgent, who makes YouTube home tours. Fix: committed in this pass (see Implemented below).

### P1. High impact, do within two weeks

**P1-1. Community pages still show [XX] market stats.** Five town pages each carry bracket placeholders for average price, days on market, and sales figures. Never publish invented numbers; either fill them with real monthly figures or remove the stat blocks until the data pipeline exists. Recommendation: wire your weekly Simcoe market snapshot (the one that already feeds your LinkedIn market update) into a per-town JSON file the same way stats.json works. Then each community page shows a dated, real "Market snapshot, updated monthly" block, which is precisely the fresh, structured, citable local data AI engines hunt for and almost no Midland-area agent publishes.

**P1-2. The two satellite properties leak authority.** The QR newsletter page and the resources hub live on separate netlify.app subdomains with no links to jonathanwallace.ca, no reviews, no awards. Search engines see three unrelated small sites instead of one authoritative hub. Fix in stages:
- Now (committed in this pass): jonathanwallace.ca/newsletter and jonathanwallace.ca/resources redirect to the existing pages, so all future print, bio links, and QR codes can carry the real domain. Existing printed QR codes keep working untouched.
- Next: move both pages into this repo as first-class pages under the domain (newsletter.html with the ?loc= source tracking preserved; resources.html hosting the PDFs from /assets/guides/). Keep 301 redirects from the old netlify.app URLs.
- The vacant land guide currently requires no email. Keep one guide ungated as a goodwill sample, gate the rest behind the newsletter signup so every download becomes a Follow Up Boss contact with a source tag.

**P1-3. No FAQ content.** AI answer engines are question-answer machines; the site contains no question-shaped content. Fix: committed in this pass, a new faq.html with FAQPage schema answering the questions buyers and sellers actually ask about Georgian Bay (see Implemented below). Extend it over time; every question you get twice by email belongs on that page.

**P1-4. Blog has one post and a broken video slot.** The Penetanguishene first-time buyer guide is good AEO content (it targets a real question, cites sources, has a named author). But its YouTube embed still says VIDEO_ID (commented out; fixed in this pass with a channel link until you supply the 5 Scott Street URL). One post is not a content strategy; see the content calendar below.

**P1-5. No photos, no og:image, no headshot on the site.** E-E-A-T for a personal brand needs a face. Social shares and AI citations currently render with no image. A branded placeholder share card is committed in this pass; replace it with a real headshot card as soon as photography exists.

### P2. Structural, do within one to two months

**P2-1. Set up Google Search Console and Bing Webmaster Tools now**, while noindex is on. Verify the domain, submit the sitemap, and the moment noindex lifts you can request indexing instead of waiting to be crawled. Bing matters more than people think: it feeds ChatGPT and Copilot answers.

**P2-2. Google Business Profile is the local SEO engine.** The site links to the review URL. Make sure the profile itself links back to https://jonathanwallace.ca as the website (bidirectional confirmation is a strong entity signal), uses the same headshot, the same phone number 705-433-2525, and the exact name Jonathan Wallace. Post the weekly market update there (your Buffer pipeline already produces a Google Business variant).

**P2-3. YouTube is your strongest asset and it is one-way.** The site pulls the latest three videos, but the channel should point back: put https://jonathanwallace.ca as the first link in the channel header and in every video description (with UTM tags, e.g. ?utm_source=youtube&utm_medium=description). Add each new tour as a post on the matching community page with VideoObject schema; that is how a Tiny Township tour ends up ranking for "Tiny Township home tour".

**P2-4. RateMyAgent embed.** The May handoff flagged this and it still stands: drop the official RateMyAgent widget on the homepage testimonial section so review content is crawlable text on your domain, not just a stat you assert.

**P2-5. Brand palette decision.** The site runs "Modern Slate" (#1F2933, #2F80ED) while the jw-brand-kit that governs all social graphics is "Midnight Estate" (charcoal #1B1B1B, champagne gold #C9A96A, Playfair Display). A person clicking from a gold-on-charcoal Instagram graphic to a blue-on-slate site feels a seam. This is a deliberate rebrand decision, not a quick win: either restyle the site to Midnight Estate or accept the two-system split knowingly. Flagging it; not changing it without your call.

---

## Dimension detail and implementation

### 1. SEO fundamentals

Done in this pass (branch seo-aeo-quick-wins):
- Canonical tag on all 16 pages pointing to the https://jonathanwallace.ca URL.
- Open Graph and Twitter Card tags on all pages (title, description, og:image branded card, og:locale en_CA).
- sitemap.xml covering all indexable pages with sensible priorities (home 1.0, sell/home-value 0.9, communities 0.8, blog/FAQ 0.7, privacy excluded via lower priority and thank-you excluded entirely).
- thank-you.html set to noindex permanently (it should never rank, and it pollutes conversion data).

Still to do by hand:
- Netlify Forms enablement (P0-1 above; a dashboard setting, cannot be committed).
- Compress and convert future photography to WebP under 200 KB; the hero and community slots are currently empty divs, so this is a pre-launch step, not a fix.
- When noindex lifts: remove the X-Robots-Tag block in _headers, submit the sitemap in Search Console, request indexing of the home page, sell page, and all five community pages the same day.

### 2. AEO / AI discoverability

Done in this pass: a single site-wide JSON-LD @graph on every page establishing the entity, plus page-specific schema. The core graph:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": "https://jonathanwallace.ca/#agent",
      "name": "Jonathan Wallace, Salesperson, Faris Team Real Estate, Brokerage",
      "url": "https://jonathanwallace.ca/",
      "telephone": "+1-705-433-2525",
      "email": "jonathan@faristeam.ca",
      "image": "https://jonathanwallace.ca/assets/img/og-card.png",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Midland",
        "addressRegion": "ON",
        "addressCountry": "CA"
      },
      "areaServed": [
        {"@type": "City", "name": "Midland"},
        {"@type": "City", "name": "Penetanguishene"},
        {"@type": "City", "name": "Tay Township"},
        {"@type": "City", "name": "Tiny Township"},
        {"@type": "City", "name": "Wasaga Beach"}
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.95",
        "reviewCount": "9",
        "bestRating": "5"
      },
      "award": "2025 Midland Readers' Choice Award, Best Realtor",
      "founder": {"@id": "https://jonathanwallace.ca/#jonathan"}
    },
    {
      "@type": "Person",
      "@id": "https://jonathanwallace.ca/#jonathan",
      "name": "Jonathan Wallace",
      "jobTitle": "REALTOR®, Salesperson",
      "worksFor": {"@type": "Organization", "name": "Faris Team Real Estate, Brokerage"},
      "url": "https://jonathanwallace.ca/about.html",
      "knowsAbout": ["Georgian Bay real estate", "Midland Ontario homes", "Penetanguishene real estate", "Tiny Township waterfront", "Tay Township real estate", "Wasaga Beach real estate", "YouTube home tours"],
      "sameAs": [
        "https://youtube.com/@jonathanwallaceRE",
        "https://instagram.com/jonathanwallacerealestate",
        "https://www.linkedin.com/in/jonathanwallacerealestate",
        "https://www.rate-my-agent.com/jonathan-wallace-ratings-midland-121710",
        "https://g.page/r/CfQzrFkvJUg4EBM"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://jonathanwallace.ca/#website",
      "url": "https://jonathanwallace.ca/",
      "name": "Jonathan Wallace, Your Georgian Bay Specialist",
      "publisher": {"@id": "https://jonathanwallace.ca/#jonathan"}
    }
  ]
}
</script>
```

Why this works for AEO: the sameAs array is the machine-readable statement that the YouTube channel, the Instagram, the LinkedIn, the RateMyAgent profile and the Google Business listing are all the same Jonathan Wallace. That is how an answer engine consolidates five weak signals into one strong entity. The aggregateRating mirrors the reviews genuinely displayed on the homepage; keep it exactly in sync with stats.json (if the RateMyAgent number changes, change both).

Also for AEO, the writing itself: AI systems extract answers from pages that state facts plainly near the top. The new FAQ page is written so every answer's first sentence stands alone as a complete, quotable answer containing the entity name or place name.

### 3. Content strategy

What exists: two strong bios, five community pages, one blog post, home tours feed, sell/buy funnel pages. What is missing is the recurring, dated, local content that makes engines associate Jonathan Wallace with this market permanently. The machine you already run (weekly Simcoe market snapshot, YouTube tours, Buffer repurposing) just needs a landing spot on the domain. Recommended cadence, lightest possible lift:

1. Monthly, per-town market snapshot blocks on the five community pages (P1-1 above), fed from the same numbers as your weekly LinkedIn post. Five pages updated monthly beats five new blog posts monthly.
2. One blog post per month, question-titled, in the Penetanguishene guide's format: "What does it cost to buy a first home in Midland in 2026?", "What should you know before buying waterfront on Georgian Bay?", "Is Tiny Township a good place to live?". Each post: author byline Jonathan Wallace, Article schema (template now in the repo), one embedded tour video, internal links to the matching community page and home-value.html.
3. Every new YouTube tour gets embedded on its community page within a week of upload.
4. Grow faq.html by two or three questions a month from real client emails. Questions people actually typed are AEO gold.

### 4. QR code landing pages

The newsletter landing page itself converts competently: clear promise ("Your 5-Minute Friday Read"), three fields, phone optional, privacy reassurance, headshot, brokerage line. Keep it. The problems are around it:
- It is a dead end. A cold QR scanner who is not ready to subscribe has nowhere to go. Add three quiet links under the form: Watch the home tours (YouTube), What is my home worth (home-value.html), and the main site.
- It carries no proof. Add the one-line proof strip: "4.95 stars on RateMyAgent. 2025 Midland Readers' Choice, Best Realtor." Cold traffic needs a reason to hand over an email.
- It lives on georgian-bay-newsletter.netlify.app. All future printed QR codes should encode https://jonathanwallace.ca/newsletter?loc=SOURCE (redirect committed in this pass, so this works today; the ?loc= parameter is passed through). Existing posters keep working; replace URLs at the next print run.
- Keep the per-venue ?loc= tagging exactly as designed. It is already better source attribution than most teams ever build.

### 5. Free resource discoverability

The vacant land guide is a real asset (buyers search for exactly this) currently invisible: separate domain, no email capture, no inbound links, PDF not indexable from the main site. Plan:
- Now: /resources redirect committed, plus a Resources link added to the footer of every page, so the hub is reachable and crawlable from the domain.
- Next: move guides into this repo at /resources with a landing page per guide. Each guide page gets its own title ("Free Guide: Buying Vacant Land in Simcoe County"), a summary of what is inside (crawlable text, not just a PDF link), and the newsletter form as the gate. PDFs live at /assets/guides/ so the domain, not netlify.app, accrues the links.
- Name PDFs descriptively (vacant-land-guide-simcoe-county.pdf, not guide-v3-final.pdf); Google indexes PDFs and their filenames.
- The planned "Moving to Georgian Bay" guide from the YouTube funnel work belongs here too, gated, as the channel's primary CTA.

### 6. Cross-channel authority signals

Committed in this pass: the sameAs graph (above), which is the missing spine. Remaining by hand, in order of impact:
1. Google Business Profile website field set to https://jonathanwallace.ca (bidirectional entity confirmation).
2. YouTube channel header link and video description links to the domain with UTMs.
3. Instagram and LinkedIn bio links switched from Linktree (if in use) to jonathanwallace.ca, or at minimum ensure the domain appears in both bios.
4. RateMyAgent profile website field set to the domain.
5. Consistent NAP everywhere: exactly "Jonathan Wallace", "705-433-2525", "jonathan@faristeam.ca", "Midland, ON" on every profile. Any variant spelling weakens the entity match.
6. When the newsletter and resources pages move onto the domain, 301 the old netlify.app URLs.

### 7. MLS / IDX readiness

The featured listings section is honestly scaffolded (no fake listings, good). Interim strategy so the site does not feel broken and the URL structure survives the integration:
- Already in place from the June finish pass: the featured listings section carries an honest CTA band ("Ask about a listing" / "Price my home") instead of fake listing cards or dead links, and netlify.toml documents a ready /listings redirect slot. Nothing on the page pretends to be a search that does not exist, which is the right interim posture.
- When Ruuster IDX is ready: mount it at /listings (subdirectory or redirect, either works with the committed slot), keep SOLD data behind registration per the Canadian VOW rule, and add ItemList schema to the featured section.
- Do not embed a third-party IDX iframe on the homepage; it adds seconds of load for content Google attributes to the IDX provider's domain anyway. A dedicated /listings page keeps the homepage fast.

---

## Priority sequence, one list

1. Enable Netlify Forms and wire Make.com to Follow Up Boss (P0-1). Today. Nothing else converts until this works.
2. Merge the seo-aeo-quick-wins PR (schema, canonicals, OG tags, sitemap, FAQ page, redirects, share card, blog fixes). Committed, waiting for review.
3. Set up Google Search Console + Bing Webmaster Tools; verify domain; submit sitemap (P2-1). This week, works fine under noindex.
4. Point Google Business, YouTube, RateMyAgent, and social bios at the domain (P2-2, P2-3, cross-channel list). This week, one hour total.
5. Fill or remove the [XX] community stats; stand up the monthly per-town snapshot (P1-1). Next two weeks.
6. Move newsletter + resources pages onto the domain with 301s; gate future guides (P1-2, dimension 5). Next two weeks.
7. Photography: headshot and Georgian Bay hero shots; replace the placeholder og-card with a real headshot card (P1-5). Blocks the noindex lift.
8. Publish blog post number two and the first monthly snapshot; add the 5 Scott Street video URL to the Penetanguishene post. Ongoing cadence per the content calendar.
9. Lift noindex when 5, 6, and 7 are done. Then request indexing in Search Console the same day.
10. Ruuster IDX at /listings when ready; brand palette decision whenever you want to make it (P2-5).

---

## What was implemented in the seo-aeo-quick-wins branch

- Site-wide JSON-LD entity graph (RealEstateAgent + Person + WebSite with sameAs) on all pages.
- BreadcrumbList schema on the five community pages; Article schema with author on the blog post; FAQPage schema on the new FAQ page.
- Canonical, Open Graph, and Twitter Card tags on all pages; branded 1200x630 share card at assets/img/og-card.png (placeholder until real photography).
- New faq.html: twelve questions in brand voice, linked from every footer.
- sitemap.xml; thank-you.html noindexed.
- netlify.toml: /newsletter and /resources redirects (print-safe domain URLs today), /listings slot documented.
- Blog: broken VIDEO_ID embed replaced with a working channel CTA until the real video URL exists.
- Footer on all pages: added Free guides and FAQ links.
- The X-Robots-Tag noindex header was NOT touched, per your decision.

All numbers in schema and copy come from assets/data/stats.json and content/stats.md. If a stat changes, change it there first.
