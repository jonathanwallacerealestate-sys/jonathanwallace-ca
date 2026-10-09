#!/usr/bin/env python3
"""Build the North Simcoe Votes 2026 draft pages.

Source of truth:
  content/elections-2026/candidates.json
  content/elections-2026/municipalities.json

Photos live in assets/img/elections-2026/ (filenames from photo_file).
The hero is assets/img/north-simcoe-votes-2026-hero.jpg.

Run from the repo root:

  python3 scripts/build_election_2026.py

Generated pages are noindex,nofollow. This script does not edit sitemap.xml,
llms.txt, robots.txt, blog.html, or any existing page. Do not add these URLs
to site navigation.
"""

from __future__ import annotations

import html
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "content" / "elections-2026" / "candidates.json"
MUNIS = ROOT / "content" / "elections-2026" / "municipalities.json"
PHOTO_DIR = ROOT / "assets" / "img" / "elections-2026"
HERO = "/assets/img/north-simcoe-votes-2026-hero.jpg"
HUB_PATH = "/blog/north-simcoe-votes-2026/"
SITE = "https://jonathanwallace.ca"
AS_OF = "Oct 9, 2026"
BYLINE = "Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage"
NO_PLATFORM = (
    "No platform was found in our research. To connect with the candidate, "
    "reach out using their contact information to discuss their policies."
)
DISCLAIMER = (
    "The information comes from municipal and candidate sources as of Oct 9, 2026. "
    "This is a non-partisan resource and it does not endorse any candidate. "
    "Candidates can contact Jonathan at jonathan@faristeam.ca with corrections."
)

OFFICE_ORDER = ["Mayor", "Deputy Mayor", "Councillor"]
OFFICE_HEADING = {
    "Mayor": "Mayor",
    "Deputy Mayor": "Deputy Mayor",
    "Councillor": "Council",
}

PHONE_RE = re.compile(r"\d{3}-\d{3}-\d{4}")
DASH_RE = re.compile(r"[\u2013\u2014]|&mdash;|&ndash;")
SALES_RE = re.compile(r"Sales Representative", re.I)

HEADER = """<header class="site-header">
  <div class="wrap nav">
    <div class="brand"><a href="/"><span class="brand__name">Jonathan Wallace</span><span class="brand__tag">Your Georgian Bay Specialist</span></a></div>
    <nav><ul class="nav__links" id="navLinks">
      <li><a href="/sell.html">Sell</a></li><li><a href="/buy.html">Buy</a></li><li><a href="/home-tours.html">Home Tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/resources">Resources</a></li><li><a href="/blog.html">Blog</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li>
      <li class="nav__cta"><a class="btn btn--primary" href="/home-value.html">Price My Home</a></li>
    </ul></nav>
    <button class="nav__toggle" id="navToggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>"""

FOOTER = """<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <span class="brand__name">Jonathan Wallace</span>
      <p style="margin-top:12px;">Georgian Bay real estate, Midland, Penetanguishene, Tiny, Tay and Wasaga Beach.</p>
      <div class="footer__social">
        <a href="https://youtube.com/@jonathanwallaceRE" aria-label="YouTube" target="_blank" rel="noopener">YT</a>
        <a href="https://instagram.com/jonathanwallacerealestate" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
        <a href="https://www.linkedin.com/in/jonathanwallacerealestate" aria-label="LinkedIn" target="_blank" rel="noopener">in</a>
      </div>
    </div>
    <div><h4>Explore</h4><ul><li><a href="/sell.html">Sell your home</a></li><li><a href="/buy.html">Buy a home</a></li><li><a href="/home-tours.html">Home tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/home-value.html">Home value</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/blog.html">Blog</a></li><li><a href="/weekly">Weekly market hub</a></li><li><a href="/resources">Free guides</a></li><li><a href="/vendors">Verified Vendors</a></li></ul></div>
    <div>
      <h4>Get in touch</h4>
      <ul>
        <li><a href="tel:+17054332525">705-433-2525</a></li>
        <li><a href="mailto:jonathan@faristeam.ca">Email Jonathan</a></li>
        <li>Midland, Ontario</li>
      </ul>
    </div>
  </div>
  <div class="wrap footer__legal">
    <p><strong>Jonathan Wallace, REALTOR®</strong> · Faris Team Real Estate, Brokerage</p>
    <p>REALTOR®, MLS® and the associated logos are trademarks owned by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. Not intended to solicit properties already listed for sale or buyers/sellers under contract.</p>
    <p>© <span id="year">2026</span> Jonathan Wallace. All rights reserved. · <a href="/privacy.html">Privacy Policy</a></p>
  </div>
</footer>
<script src="/assets/js/main.js"></script>"""

GTM_HEAD = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P36FJB8L');</script>
<!-- End Google Tag Manager -->"""

GTM_BODY = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P36FJB8L"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""


def esc(value) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\u2014", ", ").replace("\u2013", " to ")
    text = text.replace("&mdash;", ", ").replace("&ndash;", " to ")
    return html.escape(text, quote=True)


def scrub_check(text: str, label: str) -> list[str]:
    problems = []
    if DASH_RE.search(text):
        problems.append(f"{label} contains an em dash or en dash")
    if SALES_RE.search(text):
        problems.append(f"{label} contains Sales Representative")
    if "noindex, nofollow" not in text and "noindex,nofollow" not in text:
        problems.append(f"{label} is missing noindex, nofollow")
    return problems


def candidate_url(candidate: dict) -> str:
    return f"/elections-2026/{candidate['slug'].strip('/')}/"


def photo_web_path(candidate: dict) -> tuple[str, bool]:
    raw = candidate.get("photo_file") or ""
    name = Path(raw).name if raw else ""
    if name and (PHOTO_DIR / name).is_file():
        return f"/assets/img/elections-2026/{name}", False
    return "/assets/img/elections-2026/silhouette.png", True


def host_label(url: str) -> str:
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower().removeprefix("www.")
    path = (parsed.path or "").rstrip("/")
    label = host + path if path else host
    if parsed.query and len(label) < 36:
        label = label + "?" + parsed.query
    return label or url


def ext_link(url: str, label: str | None = None) -> str:
    text = label or host_label(url)
    return (
        f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">{esc(text)}</a>'
    )


def phone_html(phone: str) -> str:
    parts = []
    last = 0
    for match in PHONE_RE.finditer(phone):
        parts.append(esc(phone[last:match.start()]))
        digits = re.sub(r"\D", "", match.group(0))
        parts.append(f'<a href="tel:+1{digits}">{esc(match.group(0))}</a>')
        last = match.end()
    parts.append(esc(phone[last:]))
    return "".join(parts)


def seat_word(n: int) -> str:
    return "1 seat" if n == 1 else f"{n} seats"


def person_word(n: int) -> str:
    return "1 candidate" if n == 1 else f"{n} candidates"


def shell(title: str, description: str, canonical_path: str, og_image: str, body: str) -> str:
    canonical = SITE + canonical_path
    desc = description.strip()
    if len(desc) > 180:
        desc = desc[:177].rsplit(" ", 1)[0] + "..."
    return f"""<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
{GTM_HEAD}
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{esc(SITE + og_image)}">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="Jonathan Wallace, Your Georgian Bay Specialist">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{esc(SITE + og_image)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="/assets/css/election-2026.css">
</head>
<body class="election">
{GTM_BODY}
{HEADER}
{body}
{FOOTER}
</body>
</html>
"""


def byline_html() -> str:
    return f'<p class="el-byline">By <strong>{esc(BYLINE)}</strong></p>'


def disclaimer_html() -> str:
    return f'<p class="el-disclaimer">{esc(DISCLAIMER)}</p>'


def vote_card(muni: dict, full: bool) -> str:
    hot = " is-hot" if muni.get("prominent") else ""
    rows = []
    for row in muni["rows"]:
        rows.append(f"<dt>{esc(row['label'])}</dt><dd>{esc(row['value'])}</dd>")
    note = f'<p class="el-mnote">{esc(muni["method_note"])}</p>' if muni.get("method_note") else ""
    alert = (
        f'<p class="el-alert">{esc(muni["prominent"])}</p>'
        if muni.get("prominent")
        else ""
    )
    ballot = ""
    if muni.get("ballot_question"):
        q = muni["ballot_question"]
        ballot = (
            f'<dt>Ballot question</dt><dd>&quot;{esc(q["text"])}&quot; {esc(q["detail"])} '
            f'{ext_link(q["url"], q["source_label"])}</dd>'
        )
    hours = ""
    if not full:
        # Profile cards keep method, first voting window, help centre and the alert.
        keep = []
        for row in muni["rows"]:
            label = row["label"].lower()
            if "hour" in label:
                continue
            if label.startswith("voters"):
                continue
            keep.append(f"<dt>{esc(row['label'])}</dt><dd>{esc(row['value'])}</dd>")
        rows = keep
        ballot = ""
    return f"""<article class="el-vcard{hot}" id="vote-{esc(muni['slug'])}">
      <h3>{esc(muni['short'])}</h3>
      <div class="el-kind">{esc(muni['kind'])}</div>
      <p class="el-method">{esc(muni['method'])}</p>
      {note}
      {alert}
      <dl>{''.join(rows)}{ballot}</dl>
      <div class="el-vfoot">
        <a class="el-btn" href="{esc(muni['register_url'])}" target="_blank" rel="noopener noreferrer">Check you are registered</a>
        <a class="el-textlink" href="{esc(muni['election_url'])}" target="_blank" rel="noopener noreferrer">Official election page</a>
      </div>
    </article>"""


def card_html(candidate: dict) -> str:
    photo, placeholder = photo_web_path(candidate)
    photo_class = " el-photo is-placeholder" if placeholder else " el-photo"
    alt = candidate["name"] if not placeholder else f"No photo on file for {candidate['name']}"
    badge = ""
    if candidate.get("acclaimed"):
        badge = '<span class="el-badge el-badge-acc">Acclaimed</span>'
    acc = " is-acc" if candidate.get("acclaimed") else ""
    if candidate.get("no_platform_found"):
        synopsis = NO_PLATFORM
        syn_class = "el-syn is-muted"
    else:
        synopsis = candidate.get("synopsis") or ""
        syn_class = "el-syn"
    role = candidate["office"]
    return f"""<a class="el-card{acc}" href="{esc(candidate_url(candidate))}">
      <div class="{photo_class.strip()}"><img src="{esc(photo)}" alt="{esc(alt)}" width="184" height="230" loading="lazy"></div>
      <div class="el-card-body">
        {badge}
        <h4>{esc(candidate['name'])}</h4>
        <div class="el-role">{esc(role)}</div>
        <p class="{syn_class}">{esc(synopsis)}</p>
        <span class="el-textlink">View profile</span>
      </div>
    </a>"""


def hub_page(guide: dict, candidates: list[dict]) -> str:
    by_muni: dict[str, list[dict]] = {}
    for candidate in candidates:
        by_muni.setdefault(candidate["municipality_slug"], []).append(candidate)
    munis = {m["slug"]: m for m in guide["municipalities"]}
    seats = 0
    seen_offices = set()
    acclaimed = 0
    for candidate in candidates:
        key = (candidate["municipality_slug"], candidate["office"])
        if key not in seen_offices:
            seen_offices.add(key)
            seats += int(candidate["seats_for_office"])
        if candidate.get("acclaimed"):
            acclaimed += 1

    dates = []
    for item in guide["key_dates"]:
        hot = " is-hot" if item.get("highlight") else ""
        dates.append(
            f'<div class="el-date{hot}"><b>{esc(item["date"])}</b><span>{esc(item["text"])}</span></div>'
        )
    jumps = []
    for muni in guide["municipalities"]:
        jumps.append(f'<a href="#{esc(muni["slug"])}">{esc(muni["short"])}</a>')
    vote_cards = "".join(vote_card(m, True) for m in guide["municipalities"])
    general = " ".join(ext_link(link["url"], link["label"]) for link in guide["general_links"])

    sections = []
    for muni in guide["municipalities"]:
        group = by_muni.get(muni["slug"], [])
        offices: dict[str, list[dict]] = {}
        for candidate in group:
            offices.setdefault(candidate["office"], []).append(candidate)
        acc_count = sum(1 for c in group if c.get("acclaimed"))
        acc_badge = (
            f'<span class="el-badge el-badge-acc">{acc_count} acclaimed</span>'
            if acc_count
            else ""
        )
        notes = []
        for note in muni.get("notes") or []:
            notes.append(f'<p class="el-note"><span class="el-badge el-badge-soft">Note</span><span>{esc(note)}</span></p>')
        if muni.get("ballot_question"):
            q = muni["ballot_question"]
            notes.append(
                '<p class="el-note"><span class="el-badge el-badge-soft">Ballot question</span>'
                f'<span>The ballot also asks: &quot;{esc(q["text"])}&quot; {esc(q["detail"])} '
                f'{ext_link(q["url"], q["source_label"])}.</span></p>'
            )
        blocks = []
        for office in OFFICE_ORDER:
            people = offices.get(office) or []
            if not people:
                continue
            n_seats = int(people[0]["seats_for_office"])
            all_acc = all(p.get("acclaimed") for p in people)
            meta = f"{seat_word(n_seats)} / Acclaimed" if all_acc else f"{seat_word(n_seats)} / {person_word(len(people))}"
            cards = "".join(card_html(p) for p in people)
            blocks.append(
                f'<div class="el-office"><div class="el-office-head"><h3>{esc(OFFICE_HEADING[office])}</h3>'
                f'<span class="el-meta">{esc(meta)}</span></div>'
                f'<div class="el-cards">{cards}</div></div>'
            )
        sections.append(f"""<section class="el-muni" id="{esc(muni['slug'])}">
      <div class="el-muni-head">
        <div>
          <p class="el-eyebrow">{esc(muni['kind'])}, {len(group)} candidates</p>
          <h2>{esc(muni['name'])}</h2>
          <p>{esc(muni['offices_blurb'])}</p>
        </div>
        <div class="el-muni-meta">{acc_badge}<a class="el-textlink" href="#how-to-vote">How to vote in {esc(muni['short'])}</a></div>
      </div>
      {''.join(notes)}
      {''.join(blocks)}
      <p class="el-muni-foot"><span>Candidates are listed alphabetically by surname within each office.</span> {ext_link(muni['election_url'], 'Official election page')}</p>
    </section>""")

    body = f"""<img class="el-hero-img" src="{HERO}" alt="North Simcoe Votes 2026, a non-partisan guide to the municipal elections in Midland, Penetanguishene, Tiny, Tay and Wasaga Beach. Election Day Monday, October 26, 2026." width="1280" height="720">
<main class="el">
  <div class="el-wrap el-intro">
    {byline_html()}
    <p class="el-eyebrow">2026 municipal election, voter guide</p>
    <h1>North Simcoe Votes 2026</h1>
    <p class="el-eday"><i></i>Election Day: {esc(guide['election_day_label'])}</p>
    <p class="el-lede">{esc(guide['intro'])}</p>
    <div class="el-jump">{''.join(jumps)}</div>
    <div class="el-stats">
      <div><b>{len(candidates)}</b><span>Candidates</span></div>
      <div><b>{seats}</b><span>Seats to fill</span></div>
      <div><b>{acclaimed}</b><span>Acclaimed</span></div>
    </div>
    <p class="el-regnote">{esc(guide['term'])} Candidates appear alphabetically by surname within each office. Information is current as of {esc(AS_OF)}.</p>
  </div>
  <div class="el-dates"><div class="el-wrap el-dates-grid"><div class="el-dates-label">Key dates</div>{''.join(dates)}</div></div>
  <section class="el-sec" id="how-to-vote">
    <div class="el-wrap">
      <div class="el-sec-head">
        <div>
          <p class="el-eyebrow">Before you vote</p>
          <h2>How to vote in your municipality</h2>
        </div>
        <p>Each municipality sets its own voting method. Check that you are on the voters' list before voting opens. Tiny's online registration closes Monday, October 12.</p>
      </div>
      <div class="el-vote-grid">{vote_cards}</div>
      <p class="el-regnote">{esc(guide['voters_list_note'])} {general}</p>
    </div>
  </section>
  <section class="el-sec">
    <div class="el-wrap">
      <div class="el-sec-head">
        <div>
          <p class="el-eyebrow">The candidates</p>
          <h2>Who is running, by municipality</h2>
        </div>
        <p>Open a profile for contact details, priorities and sources. Summaries use the candidate's own materials. News coverage is not used as a source.</p>
      </div>
      {''.join(sections)}
      {disclaimer_html()}
    </div>
  </section>
</main>"""
    title = "North Simcoe Votes 2026 | Jonathan Wallace"
    description = (
        "A non-partisan resource guide to the 2026 municipal elections in Midland, "
        "Penetanguishene, Tiny, Tay and Wasaga Beach. Election Day is Monday, October 26, 2026."
    )
    return shell(title, description, HUB_PATH, HERO, body)


def contact_block(candidate: dict) -> str:
    items = []
    seen = set()

    def add(label: str, url: str, html_value: str | None = None):
        if not url or url in seen:
            return
        seen.add(url)
        value = html_value if html_value is not None else ext_link(url, host_label(url))
        items.append(f"<li><small>{esc(label)}</small><div>{value}</div></li>")

    website = candidate.get("website")
    if website:
        add("Website", website)
    phone = candidate.get("phone")
    email = candidate.get("email")
    if phone:
        items.append(f"<li><small>Phone</small><div>{phone_html(phone)}</div></li>")
    if email:
        items.append(
            f'<li><small>Email</small><div><a href="mailto:{esc(email)}">{esc(email)}</a></div></li>'
        )
    for key, label in (
        ("facebook", "Facebook"),
        ("instagram", "Instagram"),
        ("x", "X"),
        ("linkedin", "LinkedIn"),
        ("tiktok", "TikTok"),
    ):
        if candidate.get(key):
            add(label, candidate[key])
    for link in candidate.get("other_links") or []:
        if link.get("url"):
            add(link.get("label") or "Link", link["url"])

    button = ""
    primary = website or candidate.get("primary_link")
    if primary:
        button_label = "Visit website" if website else "Open link"
        button = (
            f'<a class="el-btn" href="{esc(primary)}" target="_blank" rel="noopener noreferrer">{button_label}</a>'
        )
    notes = []
    if not phone and not email:
        notes.append("<p class=\"el-csrc\">No phone or email was published for this candidate.</p>")
    if candidate.get("contact_note"):
        notes.append(f'<p class="el-csrc">{esc(candidate["contact_note"])}</p>')
    if candidate.get("link_note"):
        notes.append(f'<p class="el-csrc">{esc(candidate["link_note"])}</p>')
    if candidate.get("contact_source"):
        notes.append(
            f'<p class="el-csrc">Contact source: {ext_link(candidate["contact_source"])}</p>'
        )
    listing = f'<ul class="el-clist">{"".join(items)}</ul>' if items else ""
    return f"""<div class="el-side">
      <h2>Contact</h2>
      {button}
      {listing}
      {''.join(notes)}
    </div>"""


def profile_vote(muni: dict) -> str:
    rows = []
    for row in muni["rows"]:
        label = row["label"].lower()
        if "hour" in label or label.startswith("voters"):
            continue
        rows.append(f"<dt>{esc(row['label'])}</dt><dd>{esc(row['value'])}</dd>")
    alert = (
        f'<p class="el-alert">{esc(muni["prominent"])}</p>' if muni.get("prominent") else ""
    )
    return f"""<div class="el-mini">
      <div>
        <p class="el-eyebrow">How to vote in {esc(muni['short'])}</p>
        <h3>{esc(muni['method'])}</h3>
        {alert}
        <dl>{''.join(rows)}<dt>Election Day</dt><dd>Monday, October 26, 2026</dd></dl>
      </div>
      <div class="el-mini-acts">
        <a class="el-btn el-btn-gold" href="{esc(muni['register_url'])}" target="_blank" rel="noopener noreferrer">Check you are registered</a>
        <a class="el-btn el-btn-line" href="{HUB_PATH}#how-to-vote">All voting details</a>
      </div>
    </div>"""


def candidate_page(candidate: dict, peers: list[dict], muni: dict) -> str:
    photo, placeholder = photo_web_path(candidate)
    alt = candidate["name"] if not placeholder else f"No photo on file for {candidate['name']}"
    photo_class = "el-portrait is-placeholder" if placeholder else "el-portrait"
    credit = ""
    if not placeholder and candidate.get("photo_source_url"):
        credit = f'<p class="el-credit">Photo source: {ext_link(candidate["photo_source_url"])}</p>'
    pills = [
        f'<span class="el-pill is-dark">Candidate for {esc(candidate["office"])}</span>',
        f'<span class="el-pill">{esc(muni["name"])}</span>',
        f'<span class="el-pill">{esc(seat_word(int(candidate["seats_for_office"])))}, elected at large</span>',
    ]
    if candidate.get("incumbent") and candidate.get("current_office"):
        pills.append(f'<span class="el-pill">Current {esc(candidate["current_office"])}</span>')
    if candidate.get("acclaimed"):
        pills.append('<span class="el-pill">Acclaimed</span>')

    if candidate.get("no_platform_found"):
        story = f'<p class="el-nop">{esc(NO_PLATFORM)}</p>'
        priorities = ""
    else:
        story = f'<p class="el-synopsis">{esc(candidate.get("synopsis") or "")}</p>'
        points = candidate.get("top_points") or []
        points = points[:5]
        source = candidate.get("platform_source") or "the candidate's published materials"
        items = "".join(f"<li>{esc(point)}</li>" for point in points)
        priorities = ""
        if items:
            priorities = (
                f'<h2 class="el-h2">Priorities</h2>'
                f'<p class="el-sub">Source: {esc(source)}. Up to five points.</p>'
                f'<ol class="el-points">{items}</ol>'
            )

    acc_note = ""
    if candidate.get("acclamation_note"):
        acc_note = f'<p class="el-note"><span>{esc(candidate["acclamation_note"])}</span></p>'

    others = [p for p in peers if p["slug"] != candidate["slug"]]
    n_seats = int(candidate["seats_for_office"])
    total = len(peers)
    if others:
        chips = "".join(
            f'<a href="{esc(candidate_url(p))}">{esc(p["name"])}</a>' for p in others
        )
        heading = OFFICE_HEADING[candidate["office"]]
        others_html = f"""<h2 class="el-h2">Also running for {esc(heading)} in {esc(muni['short'])}</h2>
      <p class="el-sub">{esc(person_word(total))} for {esc(seat_word(n_seats))}, listed alphabetically by surname.</p>
      <div class="el-chips">{chips}</div>"""
    else:
        others_html = f"""<h2 class="el-h2">Also running for {esc(OFFICE_HEADING[candidate['office']])} in {esc(muni['short'])}</h2>
      <p class="el-sub">No other candidates filed for this office.</p>"""

    sources = []
    seen = set()
    for url in candidate.get("sources") or []:
        if url and url not in seen:
            seen.add(url)
            sources.append(f"<li>{ext_link(url)}</li>")
    further = ""
    fr = candidate.get("further_reading")
    if isinstance(fr, dict) and fr.get("url"):
        note = fr.get("note") or "Not used as a source for this guide."
        further = f"""<aside class="el-further">
        <h2 class="el-h2">Further reading (not a source for this guide)</h2>
        <p class="el-sub">{esc(note)}</p>
        <p>{ext_link(fr['url'], fr.get('label') or host_label(fr['url']))}</p>
      </aside>"""

    slug_tail = candidate["slug"].split("/")[-1]
    contact = contact_block(candidate)
    body = f"""<main class="el">
  <div class="el-wrap">
    <nav class="el-crumbs" aria-label="Breadcrumb">
      <a href="{HUB_PATH}">North Simcoe Votes 2026</a>
      <span>/</span>
      <a href="{HUB_PATH}#{esc(muni['slug'])}">{esc(muni['name'])}</a>
      <span>/</span>
      <span>{esc(OFFICE_HEADING[candidate['office']])}</span>
      <span>/</span>
      <span>{esc(candidate['name'])}</span>
    </nav>
    <article class="el-prof">
      <aside>
        <div class="{photo_class}"><img src="{esc(photo)}" alt="{esc(alt)}" width="600" height="750"></div>
        {credit}
        <div class="el-contact-desktop">{contact}</div>
      </aside>
      <div>
        {byline_html()}
        <p class="el-eyebrow">Candidate, {esc(muni['name'])}</p>
        <h1>{esc(candidate['name'])}</h1>
        <div class="el-pills">{''.join(pills)}</div>
        {acc_note}
        {story}
        <div class="el-contact-mobile">{contact}</div>
        {priorities}
        {profile_vote(muni)}
        {others_html}
        <h2 class="el-h2">Sources</h2>
        <p class="el-sub">Sources only. These are the pages used for this profile.</p>
        <ul class="el-sources">{''.join(sources)}</ul>
        {further}
        {disclaimer_html()}
        <a class="el-btn el-btn-line el-back" href="{HUB_PATH}">Back to North Simcoe Votes 2026</a>
      </div>
    </article>
  </div>
</main>"""
    title = f"{candidate['name']}, {candidate['office']} candidate, {muni['name']} | North Simcoe Votes 2026"
    if candidate.get("no_platform_found"):
        description = NO_PLATFORM
    else:
        description = candidate.get("synopsis") or title
    og = photo
    return shell(title, description, candidate_url(candidate), og, body), slug_tail


def clean_output() -> None:
    hub_dir = ROOT / "blog" / "north-simcoe-votes-2026"
    if hub_dir.exists():
        shutil.rmtree(hub_dir)
    election_dir = ROOT / "elections-2026"
    if election_dir.exists():
        shutil.rmtree(election_dir)


def main() -> int:
    guide = json.loads(MUNIS.read_text(encoding="utf-8"))
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    candidates = payload["candidates"]
    muni_by_slug = {m["slug"]: m for m in guide["municipalities"]}
    missing = [c["slug"] for c in candidates if c["municipality_slug"] not in muni_by_slug]
    if missing:
        print("Missing municipality records:", ", ".join(missing), file=sys.stderr)
        return 1
    if not (ROOT / HERO.lstrip("/")).is_file():
        print("Missing hero image", HERO, file=sys.stderr)
        return 1
    if not (PHOTO_DIR / "silhouette.png").is_file():
        print("Missing silhouette.png", file=sys.stderr)
        return 1

    clean_output()
    problems: list[str] = []
    written = []

    hub_html = hub_page(guide, candidates)
    hub_file = ROOT / "blog" / "north-simcoe-votes-2026" / "index.html"
    hub_file.parent.mkdir(parents=True, exist_ok=True)
    hub_file.write_text(hub_html, encoding="utf-8")
    written.append(hub_file)
    problems.extend(scrub_check(hub_html, str(hub_file.relative_to(ROOT))))

    grouped: dict[tuple[str, str], list[dict]] = {}
    for candidate in candidates:
        grouped.setdefault((candidate["municipality_slug"], candidate["office"]), []).append(candidate)

    for candidate in candidates:
        peers = grouped[(candidate["municipality_slug"], candidate["office"])]
        page, _slug = candidate_page(candidate, peers, muni_by_slug[candidate["municipality_slug"]])
        path = ROOT / candidate_url(candidate).strip("/") / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
        written.append(path)
        problems.extend(scrub_check(page, str(path.relative_to(ROOT))))
        if candidate.get("no_platform_found") and NO_PLATFORM not in page:
            problems.append(f"{candidate['slug']} is missing the no-platform sentence")
        if candidate.get("further_reading") and "Further reading (not a source for this guide)" not in page:
            problems.append(f"{candidate['slug']} is missing the further reading block")
        if not candidate.get("further_reading") and "Further reading (not a source for this guide)" in page:
            problems.append(f"{candidate['slug']} has a further reading block without data")

    # Guard: do not let a rebuild wire these pages into discovery files.
    for rel in ("sitemap.xml", "llms.txt", "blog.html", "index.html", "robots.txt"):
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "north-simcoe-votes-2026" in text or "/elections-2026/" in text:
            problems.append(f"{rel} links to the draft election pages")

    print(f"Wrote {len(written)} pages ({len(candidates)} candidates + hub)")
    if problems:
        print("Problems:", file=sys.stderr)
        for problem in problems:
            print(" -", problem, file=sys.stderr)
        return 1
    print("Checks passed: noindex, no dashes, no Sales Representative, discovery files untouched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
