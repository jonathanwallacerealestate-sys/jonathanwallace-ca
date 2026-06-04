# jonathanwallace.ca — Strategy Blueprint & Build Plan

> The complete strategy, structure, design system, and phased roadmap for Jonathan Wallace's standalone personal-brand real estate website. This is the "why" behind every page the build produced.

---

## 0. Snapshot

| | |
|---|---|
| **Agent** | Jonathan Wallace, Salesperson |
| **Brokerage** | Faris Team Real Estate, Brokerage |
| **Market** | Georgian Bay / Southern Simcoe County — Midland, Penetanguishene, Tay, Tiny, Wasaga Beach |
| **Positioning** | "Your Georgian Bay Specialist" |
| **Primary goal** | Win listings (seller lead generation) |
| **Secondary goal** | Grow the YouTube home-tour series as a lead engine |
| **Domain** | jonathanwallace.ca |
| **Stack** | Static HTML/CSS/JS · GitHub · Netlify · Make.com → Follow Up Boss |
| **Design** | Editorial, photography-led · "Modern Slate" palette · Inter + Source Serif 4 |

---

## 1. Strategic positioning

### The core idea
Jonathan is **the** Georgian Bay specialist — not a generalist who happens to work the area. Every choice on the site reinforces *local authority* + *proof* + *a real marketing system*. The site sells **Jonathan's listing-marketing process**, using the **YouTube home-tour series** as the top-of-funnel magnet.

### Who it's for (in priority order)
1. **Sellers** in Georgian Bay (the money page is `home-value.html`).
2. **Buyers** who follow the home tours (captured via listing alerts).
3. **The merely curious** — locals who watch the tours and become future clients.

### The wedge: the home-tour series
A new home tour every **Tuesday, Thursday, Saturday** on YouTube. This is the differentiator vs. every other agent in the region. The site is built to convert that audience into leads and to sell the "list with me = your home gets toured to an audience that's already watching" pitch.

### Competitive read (sites studied)
- **faristeam.ca** — team scale, IDX, polish.
- **pozek.com** — personal brand + content engine.
- **peggyhill.com** — local dominance, community pages.
- **thejasonmitchellgroup.com** — aggressive lead capture.

The takeaway: combine a **strong personal brand** (Pozek) with **local-authority community pages** (Peggy Hill) and **clean IDX + lead capture** (Faris / Mitchell).

---

## 2. Brand & design system

### Palette — "Modern Slate"
| Token | Hex | Use |
|---|---|---|
| Primary (navy) | `#1F2933` | Headers, dark sections, text |
| Secondary (teal-grey) | `#52606D` | Secondary surfaces, gradients |
| Background (sand) | `#F4F5F7` | Light section backgrounds |
| CTA blue | `#2F80ED` | Buttons & accents ONLY |
| Charcoal | `#16202B` | Body text |

Accent discipline: **blue is for CTAs only** — it keeps "Price My Home" buttons unmissable.

### Typography
- **Inter** — wordmark, nav, UI, body. (Chosen partly because it renders a clean "J".)
- **Source Serif 4** — headings, pull-quotes, prices. Editorial feel without being stuffy.

### Visual language
- Big photography (hero, communities, split sections) — all currently `placeholder-img` gradient blocks awaiting real Georgian Bay shots.
- Generous whitespace, rounded `14px` cards, soft shadows.
- Consistent **page-hero** band on every interior page (navy→teal gradient).

---

## 3. Information architecture

```
/  index.html ............. Home (the full pitch in one scroll)
   sell.html .............. Seller hub — the marketing system
   home-value.html ....... "Price My Home" valuation funnel (MONEY PAGE)
   buy.html .............. Buyer hub + listing alerts
   home-tours.html ....... YouTube series hub + alert capture
   communities.html ...... Index of community guides
     communities/midland.html
     communities/penetanguishene.html
     communities/tay-township.html
     communities/tiny-township.html
     communities/wasaga-beach.html
   about.html ............ Story + how I work
   contact.html .......... Contact + form
   thank-you.html ........ Post-submit (all forms land here)
   privacy.html .......... CASL/PIPEDA policy
```

### Navigation
Persistent header on every page: Sell · Buy · Home Tours · Communities · About · Contact + a **"Price My Home"** primary button. Mobile collapses to a toggle (`main.js`).

### Conversion paths
- **Seller:** Home → Sell → Home Value form → Thank-you → (Make.com → FUB task).
- **Buyer:** Home/Buy → listing alerts form → Thank-you → nurture.
- **Audience:** Home Tours → subscribe / email alerts → nurture → future seller.

---

## 4. Page-by-page intent

### index.html
The whole argument in one scroll: hero (seller hook) → proof band (stats) → **home-tours pillar** → why-list-with-me → 4-step process → featured listings → communities → testimonials (RateMyAgent + award badge) → about teaser → valuation CTA. Two hero CTAs: "Price My Georgian Bay Home" (primary) and "Watch This Week's Home Tours."

### sell.html
The listing pitch in full: why marketing decides price → the **four-step system** (Prepare · Present · Promote · Negotiate) → the home-tour advantage → proof stats → seller FAQ. Ends on the valuation CTA.

### home-value.html (money page)
Minimal-friction valuation funnel. Address + contact + timeline, CASL consent, posts to thank-you. Side rail explains "real local analysis, not an algorithm." Three-step "how it works."

### buy.html
Search (Ruuster IDX placeholder) + "watch the homes first" cross-sell to tours + listing-alerts capture form.

### home-tours.html
The content engine's home: latest tour (big embed slot), recent grid (6), "list with me and your home gets toured" seller cross-sell, email-alerts capture. Cadence pills (Tue/Thu/Sat) throughout.

### communities/* (5 pages)
Local-authority SEO plays. Each: page-hero with the town's one-liner, "living in [town]" split, market-snapshot stat grid (placeholder, to be auto-fed from Ruuster/MLS), listings grid filtered to the town, and a "thinking of selling in [town]?" CTA. Footer cross-links all five towns.

### about / contact / thank-you / privacy
Trust + capture + compliance. About = story + how-I-work + credentials. Contact = direct details + form. Thank-you = confirmation + push to tours. Privacy = CASL/PIPEDA template.

---

## 5. Lead capture & routing

### Forms (Netlify Forms)
Every form: `data-netlify="true"`, hidden `form-name`, honeypot `bot-field`, **CASL consent checkbox**, redirect to `thank-you.html`. A `lead_source` hidden field tags origin.

Form inventory: `home-valuation`, `seller-valuation`, `buyer-inquiry`, `buyer-alerts`, `tour-alerts`, `contact`, `newsletter`.

### Routing pipeline
```
Netlify Forms → Outgoing webhook → Make.com custom webhook
  → Follow Up Boss (Create/Update Person)
  → auto-response email (transactional)
  → create speed-to-lead task for Jonathan
  → tag by lead_source + set CASL consent flag
```

### CASL discipline
Marketing email only when `casl_consent` is true. Always include unsubscribe; sync opt-outs back so Make never re-emails an opted-out contact. The valuation reply itself is transactional (fine); ongoing marketing needs the captured express consent.

---

## 6. Listings (IDX) — Canadian & compliant

- Use **Ruuster IDX** (Jonathan's existing provider) — or CREA DDF® / a board-approved Ontario IDX/VOW.
- **Do not** use a US IDX.
- Public **SOLD** data is restricted in Canada → keep solds + coming-soon behind a free **registration (VOW)** gate. Frame it as "Georgian Bay Hidden Inventory" to capture seller leads legally.
- Replace `.listing` placeholder cards + community listing grids with the live feed.

---

## 7. The YouTube engine (automation)

- Manual: embed `<iframe>` per tour.
- **Automatic (recommended):** Make.com on a schedule → YouTube (channel videos) → write latest 3–6 into a JSON the grid reads → site self-updates after each Tue/Thu/Sat upload. Same scenario can cross-post to IG/FB and email the `tour-alerts` list.

---

## 8. Reviews / social proof

- **RateMyAgent** is the source of truth: **4.95 / 5, 9 reviews**, #1 Midland, #1 Penetanguishene, 100% success/recommend/response.
- Best practice: embed the **official RateMyAgent widget** so reviews stay current — never hand-paste review text (it goes stale and risks inventing content).
- **Readers' Choice 2025 — Best Real Estate Agent, Midland**: show as an award badge.
- Google "leave a review" button → `g.page/r/CfQzrFkvJUg4EBM/review`.

> Build-time caution baked into the handoff: sample testimonial cards + a "5.0 / 23 reviews" line were placeholders. Real = 9 reviews / 4.95. Replace before launch.

---

## 9. SEO plan

- **Local-intent pages**: the five community guides target "[town] real estate / homes for sale."
- Title + meta description set per page; semantic headings; descriptive internal linking (footers cross-link towns).
- Phase 2: market-report blog posts per town (fresh content + long-tail), schema markup (RealEstateAgent, LocalBusiness, Review), GA4 + Search Console, Google Business Profile.
- The home-tour videos double as SEO/embed content and YouTube-search discovery.

---

## 10. Tech & deployment

- **No build step.** Open `index.html` or `python3 -m http.server`.
- **GitHub → Netlify**: import repo, publish dir `.`, auto-deploy on push. `netlify.toml` sets headers + publish root.
- **Domain**: point jonathanwallace.ca DNS at Netlify; automatic SSL.
- Hardening headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) in `netlify.toml`.

---

## 11. Phased roadmap

### Phase 1 — DONE (this build)
15 pages, full design system, all forms with CASL + honeypot, community guides, RateMyAgent + award proof, social links, deploy config, README + handoff. 289 internal links verified, 0 broken.

### Phase 2 — Content & IDX
- Live Ruuster IDX search + sold gallery (VOW gate).
- Auto-updating YouTube grid via Make.com.
- Per-town market-report blog + schema markup + GA4/GSC.
- Real photography + headshot; swap all `placeholder-img`.

### Phase 3 — Automation & nurture
- Full Make.com nurture sequences (seller vs. buyer vs. audience).
- Auto social cross-posting of new tours.
- Seller dashboard / home-valuation follow-up drips.
- A/B test hero + CTA; conversion-rate optimization.

---

## 12. Pre-launch checklist (condensed)

- [ ] Replace all `[bracketed]` placeholders (stats, bio, dates, prices).
- [ ] Reviews: official RateMyAgent widget OR 9 real reviews; fix rating to 4.95 / count to 9.
- [ ] Real photography + headshot (optimize to .webp).
- [ ] Ruuster IDX embedded; SOLD behind VOW gate.
- [ ] YouTube tours embedded / automated.
- [ ] Privacy reviewed; cookie banner if GA4.
- [ ] Forms tested end-to-end → FUB; auto-response + task fire.
- [ ] GA4 + Search Console + Google Business Profile.
- [ ] Confirm brokerage advertising-approval for the personal domain.
- [ ] Deploy: GitHub → Netlify → DNS → SSL.

---

*Strategy blueprint — Phase 1 complete. This document is the rationale; `README.md` is the operator's manual; `HANDOFF.md` is the quick-start.*
