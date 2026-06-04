# jonathanwallace.ca — Project Handoff

**Owner:** Jonathan Wallace, Salesperson · Faris Team Real Estate, Brokerage
**Contact:** jonathan@faristeam.ca · 705-433-2525 · Midland, Ontario
**Project:** Standalone personal-brand real estate website (Phase 1)
**Stack:** Static HTML/CSS/JS → GitHub → Netlify · leads → Follow Up Boss via Make.com
**Status:** Phase 1 built and verified. Ready to deploy once the items in "Before launch" are completed.

---

## 1. What this site is

A standalone personal brand for Jonathan Wallace, positioned as **"Your Georgian Bay Specialist."** Primary goal: **win listings (sellers)**. Secondary pillar: a **YouTube home-tour series** (new tours Tue / Thu / Sat) used as a lead-generation engine.

Design: editorial, photography-led, "Modern Slate" palette.
- Primary `#1F2933` · Secondary `#52606D` · Background `#F4F5F7` · CTA blue `#2F80ED`
- Wordmark font: **Inter** (clean J, matches UI). Headings/serif: **Source Serif 4**.

---

## 2. Pages (15 total)

Root: `index.html` (home), `sell.html`, `buy.html`, `home-tours.html`, `home-value.html` ("Price My Home" valuation funnel), `about.html`, `contact.html`, `thank-you.html`, `privacy.html`.
Community guides: `communities.html` + `communities/{midland,penetanguishene,tay-township,tiny-township,wasaga-beach}.html`.
Assets: `assets/css/styles.css`, `assets/js/main.js`, `netlify.toml`, `README.md`.

Verified: 289 internal links, 0 broken. All forms carry CASL consent + honeypot.

---

## 3. What's DONE (real data wired in)

- **Brand + TRESA footer** on every page: "Jonathan Wallace, Salesperson · Faris Team Real Estate, Brokerage" + REALTOR®/MLS® trademark line.
- **Contact details** live: phone 705-433-2525, email jonathan@faristeam.ca.
- **Social links** live in all footers + Home Tours subscribe buttons:
  - YouTube https://youtube.com/@jonathanwallaceRE
  - Instagram https://instagram.com/jonathanwallacerealestate
  - LinkedIn https://www.linkedin.com/in/jonathanwallacerealestate
- **Testimonials section** with: RateMyAgent profile link (https://www.rate-my-agent.com/jonathan-wallace-ratings-midland-121710), Google "Leave a review" button (https://g.page/r/CfQzrFkvJUg4EBM/review), and a **Readers' Choice "Best Realtor – Midland" award badge**.
- **Colour palette** (Modern Slate) and **fonts** (Inter + Source Serif 4) applied site-wide.

### Real facts confirmed from RateMyAgent (use these, not placeholders)
- Overall rating **4.95 / 5** · Knowledgeability 5.00 · Professionalism 5.00 · Responsiveness 5.00 · Value 5.00
- **9 reviews** across 4 cities / 2 neighbourhoods · #1 in Midland · #1 in Penetanguishene
- 100% Success Ratio · 100% Recommend Ratio · 100% Response Rate
- Team: Faris Team · Company: Faris Team Real Estate
- **Readers' Choice 2025 — Best Real Estate Agent, Midland** (winner page: https://best-businesses.thereaderschoice.ca/o/midland/readers-choice-2025-winners/services/best-real-estate-agent)

> ⚠️ ACCURACY NOTE: During the build, three testimonial cards and a "5.0 / 23 reviews" line were drafted as *samples* before the real RateMyAgent data was confirmed. The real number is **9 reviews, 4.95 rating**. Before publishing, replace any sample review text/counts with the real reviews + correct rating, or (better) drop in the official RateMyAgent embed widget so it stays accurate automatically. Do NOT publish invented review text.

---

## 4. What's OUTSTANDING (before launch)

- [ ] **Reviews:** swap sample testimonial cards for the official **RateMyAgent embed widget** (Dashboard → Marketing → Website widget), or paste the 9 real reviews verbatim. Correct the rating to **4.95** and count to **9**.
- [ ] **Award badge image (optional):** drop the official Readers' Choice / RateMyAgent badge image at `assets/img/ratemyagent-badge.png` to replace the CSS-built badge.
- [ ] **Stats band** on home + sell pages: replace `[XX]` placeholders with real numbers (sold volume, homes sold, avg DOM, list-to-sold %). Never publish invented figures.
- [ ] **Bio + headshot** on About; real Georgian Bay photography for hero/community `placeholder-img` slots (optimize to .webp).
- [ ] **Listings:** embed **Ruuster IDX** (already your provider) in the listing/community slots; keep SOLD data behind a registration gate (Canadian VOW rule).
- [ ] **Home tour videos:** embed YouTube or auto-pull latest uploads via Make.com.
- [ ] **Privacy policy:** finalize/legal-review; add cookie-consent banner if running GA4.
- [ ] **Deploy:** push to GitHub repo → connect Netlify → point jonathanwallace.ca DNS.
- [ ] **Lead routing:** wire Netlify Forms → Make.com webhook → Follow Up Boss (auto-response + task). Honour CASL consent flag.
- [ ] Confirm Faris Team advertising-approval rules for a personal domain.

---

## 5. Key decisions made this session

- Standalone personal brand (not "The Official Realty Group" that was on the old live site, and not Faris-team-branded). Brokerage name appears only where TRESA requires it (footer).
- Best practices lifted from the old live site: Ruuster IDX, dedicated community pages, a Buy path.
- Reference sites studied: faristeam.ca, pozek.com, peggyhill.com, thejasonmitchellgroup.com.
- Palette chosen: Modern Slate (option 2 of 5). Wordmark: Inter. Tagline: "Your Georgian Bay Specialist."

---

## 6. Files

Working folder contains the full site at `jonathanwallace-ca/` plus the original strategy blueprint (`jonathanwallace-ca-strategy-blueprint.md`). `README.md` inside the site folder has full deploy + Make.com/FUB + reviews/IDX instructions.

*Handoff generated end of session — Phase 1 complete, pending the launch checklist above.*
