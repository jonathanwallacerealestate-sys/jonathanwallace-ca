#!/usr/bin/env python3
"""Build blog-market-update-aug-31-sep-6-2026.html from the previous week's REPO source.
Clones per DEC-059 (repo source via raw, never the live URL, which strips data-netlify).
"""
import re, sys, pathlib

SRC = "/home/claude/site/blog-market-update-aug-24-30-2026.html"
OUT = "/home/claude/site/blog-market-update-aug-31-sep-6-2026.html"

OLD_SLUG = "blog-market-update-aug-24-30-2026"
NEW_SLUG = "blog-market-update-aug-31-sep-6-2026"
OLD_WEEK = "Week of August 24 to August 30, 2026"
NEW_WEEK = "Week of August 31 to September 6, 2026"
OLD_DATE = "2026-09-03"
NEW_DATE = "2026-09-09"
OLD_TITLE = "The Average Price Jumped $40,000 This Week. Fewer Homes Sold. Here Is What Actually Moved."
NEW_TITLE = "The Best Inventory Number in Six Weeks Came From Simcoe County Sellers Giving Up."
NEW_DESC = ("Simcoe County recorded 142 sales at an average of $746,077 in the week of August 31 to "
            "September 6, 2026. Months of inventory fell to 7.7, but roughly 514 listings left the "
            "market without selling rather than buyers absorbing them.")
NEW_HERO = "assets/img/market-aug-31-sep-6-2026.jpg"
NEW_HERO_ALT = ("A cottage-country home with honey-toned wood siding, a shed dormer and a deep covered porch, warm light in the windows under an early autumn treeline, titled Georgian Bay Market Update, Week of August 31 to September 6, 2026")
NEW_HERO_CAP = "Early September light on a cottage-country home."

STATS = [
    ("Sales", "142", "down 11.3%"),
    ("Average Sale Price", "$746,077", "down 1.7%"),
    ("New Listings", "495", "up 75"),
    ("Active Listings", "5,267", "down 161"),
    ("Sales to New Listing Ratio", "29%", "down 9 points"),
    ("Months of Inventory", "7.7", "down 0.3"),
    ("Days on Market", "47", "down 2 days"),
    ("List to Sale Price Ratio", "96%", "no change"),
]

FAQ = [
 ("Is the Simcoe County real estate market in trouble?",
  "No. The week of August 31 to September 6, 2026 looked weak on the surface, with sales down 11.3 percent to 142 and roughly 514 listings leaving the market without selling. Most of that reflects listing agreements written in the spring expiring on August 31, not a collapse in demand. New listings rose by 75 in the same week, and homes that did sell averaged 47 days on market at 96 percent of asking, which is a functioning market with a pricing problem at the margins rather than a failing one."),
 ("Is it a buyer's market in Simcoe County right now?",
  "Yes. Simcoe County had 7.7 months of inventory in the week of August 31 to September 6, 2026, and any reading above 6 months is considered a buyer's market. Inventory eased by 0.3 months, but the move came from listings leaving the market rather than from sales, which fell 11.3 percent to 142."),
 ("Are home prices going up or down in Georgian Bay?",
  "The average sale price in Simcoe County was $746,077 in the week of August 31 to September 6, 2026, down 1.7 percent on the week. Weekly averages move with the mix of homes that happen to sell, so the steadier read is the list to sale price ratio, which held at 96 percent, and days on market, which came in at 47. Both point to prices holding rather than falling, with buyers negotiating at the margins."),
 ("How long are homes taking to sell in Simcoe County?",
  "Homes that sold in Simcoe County in the week of August 31 to September 6, 2026 took an average of 47 days, 2 days faster than the week before. That figure describes homes that sold, not the 5,267 listings still active."),
 ("What should sellers in Midland or Penetanguishene do in this market?",
  "Price to comparable homes that have sold in the last 60 days rather than to peak pricing, and invest in presentation before listing. In the week of August 31 to September 6, 2026, roughly 514 listings left the market without selling as spring agreements expired, while homes that did sell averaged 47 days at 96 percent of asking. The difference between those two groups is price and presentation, not the market."),
]

TAKEAWAYS = [
 "Months of inventory fell 0.3 to 7.7, the lowest reading in six weeks.",
 "495 new listings arrived and 142 homes sold, yet active listings fell by 161. Roughly 514 homes left the market without selling, about three and a half exits for every sale.",
 "Listing agreements written in the spring commonly end on August 31, so the drop reflects contracts expiring rather than demand rising.",
 "Homes that sold took 47 days at 96 percent of asking, two days faster than the week before.",
 "Toronto sales fell in August, ending a five-month rebound. Georgian Bay typically feels a Toronto move 30 to 60 days later, which puts the effect on late September and October rather than on this week.",
]

CITATION = "https://www.theglobeandmail.com/business/article-toronto-home-sales-fall-in-august-ending-five-month-rebound/"

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def build_body():
    p = []
    a = p.append
    a('<p style="font-size:1.2rem;line-height:1.62;border-left:3px solid #C9A96A;padding-left:20px;margin:0 0 1.6em;">'
      'Simcoe County recorded 142 sales in the week of August 31 to September 6, 2026, at an average sale price of '
      '$746,077, with 7.7 months of inventory. It remains a buyer\'s market. Months of inventory fell to its lowest '
      'reading in six weeks, and the reason is not that buyers came back.</p>')
    a('')
    a('<div style="background:#F3EEE3;padding:22px 26px;border-radius:12px;margin:0 0 1.8em;">')
    a('        <p style="font-family:Inter,sans-serif;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;'
      'color:#1B1B1B;font-weight:700;margin:0 0 10px;">Key takeaways</p>')
    a('        <ul style="margin:0;padding-left:1.1em;font-family:Inter,sans-serif;font-size:.97rem;line-height:1.6;">'
      + "".join(f"<li>{t}</li>" for t in TAKEAWAYS) + '</ul>')
    a('      </div>')
    a('')
    a('      <p>Months of inventory in Simcoe County fell to 7.7, the lowest reading in six weeks. Active listings '
      'dropped by 161. Read quickly, that looks like a market tightening.</p>')
    a('      <p>Almost none of it came from buyers.</p>')
    a('      <h2>The real read</h2>')
    a('      <p>495 new listings came on. 142 homes sold. The pool of active listings still shrank by 161.</p>')
    a('      <p>Those three numbers do not reconcile unless something else removed homes from the board. Work it '
      'through: 495 arrived, 142 sold, and the total still fell by 161. That leaves 514 homes that left the market '
      'without a sale, roughly three and a half exits for every closing.</p>')
    a('      <p>Those are expiries, terminations and withdrawals, and the timing is not an accident. Listing '
      'agreements written in the spring commonly run to the end of August, so September 1 is when a large block of '
      'them ends at once.</p>')
    a('      <p>The inventory number improved for the least encouraging reason available. Not more demand. Fewer '
      'sellers willing to keep waiting.</p>')
    a('      <h2>The supply side</h2>')
    a('      <p>Sellers have not left the market. New listings rose by 75 in the same week, and the sales to new '
      'listing ratio fell 9 points to 29 percent, which means listings arrived faster than buyers absorbed them. '
      'Many of the 514 will come back, some with a new agent and a new price, and that supply lands in the fall '
      'market rather than disappearing from it.</p>')
    a('      <p>So the useful way to read 7.7 months is as a pause in the count, not a change in the balance.</p>')
    a('      <h2>The bigger picture</h2>')
    a(f'      <p>Toronto reported its August numbers the same week. <a href="{CITATION}" target="_blank" '
      'rel="noopener">Home sales fell in the Toronto area in August, ending a five-month rebound</a>, '
      'with activity slowing through a month when trade talks with the United States collapsed.</p>')
    a('      <p>That matters here, but not immediately. Georgian Bay does not move with Toronto, it moves '
      'after Toronto. We typically see the ripple effects 30 to 60 days later in our market. Most people buying in Midland, '
      'Penetanguishene or Tiny are selling something in the Greater Toronto Area first, and what that home '
      'did in August decides what they can offer here.</p>')
    a('      <p>So a softer August in Toronto is not this week\'s story. It is late September and October. '
      'The sellers whose agreements expired on September 1 are relisting into exactly that window, with a buyer '
      'pool arriving with a little less room than it had in the spring.</p>')
    a('      <h2>A buyer\'s market does not mean sellers lose</h2>')
    a('      <p>The list to sale price ratio held at 96 percent, and homes that sold did it in 47 days, two days '
      'faster than the week before. At 7.7 months of inventory buyers have selection and time, and yet homes priced '
      'and presented to current evidence still traded close to asking on a normal timeline.</p>')
    a('      <p>The 514 are not proof that homes cannot sell in Simcoe County. They are what a market does with a '
      'price it does not agree with.</p>')
    a('      <h2>What this means for you</h2>')
    a('      <p><strong>Buying:</strong> 142 sales against 5,267 active listings is as much choice as this market '
      'has offered. The expiry wave adds to it, because a seller who just came off the board and intends to try '
      'again is usually rethinking price before relisting.</p>')
    a('      <p><strong>Selling:</strong> if a listing expired on September 1, the market did not reject the home. '
      'Price, presentation or exposure did not match what buyers are choosing, and all three are fixable. Early '
      'fall is a real second window, and the homes that use it well change something meaningful rather than '
      'relisting the same package at the same number.</p>')
    a('      <h2>The week at a glance</h2>')
    th = ('<th style="text-align:left;padding:9px 10px;border-bottom:2px solid #C9A96A;'
          'font-family:Inter,sans-serif;">')
    rows = [f'<tr>{th}Metric</th>{th}This week</th>{th}Change</th></tr>']
    for label, val, chg in STATS:
        rows.append(
            '<tr>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #EAE4D8;">{label}</td>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #EAE4D8;font-weight:600;">{val}</td>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #EAE4D8;color:#8A8378;">{chg}</td>'
            '</tr>')
    a('      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;margin:1.2em 0 1.6em;'
      'font-family:Inter,sans-serif;font-size:.98rem;">' + "".join(rows) + '</table></div>')
    a('')
    a('      <h2>Common questions about this market</h2>')
    for q, ans in FAQ:
        a(f'      <h3>{q}</h3>')
        a(f'      <p>{ans}</p>')
    a('      <p>Early fall on Georgian Bay is when the next market forms. If a listing came off the board on '
      'September 1, or you are weighing a move in Midland, Penetanguishene, Tiny, Tay or Wasaga Beach, '
      '<a href="contact.html">send me a message</a> and we will look at your street rather than the county average. '
      'If you have a home to sell, a <a href="home-value.html">free, no-obligation valuation</a> is the fastest way '
      'to see which band your home sits in.</p>')
    a('')
    a('      ')
    return "\n      ".join(p).replace("\n      \n", "\n\n")

def main():
    h = pathlib.Path(SRC).read_text(encoding="utf-8")
    orig_len = len(h)

    # 1. Rebuild the whole authored region: lead -> just before the trailing FAQ accordion.
    start = h.index('<p style="font-size:1.2rem')
    end = h.index('<h2>Frequently asked questions</h2>')
    h = h[:start] + build_body() + h[end:]

    # 2. Trailing FAQ accordion mirrors question one.
    acc_start = h.index('<h2>Frequently asked questions</h2>')
    acc_end = h.index('<h2>Keep reading</h2>')
    q, ans = FAQ[0]
    acc = ('<h2>Frequently asked questions</h2>\n      <div class="faq">\n'
           f'        <h3>{q}</h3>\n        <p>{ans}</p>\n      </div>\n\n\n      ')
    h = h[:acc_start] + acc + h[acc_end:]

    # 3. Keep reading: previous market update becomes last week's post.
    h = h.replace(
        '<li><a href="blog-market-update-aug-17-23-2026.html">Homes Sold 10 Days Faster This Week. '
        'The Inventory Number Still Got Worse.</a></li>',
        '<li>@@PREVLINK@@</li>')

    # 4. FAQPage JSON-LD rebuilt from FAQ.
    import json
    faq_ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": ans}} for q, ans in FAQ]
    }
    h = re.sub(r'\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"FAQPage".*?\n\}',
               json.dumps(faq_ld, indent=2, ensure_ascii=False), h, count=1, flags=re.S)

    # 5. Head metadata, titles, dates, slug, hero.
    h = h.replace(OLD_TITLE, NEW_TITLE)
    h = re.sub(r'(<meta name="description" content=")[^"]*(")', r'\1' + NEW_DESC + r'\2', h, count=1)
    h = re.sub(r'(<meta property="og:description" content=")[^"]*(")', r'\1' + NEW_DESC + r'\2', h, count=1)
    h = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', r'\1' + NEW_DESC + r'\2', h, count=1)
    h = h.replace("assets/img/market-aug-24-30-2026.jpg", NEW_HERO)
    h = re.sub(r'(<img src="' + re.escape(NEW_HERO) + r'" alt=")[^"]*(")', r'\1' + NEW_HERO_ALT + r'\2', h, count=1)
    h = re.sub(r'<figcaption>[^<]*</figcaption>', f'<figcaption>{NEW_HERO_CAP}</figcaption>', h, count=1)
    h = h.replace(OLD_WEEK, NEW_WEEK)
    h = h.replace(OLD_DATE, NEW_DATE)
    h = h.replace(OLD_SLUG + ".html", NEW_SLUG + ".html")
    h = h.replace(OLD_SLUG + '"', NEW_SLUG + '"')
    # BreadcrumbList position 3 still names last week
    h = h.replace('"name": "Market update, August 24 to August 30, 2026"',
                  '"name": "Market update, August 31 to September 6, 2026"')
    # Resolve the previous-post link LAST so the global title/slug swaps cannot touch it
    h = h.replace('@@PREVLINK@@', f'<a href="{OLD_SLUG}.html">{esc(OLD_TITLE)}</a>')
    assert '@@PREVLINK@@' not in h

    # Prose link colour must never apply to buttons: .post-body a is more specific
    # than .btn--primary, so a copper button rendered copper-on-copper text (2026-09-09).
    if ".post-body a:not(.btn){" not in h:
        h = h.replace(".post-body a{", ".post-body a:not(.btn){")
    assert ".post-body a{" not in h, "prose link rule still unscoped"

    pathlib.Path(OUT).write_text(h, encoding="utf-8")
    print(f"wrote {OUT}  {orig_len} -> {len(h)} bytes")

if __name__ == "__main__":
    main()
