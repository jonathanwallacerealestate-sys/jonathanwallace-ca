# jonathanwallace.ca

Standalone personal-brand real estate website for **Jonathan Wallace**, Georgian Bay (Midland, Ontario) REALTOR®.

Static HTML/CSS/JS. No build step. Deploys to Netlify. Leads flow to Follow Up Boss via Make.com.

---

## Quick start (local)

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Structure

```
jonathanwallace-ca/
├── index.html              Home
├── sell.html               Seller landing (primary goal: win listings)
├── buy.html                Buyer landing + listing alerts
├── home-tours.html         YouTube home-tour series (lead-gen pillar)
├── home-value.html         "Price My Home" valuation funnel
├── about.html              Bio / story
├── contact.html            Contact + form
├── thank-you.html          Post-submit page (all forms redirect here)
├── privacy.html            Privacy policy (CASL/PIPEDA)
├── communities.html        Communities index
├── communities/
│   ├── midland.html
│   ├── penetanguishene.html
│   ├── tay-township.html
│   ├── tiny-township.html
│   └── wasaga-beach.html
├── assets/
│   ├── css/styles.css
│   └── js/main.js
├── netlify.toml
└── README.md
```

---

## Before launch — replace these

Search the codebase for `[` to find every placeholder. Key ones:

- **Stats** (`[XX]`, `[XXX]%`, `$[XX]M+`) on home + sell + community pages → your real, verifiable numbers. **Never publish invented figures.**
- **Reviews** on `index.html` → swap the three sample testimonial cards for the **official RateMyAgent embed widget** (RateMyAgent dashboard → Marketing → Website widget), or paste your 9 real reviews verbatim. Correct the rating to **4.97** and the count to **9**. The hero currently says "5.0 (23 reviews)" as a sample — fix it.
- **Bio + headshot** on `about.html`.
- **Photography**: replace every `.placeholder-img` with real Georgian Bay photos (hero, community, split sections). Optimize to `.webp`.
- **Listings**: embed your **Ruuster IDX** feed where you see the `placeholder-note` blocks. Keep SOLD data behind a registration gate (Canadian VOW rules).
- **Home tour videos**: embed YouTube on `home-tours.html` (or auto-pull latest uploads via Make.com + YouTube Data API).
- **Privacy policy**: have it reviewed; add a cookie-consent banner if you run GA4.

---

## Forms → Follow Up Boss (Make.com)

All forms use **Netlify Forms** (`data-netlify="true"`) with a honeypot (`bot-field`) and a CASL consent checkbox. Every form posts to `thank-you.html`.

Form names:
- `seller-valuation` / `home-valuation` — highest intent
- `buyer-inquiry` / `buyer-alerts`
- `tour-alerts`
- `contact`
- `newsletter`

**Wire to FUB:**
1. Netlify dashboard → **Forms** → select form → **Settings & usage** → **Outgoing webhook**.
2. Point it at a **Make.com** custom webhook URL.
3. In Make: parse the Netlify payload → **Follow Up Boss** module (Create/Update Person) → map name, email, phone, source, and the CASL consent flag. Add an auto-responder email + a task for Jonathan.
4. Honour CASL: only mark as opted-in when `casl_consent` is present.

---

## Deploy (Netlify)

1. Push this folder to a GitHub repo.
2. Netlify → **Add new site** → **Import from Git** → pick the repo.
3. Build command: *(none)*. Publish directory: `.` (repo root). `netlify.toml` already sets this.
4. **Domain**: Netlify → Domain settings → add `jonathanwallace.ca` → update DNS (A/ALIAS or Netlify DNS).
5. Enable **HTTPS** (automatic via Let's Encrypt).

---

## Brand

- **Palette — "Modern Slate":** Primary `#1F2933` · Secondary `#52606D` · Background `#F4F5F7` · CTA blue `#2F80ED`.
- **Fonts:** Inter (wordmark/UI) + Source Serif 4 (headings).
- **Positioning:** "Your Georgian Bay Specialist." Primary goal: win listings. Secondary: YouTube home tours as lead-gen.

---

## Contact

Jonathan Wallace, Salesperson · Faris Team Real Estate, Brokerage
📞 705-433-2525 · ✉️ jonathan@faristeam.ca · Midland, Ontario

Social: [YouTube](https://youtube.com/@jonathanwallaceRE) · [Instagram](https://instagram.com/jonathanwallacerealestate) · [LinkedIn](https://www.linkedin.com/in/jonathanwallacerealestate)
