# Home value lab: operator checklist

Slow hybrid. A person reviews real comps, drafts an email, and Jonathan signs off. This is not an instant AVM, and nothing in this folder sends email to the client.

Production form `home-valuation` is a different pipe. Do not mix the two.

## 1. Netlify form notify

Form name: `home-valuation-lab`

Hidden fields on every submission:

- `lab_mode` = `1`
- `source` = `home-value-lab`
- `subject` = `LAB home value request` (Netlify notification subject)

Also expect `preliminary_ack=yes` and `casl_consent=yes`. Ignore the submission if `bot-field` is filled (Netlify honeypot).

Manual step, once: Netlify form notification email for this form name to **jonathan@faristeam.ca**.

Do not turn on a Make.com webhook for this form until Jonathan asks. The public site beacon in `assets/js/main.js` is not loaded on lab pages, so a lab test does not create a production website lead.

## 2. CRM tags

When the Chief of Staff creates or updates the Follow Up Boss person from a lab submission, apply:

- `Home Value Request`
- `jonathanwallace.ca`
- `lab`

Keep `casl_consent` as the opt-in flag. Do not add the person to a public nurture sequence from a lab test unless Jonathan says so.

## 3. Chief of Staff ping

Ping on each real lab submission (skip obvious tests if Jonathan labelled them as tests). The ping carries:

- Full address
- Property type, occupancy, beds, baths, approximate sqft
- Waterfront, winter access, lot, basement, garage, condition
- Known issues and features
- Timeline, motivation, how they heard
- Name, email, phone

## 4. REALM comps

Pull recent solds that match the details above. For each comparable the draft will mention, record:

- Sold price
- Days on market
- A short why (why this sale is relevant to this property)

Then a preliminary discussion range (low to high). Condition, updates, and a walk-through still move the number. Do not call the range a formal Letter of Opinion.

## 5. Draft the email (do not send)

Channel: Outlook draft from Jonathan Wallace `<jonathan@faristeam.ca>`. Never Gmail. Never auto-send.

Subject: `Your home value read: [street], [town]`

Shape:

1. Greeting with first name, and thanks for the read on the full address. Mention the occupancy, beds, baths, and any key flags they gave.
2. **What the market is showing.** Homes in this segment have been trading in about the `$low to $high` range. State that this is a preliminary read from local solds, not a formal Letter of Opinion, and that condition, updates, and a walk-through still move the number.
3. Two or three sold examples: price, days on market, short why.
4. **What would refine this.** One or two bullets from the form (waterfront type, septic, renovation status, and similar).
5. In-home booking, always:
   https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma
6. Optional phone booking:
   https://calendly.com/jonathan-faristeam/jonathan-wallace-quick-phone-call
7. No pressure to list.
8. Sign-off: Jonathan Wallace, REALTOR®, Faris Team Real Estate Brokerage, 705-433-2525, jonathan@faristeam.ca, jonathanwallace.ca.

Voice: professional, calm, Canadian English. No em dashes. Do not use nestled, turnkey, cozy, or stunning. Do not use "Jonathan Wallace Real Estate" as a brokerage line.

## 6. Jonathan signs off

Send only after Jonathan explicitly says send.

If he wants a formal Letter of Opinion, that waits for the in-person visit. The email invites the visit. It does not pretend the letter is already done.

## Field map

| Form field | Use |
|---|---|
| `address` | Subject line and comps search. Required. |
| `property_type` | Segment: Detached, Semi / townhouse, Condo, Waterfront, Vacant land, Other. |
| `occupancy_type` | Year-round, Three-season / cottage, Seasonal other. |
| `beds`, `baths`, `sqft` | Match filters. Approximate. |
| `lot_type` | City / town lot, Large rural, Waterfront frontage, Condo / no lot, Not sure. |
| `waterfront` | No, Yes sand, Yes rocky / mixed, Yes other / not sure. |
| `winter_access` | Year-round road, Seasonal / private, N/A, Not sure. |
| `basement`, `garage`, `condition` | Refinement, not a reason to block the draft. |
| `known_issues`, `features`, `motivation` | The "what would refine this" bullets. |
| `timeline` | Just curious, 0 to 6 months, 6 to 12 months, 12+ months, Estate / refinance / other. |
| `how_heard` | Optional source note. |
| `first_name`, `last_name`, `email`, `phone` | The draft recipient and the CRM person. |
| `casl_consent` | Required. Do not email a marketing follow-up without it. |
| `preliminary_ack` | Required. They were told this is not instant and not a formal letter. |
| `lab_mode`, `source` | Marks the row as lab traffic. |
