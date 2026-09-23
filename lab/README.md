# Home value lab

Private page for refining the slow neighbourhood-solds email. It is not the public product. Production `/home-value.html` and the Netlify form `home-valuation` stay as they are.

## Open the lab

Relative path: `lab/home-value.html`

Passphrase: `wallace-lab-2026`

The passphrase is the `LAB_PASSPHRASE` constant in `lab/lab.js`. The gate stores an unlock flag in `sessionStorage` (`jw-lab-home-value`). A successful form submit also stores `jw-lab-home-value-lead` with first name, last name, email, phone, and property address only. CASL and the other answers are not in that blob. It is a soft gate for obscurity and intentional access, not bank-grade authentication. Closing the tab clears both keys.

After the passphrase, a banner reads **LAB — internal testing**.

Thank-you page: `lab/home-value-thanks.html` (same passphrase if the tab does not already have the unlock flag).

### Netlify Deploy Preview

Site name: `jonathanwallace-ca`.

After this branch opens a pull request and Netlify finishes the preview, the lab is:

`https://deploy-preview-PR_NUMBER--jonathanwallace-ca.netlify.app/lab/home-value.html`

Replace `PR_NUMBER` with the pull request number. The Netlify bot comment on the PR ("Deploy Preview for jonathanwallace-ca") is the base URL. Add `/lab/home-value.html`, then enter the passphrase.

Production `https://jonathanwallace.ca/lab/home-value.html` does not exist until this branch is merged. Do not merge until Jonathan says the lab is ready to leave the preview.

## What the page promises

- A neighbourhood solds read and a conversation.
- You hear back by email after a review. Not instant.
- Not a formal Letter of Opinion.
- Interior condition, fit, and finish still move the number.
- A formal Letter of Opinion only after an in-person visit.
- Byline: Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage.
- Towns: Midland, Penetanguishene, Tiny, Tay, Wasaga Beach.

The form is two steps. Step 1 is address, property type, and contact. Step 2 is the rest of the property and intent fields. The submit button says **Request my neighbourhood solds read**.

## Form

| Item | Value |
|---|---|
| Netlify form name | `home-valuation-lab` |
| Production form (do not use here) | `home-valuation` |
| Honeypot | `bot-field` |
| CASL | `casl_consent` required |
| Extra acknowledgement | `preliminary_ack` required |
| Hidden fields | `lab_mode=1`, `source=home-value-lab` |
| Success page | `/lab/home-value-thanks.html` |

Netlify detects the form from the static HTML at deploy time, including while the passphrase gate is hiding it in the browser.

### After submit

1. Netlify stores the submission under **home-valuation-lab**.
2. The visitor lands on the lab thank-you page: recent solds will be reviewed, a preliminary range and sold examples will be emailed, an in-home visit is the fuller evaluation, and numbers may change with fit and finish.
3. Booking buttons on that page start as the bare Calendly URLs. If `jw-lab-home-value-lead` is present, the page rewrites them so the visitor does not type the same details again. A direct visit with an empty blob leaves the bare URLs. When name or email was saved, a line under the buttons reads: "We filled in your name and email from your request."

Bare bases:

- In-home: https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma
- Phone: https://calendly.com/jonathan-faristeam/jonathan-wallace-quick-phone-call

Prefill query (values are URL-encoded):

- Both: `name` (first and last), `email`, `a1` (property address)
- Phone only: `location` (digits from the phone field) and `a2` (phone as typed)

Sample shape:

`https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma?name=Pat%20Tester&email=pat%40example.com&a1=12%20Bay%20Street%2C%20Midland%2C%20ON`

`https://calendly.com/jonathan-faristeam/jonathan-wallace-quick-phone-call?name=Pat%20Tester&email=pat%40example.com&a1=12%20Bay%20Street%2C%20Midland%2C%20ON&location=7055550101&a2=705-555-0101`

Calendly setup: on both event types, make **Property address** the first invitee question so `a1` lands on it. The phone event uses `location` for Calendly's phone-call location. If that event asks for phone as a custom question instead, make it the second invitee question so `a2` lands on it.

Follow-up emails should use this same query pattern. See `lab/BACKEND.md`.

Nothing is emailed to the visitor automatically. Jonathan signs off before any client email goes out.

### Manual Netlify step (once per site)

In the Netlify UI, set the form notification for **home-valuation-lab** to **jonathan@faristeam.ca**.

Project configuration, then Forms, then `home-valuation-lab`, then form notifications. The production form notification does not cover a new form name.

Do not attach the production Make.com website-lead webhook to this form unless Jonathan asks. Lab pages do not load `assets/js/main.js`, so a lab submit does not fire that beacon, GA4, Google Ads, or the Follow Up Boss pixel.

## Privacy

- `noindex, nofollow, noarchive` on both lab pages.
- No canonical tag, so the lab is not declared as the public `/home-value.html` URL.
- `X-Robots-Tag: noindex, nofollow, noarchive` on `/lab/*` in `_headers` and `netlify.toml`.
- Not linked from the main nav, footer, blog, or any public page.
- Not listed in `sitemap.xml`.
- `robots.txt` is unchanged on purpose. An explicit `Disallow` can stop a crawler from seeing the noindex tag. The path is also not added as an Allow rule.
- GTM is omitted on both lab pages.

## Go-live gates (before this replaces public `/home-value`)

All of these stay in front of a public launch:

1. Three dry-runs logged, with a clear pass or fail on the comps email.
2. Notification email for `home-valuation-lab` confirmed, or a replacement path Jonathan has approved.
3. Jonathan is happy with the page copy and with a signed-off sample email.
4. A decision on the public form name: keep capturing live leads on `home-valuation` until cutover.
5. The go-live pull request, not this lab, removes the passphrase, the noindex tags, and the `/lab/*` robots header, and only then adds nav, footer, and sitemap links.
6. Jonathan explicitly says the public page can change.
7. A formal Letter of Opinion stays visit-only.
8. Client email is never auto-sent.

Until those gates pass, this folder is the only place the new promise and the richer form exist.
