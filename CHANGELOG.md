# jonathanwallace.ca change log

What changed on the site, when, and why. Newest first. Times are America/Toronto.
Any assistant (Claude, Cursor agents, Grok Bot teammates) should read this before editing the site, and add an entry after every change.

## Standing rules for anyone editing the site
- Brand: Midnight Estate. Charcoal #1B1B1B, champagne gold #C9A96A (accent only), ivory #F7F3EC. No pure white (#fff); ivory is the lightest tone. Headlines in Playfair Display only (DEC-20261022-01), body and labels in Nunito Sans. No Source Serif or Inter.
- Blog card thumbnails are never a header at the top of an article (DEC-20261012-01). The article opens on kicker, title, byline and intro; the card can sit lower in the body.
- Byline is "Jonathan Wallace, REALTOR®" (DEC-20261022-02). No em dashes in headers or written copy (DEC-20261021-13). Footer column titles are p.footer__h, not h4, so page headings stay in order.
- Title is always "REALTOR®". Always write "Jonathan Wallace" in full. No em dashes. No cliches (nestled, turnkey, cozy, stunning, dream home, and similar).
- Proof line: $300M+ career sales, 500+ families served, 4.96 stars on RateMyAgent across 16 verified reviews, number one rated agent in Midland and Penetanguishene on RateMyAgent, 2025 Midland Readers' Choice Award Best Realtor.
- Resources was removed from the top menu on purpose (Oct 30, Jonathan Wallace's request). It lives in the footer only. Do not restore it to the top menu.
- Listing pages must match REALTOR.ca. Listings that come off REALTOR.ca get disabled with a redirect to the homepage.
- Listing descriptions stay word for word as they appear on REALTOR.ca, including words the voice rules otherwise ban (stunning, cozy and similar). Do not rewrite them (Jonathan Wallace, Nov 3, DEC-20261103-listing-copy-matches-realtor-ca).
- Interview and town pages use the shared site header, footer and styles.css, not one-off templates.

## 2026-11-03

### Batches 2 to 4 from the website council (structure only, no new wording beyond button labels already in use)
Why: Jonathan Wallace said "finish the job" on the council plan. Wording changes that need his approval are listed at the end and not made.
- Lead flow: on 66 posts the first call to action is now "Thinking of selling? Book a home evaluation" (Calendly in-home link, data-ga4 book_home_evaluation) instead of the newsletter button. The mid and end newsletter options stay.
- Gold "Book a home evaluation" bar under the hero on all five town hubs.
- Proof band, Daniel Landry's seller review and a matching town case study link now sit above the form on sell.html, the five sell pages and home-value.html.
- "Text me" (sms:+17054332525) added to the homepage hero and the sell page heroes. Homepage "Book a listing chat" and the sell-page footer booking buttons now go straight to contact.html#book. Homepage reviews lead with the seller review.
- Site map: 17 town posts now end with links to their town's sell page, interview page and hub; the Midland, Penetanguishene and Tiny hubs list their best posts; the five interview pages link their sell page, hub and proof posts; the homepage has a "Selling in a specific town?" row.
- /home-value.html is now two steps, modelled on /seller-valuation/: step 1 asks only address, town, name, email, mobile and consent and posts to the existing Netlify form home-valuation (organic tagging through the main.js beacon unchanged, Ads tag only on paid UTMs); step 2 is optional detail on a new Netlify form home-valuation-details, then thank-you.html (Google Ads conversion unchanged). No default "ASAP" or "1 bedroom" any more, here or on the sell-page forms.
- Speed: homepage hero now a 218 KB WebP (was a 363 KB JPG) and preloaded; images under /assets/img/ cached for 7 days (_headers). New branded 404.html (noindex) with the shared header, footer and next steps.

### Batch 1 from the website council (structure only, no wording changes)
Why: Jonathan Wallace asked for a six-seat council review (execution, marketing, lead flow, site architecture, SEO, AEO). Batch 1 fixes what was broken.
- Removed the self-serving aggregateRating and review markup from Jonathan Wallace's own RealEstateAgent/Person schema on 75 pages (DEC-252). The visible proof is unchanged.
- Added the three missing October market updates (Sep 28 to Oct 4, Oct 5 to 11, Oct 12 to 18) to blog.html cards and its ItemList (rebuilt from visible order), and Oct 5 to 25 to llms.txt.
- New scripts/check_site.py runs as the Netlify build command and stops a deploy if a post is missing from the sitemap, llms.txt or blog.html, the ItemList drifts from the cards, /market-update-latest is stale, JSON-LD fails to parse, a sitemap URL is noindex, own-entity aggregateRating returns, an em dash appears in copy, a redirect is duplicated, or 705-733-2525 appears.
- /sell-your-home-in-[town]/ (trailing slash) now 301s to the canonical URL. It used to serve the page without its stylesheet.
- sitemap.xml now lists each post at its canonical URL (12 corrected), and the non-canonical .html form of 9 extensionless-canonical posts 301s to the canonical.
- GA4: every data-cta link and every Calendly, call, text and button link now carries data-ga4 (430 links). Booking events: book_home_evaluation (in-home), book_phone_call. The interview-page eval bar keeps its existing event name book_evaluation (PR #109's note of book_home_evaluation was wrong).
- Removed a duplicate redirect block for /blog-which-agent-penetanguishene added earlier today.

### Fresh social cards for the big six banks post (v2)
Why: Jonathan Wallace rejected the gradient and drop shadow (DEC-20261103-02-no-gradient-no-shadow) and asked for a fresh render rather than edits of edits, which had degraded the photo.
- assets/img/social/blog-boc-big-six-banks-november-2026-4x5-v2.jpg and -9x16-v2.jpg, used by the Instagram and Facebook drafts in Buffer.

### Brand and SEO/AEO fix pass (sitewide audit, highest priority items)
Why: Jonathan Wallace asked for every page to be audited against the brand guidelines and the decision log, through the lens of ranking in AI search, then fixed highest priority first.
- Headlines: Source Serif 4 and Inter (never loaded, so headlines fell back to Georgia and system sans) replaced on about 70 pages: headings now Playfair Display, body and labels Nunito Sans (DEC-20261022-01). The 13 one-off template posts now load Playfair for their headlines. scripts/build_post.py labels switched from Inter to Nunito Sans so future market posts stay on brand.
- Pure white replaced with ivory #F7F3EC in styles.css, listing.css and page CSS (Midnight Estate kit).
- Blog card thumbnail moved off the top of 43 articles to below the intro (DEC-20261012-01). Still used for the blog index, og:image and Article schema.
- Bylines and JSON-LD job titles now read REALTOR® (DEC-20261022-02), about 124 pages.
- Em dashes removed from written copy: weekly market hub strip on 17 posts, vendor headers, case study details (DEC-20261021-13). llms.txt title and REALTOR® mentions fixed.
- Full name in furniture: footer "Email Jonathan Wallace", "From Jonathan Wallace:" callouts, restaurant picks heading; "tell him I sent you" in body (DEC-20261001-11, DEC-20260903-03).
- "my buyer email list" replaced with "an email list of active buyers" on sell.html and the five sell pages. "Charming" removed from the Penetanguishene hub intro.
- Footer h4 changed to p.footer__h on 211 pages, so headings run h1, h2, h3 for search and AI parsers. Same look.
- /blog-which-agent-penetanguishene (noindex duplicate) now 301s to the Penetanguishene interview page.
- Deleted the empty, indexable test-restore-check.html.
- scripts/publish.py no longer hardcodes its Make webhook (it reads JW_PUBLISH_HOOK). The old URL is still in git history and must be rotated in Make (DEC-124).
- Listing description wording left as is: it matches REALTOR.ca, which Jonathan Wallace confirmed is correct.
- Not changed, waiting on Jonathan Wallace: town-page FAQ rewrites (Needs Jonathan #35, drafts to follow), review count 15 vs 16 (DEC-254).
- Election town and candidate pages (89) are now noindex, follow and out of sitemap.xml, since the Oct 26 vote is over (Jonathan Wallace's call). The hub post stays indexed. build_election_2026.py writes and checks for this.
- The 16 one-off posts (13 blog posts, the Farlain spill post, the election results post, farlain-lake-high-water) now use the shared site header, footer, styles.css and main.js (DEC-150). Their own styles are scoped under .post-scope so they no longer touch the shared chrome; the old footer text stays as .post-foot.
- The five interview pages no longer open on the card image; it now sits below the answer block (DEC-20261012-01).
- Homepage hero proof sentence removed at Jonathan Wallace's request; the same figures are in the stats band directly below it.
- Structural check (DEC-263): tag balance, image count and JSON-LD parse compared before and after on every changed file, zero differences.

### Social images for the big six banks post
Why: Buffer needs public image URLs for the social drafts.
- assets/img/social/blog-boc-big-six-banks-november-2026-{linkedin (16:9), google (1200x675), 4x5, 9x16}.jpg. Correction: the drop-shadow approval (DEC-20261103-01) was logged in error and is void. DEC-20261103-02-no-gradient-no-shadow governs: no gradient and no drop shadow on cards.

### New blog post: Did the Bank of Canada Raise Rates Too Soon? What Canada's Big Six Banks Are Saying
Why: Jonathan Wallace asked for a balanced article on how the big six banks see the October 28 rate hike.
- /blog-bank-of-canada-rate-hike-big-six-banks-november-2026 with answer-first summary, "where each bank stands" box, FAQPage, Article (speakable, citations, mentions) and Breadcrumb schema, and links to each bank's published commentary.
- Card image assets/img/blog-bank-of-canada-rate-hike-big-six-banks-november-2026-card.jpg (Artlist, house styled after 835 Dominion Ave but not identical). Used on the blog index and social only, not as a header on the article.
- Added to blog.html (first card and ItemList), sitemap.xml and llms.txt.

### 67da723: new blog post: Canada's Economy Is Losing Steam
Why: Jonathan Wallace asked for an economy-focused post from the weekly Edge report (data restated in his words; Edge and its author are not named, per the report's sharing terms).
- /blog-canada-economy-losing-steam-november-2026 with answer-first summary, key takeaways, FAQPage, Article (speakable) and Breadcrumb schema. Added to blog.html, sitemap.xml and llms.txt.

### Planned (handed to Chief Of Staff, from the October Google stats review)
Why: Search Console October showed 51 clicks and 2.36K impressions. Tiny content (waterfront selling blog +12 clicks, Tiny hub +3) is driving growth. Midland and Penetanguishene don't appear in the top searches. GA4 (Oct 6 to Nov 2) showed 270 users (+84%), but average engagement fell to 50s (-56%), mostly from election traffic that leaves after one page. Google Business Profile had 0 calls in September.
1. Google Business Profile: check the phone number and the mobile Call button, add Q&A, and post weekly Google Posts naming Midland, Penetanguishene and Tiny.
2. Add the gold "Book a home evaluation" bar to the Tiny pages that already get search clicks (/blog-selling-waterfront-tiny-township.html, /tiny-township-real-estate/). Add a stronger next-step CTA to the election pages where most visitors leave (Penetang candidates 65%, election results 74%, wills post 71%).
3. Strengthen the Midland and Penetanguishene pages with recent sales proof and FAQs with schema, to match the Tiny pattern.
4. Make the homepage and about/contact titles and meta clearly match searches for "Jonathan Wallace REALTOR", including the misspelling "johnathan wallace", so those visitors land on contact.

### PR #110 (80ac0e5): interview and town pages back on brand
Why: Jonathan Wallace said the interview pages no longer looked on brand.
- The six "which real estate agent should you interview" pages (Tiny, Midland, Penetanguishene, Tay, Wasaga Beach, plus the noindex duplicate blog-which-agent-penetanguishene.html) were on a separate template with Nunito headlines, their own colours and no shared header or footer. They now use the shared layout, styles.css and Playfair headlines. Facts, FAQs and schema are unchanged.
- Added the gold "Book a home evaluation" bar above the article on every interview page.
- Fixed "REALTOR" missing the ® (Midland FAQ, Wasaga body copy) and a missing Penetanguishene hero image.
- On the Tiny, Tay and Penetanguishene town pages, the off-brand ivory inline proof card is now white text with a gold rule on the photo hero.

### PR #109 (5933dc5): gold booking bar on the Tiny interview page
Why: the page ranks number one, so visitors arriving from search should see a booking action before the content.
- Full-width gold #C9A96A bar with charcoal text, "Book a home evaluation", linking to https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma
- Tracking: id/data-cta "book-home-evaluation", GA4 event book_home_evaluation, visible to Clarity.

## 2026-11-02
- PR #108 (be27df1): homepage hero gets Price my home, Current listings and Contact buttons plus the proof line. Mid-article /join links added on election pages and top posts. Tiny, Tay and Penetanguishene intros now name Jonathan Wallace (schema and llms.txt updated). Duplicate waterfront blog URLs 301 to the canonical .html. Clarity blocked on deploy previews. Why: Clarity showed almost no one got past the homepage first screen and 0 newsletter taps; AEO checks showed AI answers citing him less often.
- PR #107 (71dd4b0): 775 Ontario Street (S13706024) is off REALTOR.ca, so its page now redirects to the homepage. 22 active listing pages.

## 2026-10-30
- 639b066: Resources removed from the top menu sitewide at Jonathan Wallace's request. The footer link stays.
- c1e1a98: homepage hero subtitle and weekly market strip removed, and the hero made shorter.
- PR #105 (7119eb5): 193 Gouett price is now $779,900. 993 Whitney relisted as S14123950 at $914,900. Why: matching REALTOR.ca.

## 2026-10-29
- PR #102 (9d66f1c): Clarity technical fixes. Why: 30-day Clarity showed 8% of sessions with dead clicks, 20% quick backs, 6.9% JS errors and 0 visits to /join. Made whole cards clickable, enlarged the CTA close button to 44px and the nav toggle to 48px, added a JS error shield, improved INP, fixed the blog mobile hero, and added /join to the menu and footer. By Nov 2, quick backs were down to 3% and JS errors to 1%.
- PR #101 (ae82a2c): leftover listing prices updated to match the live pages (Champlain $1,149,900, 1555 Baseline $1,499,900).
