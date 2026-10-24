#!/usr/bin/env python3
"""Build the North Simcoe Votes 2026 draft pages.

Source of truth:
  content/elections-2026/candidates.json
  content/elections-2026/municipalities.json

Photos live in assets/img/elections-2026/ under the filename in photo_file. Circles use object-fit: cover so each headshot fills the frame.
The hub opens on the title and Election Day, then one link per town, then the key dates.
The vote-signs image is an inline figure under the dates. That same file is the
OG image, Twitter image, and blog card thumbnail:
assets/img/blog-north-simcoe-votes-2026.jpg.

Run from the repo root:

  python3 scripts/build_election_2026.py

Generated pages are index,follow, with canonical URLs on jonathanwallace.ca.
The hub is listed on blog.html, in sitemap.xml, and in llms.txt. Town and
candidate pages are in sitemap.xml. This script does not edit those files.
Do not add these URLs to site navigation.
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
HERO = "/assets/img/blog-north-simcoe-votes-2026.jpg"
HUB_PATH = "/blog/north-simcoe-votes-2026/"
SITE = "https://jonathanwallace.ca"
AS_OF = "Oct 9, 2026"
BYLINE = "Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage"
NO_PLATFORM = (
    "No platform was found in our research. To connect with the candidate, "
    "reach out using their contact information to discuss their policies."
)
DISCLAIMER = (
    "The information comes from municipal, candidate and news sources as of Oct 13, 2026. "
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
    if "noindex" in text:
        problems.append(f"{label} is still noindex")
    if "index, follow" not in text:
        problems.append(f"{label} is missing index, follow")
    if f'href="{SITE}' not in text and "canonical" not in text:
        problems.append(f"{label} is missing a canonical URL")
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


def shell(title: str, description: str, canonical_path: str, og_image: str, body: str, json_ld: str = "") -> str:
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
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
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
{json_ld}</head>
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


def reading_label(further: dict) -> str:
    label = (further.get("label") or "Further reading").strip()
    match = re.match(r"^(.*?)\s*\((.+)\)\s*$", label)
    if match:
        return f"{match.group(1).strip()}: {match.group(2).strip()}"
    return label


def link_label(url: str) -> str:
    """Visible label for a contact link. Never 'Open link'."""
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower().removeprefix("www.")
    path = (parsed.path or "").lower()
    if host == "teamwasaga.ca" and path.startswith("/team/"):
        return "Team Wasaga profile"
    if host == "facebook.com" or host.endswith(".facebook.com") or host == "fb.com":
        return "Facebook page"
    if host == "instagram.com" or host.endswith(".instagram.com"):
        return "Instagram"
    if host == "linkedin.com" or host.endswith(".linkedin.com"):
        return "LinkedIn"
    if host in {"x.com", "twitter.com"}:
        return "X"
    if host == "tiktok.com" or host.endswith(".tiktok.com"):
        return "TikTok"
    if host in {"youtube.com", "m.youtube.com", "youtu.be"}:
        return "YouTube"
    return "Website"


def person_card(candidate: dict) -> str:
    photo, placeholder = photo_web_path(candidate)
    alt = candidate["name"] if not placeholder else f"No photo on file for {candidate['name']}"
    badge = '<span class="el-badge">Acclaimed</span>' if candidate.get("acclaimed") else ""
    return f"""<a class="el-person" href="{esc(candidate_url(candidate))}">
      <img class="el-avatar" src="{esc(photo)}" alt="{esc(alt)}" width="600" height="600" loading="lazy">
      <span class="el-person-copy">
        <strong>{esc(candidate['name'])}</strong>
        <span class="el-role">{esc(candidate['office'])}</span>
        {badge}
      </span>
    </a>"""


def muni_path(slug: str) -> str:
    return f"/elections-2026/{slug}/"


def vote_window(muni: dict) -> str:
    for row in muni["rows"]:
        label = row["label"].lower()
        if "online" in label or "phone" in label:
            return row["value"].rstrip(".")
    return ""


def how_sentences(muni: dict) -> str:
    if muni.get("ballot_question"):
        question = muni["ballot_question"]
        return (
            "You can vote online, or by paper ballot in person. "
            f"The ballot also asks if you are in favour of moving to a ward system, "
            f"and the answers are {question['detail'].rstrip('.').removeprefix('Answers are ')}."
        )
    method = muni["method"].rstrip(".")
    note = (muni.get("method_note") or "").strip()
    if note:
        return f"{method}. {note if note.endswith('.') else note + '.'}"
    return method + "."


def list_sentence(muni: dict) -> str:
    slug = muni["slug"]
    if slug == "tiny":
        return "Online registration closes Monday, October 12."
    if slug == "penetanguishene":
        return "Use the Town's Voter Services Portal to confirm or update your information."
    if slug == "midland":
        return "Use the Town's voter page to confirm or update your information."
    if slug == "tay":
        return "The Township election page explains how to confirm or update your voters' list information."
    return "The Town's election page explains how to confirm you are on the list or correct your information."


def need_sentence(muni: dict) -> str:
    method = muni["method"].lower()
    note = (muni.get("method_note") or "").lower()
    uses_paper = "paper" in method or ("paper" in note and "no paper" not in note)
    if uses_paper and ("internet" in method or "telephone" in method):
        return "You need to be on the voters' list. You can vote by internet or telephone, or by paper ballot on Election Day."
    if uses_paper:
        return "You need to be on the voters' list. You can vote online, or by paper ballot at an advance poll or on Election Day."
    return "You need to be on the voters' list. Voting is by internet and telephone, with no paper ballot."


def faq_items(muni: dict) -> list[tuple[str, str, str]]:
    """Question, visible HTML answer, plain-text answer for JSON-LD."""
    day = "Election Day is Monday, October 26, 2026. Voting closes at 8 p.m."
    how = how_sentences(muni)
    how_html = esc(how)
    if muni.get("ballot_question"):
        question = muni["ballot_question"]
        how_html = (
            f'{esc(how)} {ext_link(question["url"], question["source_label"])}.'
        )
    window = vote_window(muni)
    when = f"Voting runs from {window}." if window else day
    listed = list_sentence(muni)
    listed_html = (
        f'{esc(listed)} '
        f'<a href="{esc(muni["register_url"])}" target="_blank" rel="noopener noreferrer">Check you are registered</a>.'
    )
    need = need_sentence(muni)
    help_text = f"{muni['name']}'s election page has voter help and who to contact."
    help_html = (
        f'{esc(help_text)} '
        f'<a href="{esc(muni["election_url"])}" target="_blank" rel="noopener noreferrer">Official election page</a>.'
    )
    return [
        ("When is Election Day?", f"<p>{esc(day)}</p>", day),
        (f"How do I vote in {muni['short']}?", f"<p>{how_html}</p>", how),
        ("When can I vote online or by phone?", f"<p>{esc(when)}</p>", when),
        ("How do I check I'm on the voters' list?", f"<p>{listed_html}</p>", f"{listed} {muni['register_url']}"),
        ("What do I need to vote?", f"<p>{esc(need)}</p>", need),
        ("Where do I get help?", f"<p>{help_html}</p>", f"{help_text} {muni['election_url']}"),
    ]


def faq_html(muni: dict) -> tuple[str, str]:
    items = faq_items(muni)
    blocks = []
    entities = []
    for question, answer_html, answer_text in items:
        blocks.append(f"<h3>{esc(question)}</h3>{answer_html}")
        entities.append({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {"@type": "Answer", "text": answer_text},
        })
    html_block = f'<section class="el-faq" id="faq"><h2>Questions</h2>{"".join(blocks)}</section>'
    payload = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities,
    }, ensure_ascii=False)
    script = f'<script type="application/ld+json">{payload}</script>'
    return html_block, script


def first_sentence(text: str) -> str:
    text = " ".join((text or "").split())
    if not text:
        return ""
    match = re.match(r"^(.+?[.!?])(?:\s|$)", text)
    sentence = match.group(1) if match else text
    if sentence[-1] not in ".!?":
        sentence += "."
    return sentence


def summary_hook(muni: dict) -> str:
    if muni.get("prominent"):
        return first_sentence(muni["prominent"])
    question = muni.get("ballot_question")
    if question:
        ask = (question.get("text") or "").strip()
        if ask and not ask.endswith("?"):
            ask += "?"
        return f"The ballot also asks: {ask}"
    for note in muni.get("notes") or []:
        if "acclaimed" in (note or "").lower():
            return first_sentence(note)
    return ""


def summary_text(muni: dict) -> str:
    """Two short sentences from the municipality record, aimed at 2 or 3 lines on a phone."""
    parts = []
    blurb = muni.get("offices_blurb") or ""
    count = re.search(r"Councillor \((\d+)\)", blurb)
    if count and "at large" in blurb.lower():
        n = int(count.group(1))
        seats = "1 council seat" if n == 1 else f"{n} council seats"
        parts.append(f"Mayor, deputy mayor and {seats}, elected at large.")
    else:
        sentence = first_sentence(blurb)
        if sentence:
            parts.append(sentence)
    hook = summary_hook(muni)
    if hook:
        parts.append(hook)
    else:
        method = (muni.get("method") or "").strip().rstrip(".")
        if method:
            parts.append(method + ".")
    return " ".join(parts)


def ward_label(person: dict) -> str | None:
    ward = (person.get("ward") or "").strip()
    if not ward or ward.lower() == "at large":
        return None
    return ward


def anchor_for(office: str, ward: str | None) -> str:
    base = {"Mayor": "mayor", "Deputy Mayor": "deputy-mayor", "Councillor": "council"}[office]
    if not ward:
        return base
    slug = re.sub(r"[^a-z0-9]+", "-", ward.lower()).strip("-")
    return f"{base}-{slug}"


def jump_label(office: str, ward: str | None) -> str:
    label = OFFICE_HEADING[office]
    if ward:
        return f"{label}, {ward}"
    return label


def grouped_wards(people: list[dict]) -> list[tuple[str | None, list[dict]]]:
    labels: list[str | None] = []
    buckets: dict[str | None, list[dict]] = {}
    for person in people:
        label = ward_label(person)
        if label not in buckets:
            labels.append(label)
            buckets[label] = []
        buckets[label].append(person)
    if not any(labels):
        return [(None, people)]
    return [(label, buckets[label]) for label in labels]


def name_list(people: list[dict], badge_each: bool) -> str:
    items = []
    for person in people:
        extra = ' <span class="el-badge">Acclaimed</span>' if badge_each and person.get("acclaimed") else ""
        items.append(
            f'<li><a href="{esc(candidate_url(person))}">{esc(person["name"])}</a>{extra}</li>'
        )
    return f'<ul class="el-names">{"".join(items)}</ul>'


def photo_details(people: list[dict]) -> str:
    cards = "".join(person_card(person) for person in people)
    return (
        '<details class="el-photos">'
        '<summary><span class="el-photos-show">Show photos</span>'
        '<span class="el-photos-hide">Hide photos</span></summary>'
        f'<div class="el-people">{cards}</div></details>'
    )


def office_markup(office: str, members: list[dict], ward: str | None, heading: str) -> str:
    all_acc = all(person.get("acclaimed") for person in members)
    badge = ' <span class="el-badge">Acclaimed</span>' if all_acc else ""
    n_seats = int(members[0]["seats_for_office"])
    title = ward if ward else OFFICE_HEADING[office]
    return (
        f'<div class="el-office-head"><{heading}>{esc(title)}</{heading}>'
        f'<p>{esc(seat_word(n_seats))}{badge}</p></div>'
        f'{name_list(members, badge_each=not all_acc)}'
        f'{photo_details(members)}'
    )


def office_blocks(office: str, people: list[dict]) -> tuple[str, list[tuple[str, str]]]:
    groups = grouped_wards(people)
    if len(groups) == 1 and groups[0][0] is None:
        aid = anchor_for(office, None)
        html_block = (
            f'<section class="el-office" id="{aid}">'
            f'{office_markup(office, groups[0][1], None, "h2")}'
            f'</section>'
        )
        return html_block, [(jump_label(office, None), aid)]
    parent = anchor_for(office, None)
    parts = [f'<section class="el-office" id="{parent}">']
    parts.append(f'<div class="el-office-head"><h2>{esc(OFFICE_HEADING[office])}</h2></div>')
    links = [(OFFICE_HEADING[office], parent)]
    for ward, members in groups:
        label = ward or "At large"
        aid = anchor_for(office, label)
        links.append((jump_label(office, label), aid))
        parts.append(
            f'<section class="el-ward" id="{aid}">'
            f'{office_markup(office, members, label, "h3")}'
            f'</section>'
        )
    parts.append("</section>")
    return "".join(parts), links


def jump_nav(links: list[tuple[str, str]]) -> str:
    items = "".join(f'<a href="#{esc(aid)}">{esc(label)}</a>' for label, aid in links)
    return (
        f'<nav class="el-jump" aria-label="On this page">'
        f'<div class="el-jump-row">{items}</div></nav>'
    )


def join_cta() -> str:
    return (
        '<aside class="el-join">'
        "<p>Jonathan Wallace sends one Friday email with new listings, a local note, "
        "and the week's events across Midland, Penetanguishene, Tiny, Tay and Wasaga Beach.</p>"
        '<a class="btn btn--primary" href="/join" data-ga4="election_newsletter">Join the Friday email</a>'
        "</aside>"
    )


def dates_for_town(muni: dict, guide: dict) -> list[dict]:
    short = muni["short"]
    pattern = re.compile(rf"\b{re.escape(short)}\b")
    found = []
    for item in guide["key_dates"]:
        text = item["text"]
        if text.startswith("Election Day") or pattern.search(text):
            found.append(item)
    return found


def key_dates_html(items: list[dict]) -> str:
    rows = []
    for item in items:
        hot = " is-hot" if item.get("highlight") else ""
        rows.append(
            f'<div class="el-keydate{hot}"><b>{esc(item["date"])}</b><span>{esc(item["text"])}</span></div>'
        )
    return f'<section class="el-keydates" id="key-dates"><h2>Key dates</h2>{"".join(rows)}</section>'


def how_where_html(muni: dict) -> str:
    lead = esc(how_sentences(muni))
    question = muni.get("ballot_question")
    if question:
        lead += " " + ext_link(question["url"], question["source_label"]) + "."
    if muni.get("prominent"):
        lead += " " + esc(first_sentence(muni["prominent"]))
    rows = []
    for row in muni["rows"]:
        rows.append(
            f'<div class="el-kv"><b>{esc(row["label"])}</b><span>{esc(row["value"])}</span></div>'
        )
    links = (
        '<p class="el-vote-links">'
        f'<a href="{esc(muni["register_url"])}" target="_blank" rel="noopener noreferrer">Check you are registered</a>'
        f'<a href="{esc(muni["election_url"])}" target="_blank" rel="noopener noreferrer">Official election page</a>'
        "</p>"
    )
    return (
        f'<section class="el-vote" id="how-to-vote"><h2>How and where to vote</h2>'
        f"<p>{lead}</p>{''.join(rows)}{links}</section>"
    )


def hub_page(guide: dict, candidates: list[dict]) -> str:
    dates = []
    for item in guide["key_dates"]:
        hot = " is-hot" if item.get("highlight") else ""
        dates.append(
            f'<div class="el-date{hot}"><b>{esc(item["date"])}</b><span>{esc(item["text"])}</span></div>'
        )
    towns = []
    for muni in guide["municipalities"]:
        towns.append(
            f'<a class="el-town" href="{esc(muni_path(muni["slug"]))}">'
            f'<span class="el-town-kind">{esc(muni["kind"])}</span>'
            f'<span class="el-town-name">{esc(muni["short"])}</span>'
            f'</a>'
        )
    figure = (
        f'<figure class="el-figure"><img src="{HERO}" '
        f'alt="Lawn signs on grass reading North Simcoe, Election Day, October 26, with a lake and town behind them." '
        f'width="1920" height="1072">'
        f'<figcaption>North Simcoe. Election Day, October 26.</figcaption></figure>'
    )
    body = f"""<main class="el">
  <div class="el-wrap el-intro">
    {byline_html()}
    <h1>North Simcoe Votes 2026</h1>
    <p class="el-eday">Election Day<br>Monday, October 26, 2026</p>
    <p class="el-lede">A non-partisan guide to the 2026 council elections in Midland, Penetanguishene, Tiny, Tay and Wasaga Beach.</p>
  </div>
  <div class="el-wrap">
    <nav class="el-towns" aria-label="Municipalities">{''.join(towns)}</nav>
    {join_cta()}
  </div>
  <div class="el-dates" id="key-dates"><div class="el-wrap el-dates-grid"><div class="el-dates-label">Key dates</div>{''.join(dates)}</div></div>
  {figure}
  <div class="el-wrap">{disclaimer_html()}</div>
</main>"""
    title = "North Simcoe Votes 2026 | Jonathan Wallace"
    description = (
        "A non-partisan guide to the 2026 council elections in Midland, "
        "Penetanguishene, Tiny, Tay and Wasaga Beach. Election Day is Monday, October 26, 2026."
    )
    return shell(title, description, HUB_PATH, HERO, body)


def town_page(muni: dict, group: list[dict], guide: dict) -> str:
    offices: dict[str, list[dict]] = {}
    for candidate in group:
        offices.setdefault(candidate["office"], []).append(candidate)
    blocks = []
    links: list[tuple[str, str]] = []
    for office in OFFICE_ORDER:
        people = offices.get(office) or []
        if not people:
            continue
        html_block, office_links = office_blocks(office, people)
        blocks.append(html_block)
        links.extend(office_links)
    links.append(("How and where to vote", "how-to-vote"))
    links.append(("Key dates", "key-dates"))
    faq, json_ld = faq_html(muni)
    body = f"""<main class="el el-townpage">
  <div class="el-wrap">
    <p class="el-crumbs"><a href="{HUB_PATH}">North Simcoe Votes 2026</a></p>
    <h1>{esc(muni['name'])}</h1>
    <p class="el-summary">{esc(summary_text(muni))}</p>
  </div>
  {jump_nav(links)}
  <div class="el-wrap">
    {''.join(blocks)}
    {join_cta()}
    {how_where_html(muni)}
    {key_dates_html(dates_for_town(muni, guide))}
    {faq}
    {disclaimer_html()}
    <p><a class="el-back" href="{HUB_PATH}">Back to North Simcoe Votes 2026</a></p>
  </div>
</main>"""
    title = f"{muni['name']} candidates | North Simcoe Votes 2026"
    description = f"Candidates for {muni['name']} in the 2026 municipal election. Election Day is Monday, October 26, 2026."
    return shell(title, description, muni_path(muni["slug"]), HERO, body, json_ld)


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
        add(link_label(website), website)
    phone = candidate.get("phone")
    email = candidate.get("email")
    if phone:
        items.append(f"<li><small>Phone</small><div>{phone_html(phone)}</div></li>")
    if email:
        items.append(
            f'<li><small>Email</small><div><a href="mailto:{esc(email)}">{esc(email)}</a></div></li>'
        )
    for key, label in (
        ("facebook", "Facebook page"),
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

    notes = []
    if candidate.get("contact_note"):
        notes.append(f'<p class="el-note">{esc(candidate["contact_note"])}</p>')
    if candidate.get("link_note"):
        notes.append(f'<p class="el-note">{esc(candidate["link_note"])}</p>')
    if not items and not notes:
        return ""
    button = ""
    primary = website or candidate.get("primary_link")
    if primary and not website:
        label = link_label(primary)
        # A Team Wasaga profile already listed with that label is not repeated.
        if not (label == "Team Wasaga profile" and primary in seen):
            button = (
                f'<p><a class="el-textlink" href="{esc(primary)}" target="_blank" rel="noopener noreferrer">{esc(label)}</a></p>'
            )
    listing = f'<ul class="el-clist">{"".join(items)}</ul>' if items else ""
    return f"""<section class="el-block"><h2>Contact</h2>
      {button}
      {listing}
      {''.join(notes)}
    </section>"""


def candidate_page(candidate: dict, muni: dict) -> str:
    photo, placeholder = photo_web_path(candidate)
    alt = candidate["name"] if not placeholder else f"No photo on file for {candidate['name']}"
    badge = '<span class="el-badge">Acclaimed</span>' if candidate.get("acclaimed") else ""
    if candidate.get("no_platform_found"):
        story = f'<p class="el-nop">{esc(NO_PLATFORM)}</p>'
    else:
        points = (candidate.get("top_points") or [])[:5]
        if points:
            items = "".join(f"<li>{esc(point)}</li>" for point in points)
            story = f'<section class="el-block"><h2>Priorities</h2><ol class="el-points">{items}</ol></section>'
        else:
            story = ""
    contact = contact_block(candidate)
    further = candidate.get("further_reading")
    further_html = ""
    further_url = ""
    if isinstance(further, dict) and further.get("url"):
        further_url = further["url"]
        further_html = (
            f'<p class="el-more">{ext_link(further_url, reading_label(further))}</p>'
        )
    sources = []
    seen = set()
    for source in candidate.get("sources") or []:
        if not source or source in seen or source == further_url:
            continue
        seen.add(source)
        if source.startswith(("http://", "https://")) and "midlandtoday.ca/" in source:
            sources.append(f"<li>{ext_link(source, candidate.get('platform_source') or 'MidlandToday candidate profile')}</li>")
        elif source.startswith(("http://", "https://")):
            sources.append(f"<li>{ext_link(source)}</li>")
        else:
            sources.append(f"<li>{esc(source)}</li>")
    sources_html = ""
    if sources:
        sources_html = (
            f'<section class="el-block"><h2>Sources</h2><ul class="el-sources">{"".join(sources)}</ul></section>'
        )
    body = f"""<main class="el">
  <div class="el-wrap el-profile">
    <p class="el-crumbs"><a href="{HUB_PATH}">North Simcoe Votes 2026</a> <span>/</span> <a href="{esc(muni_path(muni['slug']))}">{esc(muni['short'])}</a></p>
    <img class="el-avatar el-avatar-lg" src="{esc(photo)}" alt="{esc(alt)}" width="600" height="600">
    <h1>{esc(candidate['name'])}</h1>
    <p class="el-role">{esc(candidate['office'])} {badge}</p>
    {story if not candidate.get("no_platform_found") else ""}
    {contact}
    {story if candidate.get("no_platform_found") else ""}
    {further_html}
    {sources_html}
    {disclaimer_html()}
    <p><a class="el-back" href="{esc(muni_path(muni['slug']))}">Back to {esc(muni['short'])}</a></p>
  </div>
</main>"""
    title = f"{candidate['name']}, {candidate['office']}, {muni['short']} | North Simcoe Votes 2026"
    if candidate.get("no_platform_found"):
        description = NO_PLATFORM
    else:
        description = (candidate.get("top_points") or [title])[0]
    return shell(title, description, candidate_url(candidate), photo, body)


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
        print("Missing social image", HERO, file=sys.stderr)
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
    if f'<link rel="canonical" href="{SITE}{HUB_PATH}">' not in hub_html:
        problems.append("Hub canonical URL is wrong")
    if "el-date is-hot" not in hub_html:
        problems.append("Hub is missing the Oct 12 highlight")
    if hub_html.count('class="el-town"') != 5:
        problems.append("Hub should have five town links")
    if "el-vcard" in hub_html or "el-person" in hub_html:
        problems.append("Hub still lists candidates or vote cards")
    towns_at = hub_html.find('class="el-towns"')
    dates_at = hub_html.find('class="el-dates"')
    if towns_at < 0 or dates_at < 0 or towns_at > dates_at:
        problems.append("Hub town links should come before key dates")
    if 'href="/join"' not in hub_html or "Jonathan Wallace" not in hub_html:
        problems.append("Hub is missing the Friday email link")

    grouped: dict[str, list[dict]] = {}
    for candidate in candidates:
        grouped.setdefault(candidate["municipality_slug"], []).append(candidate)

    for muni in guide["municipalities"]:
        page = town_page(muni, grouped.get(muni["slug"], []), guide)
        path = ROOT / "elections-2026" / muni["slug"] / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
        written.append(path)
        problems.extend(scrub_check(page, str(path.relative_to(ROOT))))
        if f'<link rel="canonical" href="{SITE}{muni_path(muni["slug"])}">' not in page:
            problems.append(f"{muni['slug']} canonical URL is wrong")
        if "FAQPage" not in page or 'id="faq"' not in page:
            problems.append(f"{muni['slug']} is missing the FAQ")
        if muni["slug"] == "tiny" and "Online registration closes Monday, October 12." not in page:
            problems.append("Tiny page is missing the October 12 deadline")
        if muni["slug"] == "wasaga-beach" and "ward system" not in page:
            problems.append("Wasaga Beach page is missing the ward question")
        if muni["slug"] == "wasaga-beach" and "https://www.registertovoteon.ca/" not in page:
            problems.append("Wasaga Beach registration link should be registertovoteon.ca")
        if "el-mini" in page:
            problems.append(f"{muni['slug']} still has the old vote card")
        for href in ("#mayor", "#deputy-mayor", "#council", "#how-to-vote", "#key-dates"):
            if f'href="{href}"' not in page:
                problems.append(f"{muni['slug']} jump nav is missing {href}")
        if 'class="el-summary"' not in page or not summary_text(muni):
            problems.append(f"{muni['slug']} is missing the summary")
        if 'href="/join"' not in page or "Jonathan Wallace" not in page:
            problems.append(f"{muni['slug']} is missing the Friday email link")
        if page.find('id="council"') > page.find('class="el-join"'):
            problems.append(f"{muni['slug']} puts council below the newsletter CTA")
        if page.find('class="el-join"') > page.find('id="how-to-vote"'):
            problems.append(f"{muni['slug']} puts the newsletter CTA below how to vote")
        if '<details class="el-photos" open' in page:
            problems.append(f"{muni['slug']} photo lists should start collapsed")
        if "How and where to vote" not in page or "Key dates" not in page:
            problems.append(f"{muni['slug']} is missing a section heading")

    for candidate in candidates:
        muni = muni_by_slug[candidate["municipality_slug"]]
        page = candidate_page(candidate, muni)
        path = ROOT / candidate_url(candidate).strip("/") / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
        written.append(path)
        label = str(path.relative_to(ROOT))
        problems.extend(scrub_check(page, label))
        if f'<link rel="canonical" href="{SITE}{candidate_url(candidate)}">' not in page:
            problems.append(f"{candidate['slug']} canonical URL is wrong")
        if "Further reading (not a source" in page or "Not used as a source" in page:
            problems.append(f"{candidate['slug']} still has the further-reading box")
        if "el-mini" in page or "How to vote in" in page:
            problems.append(f"{candidate['slug']} still has a how-to-vote block")
        further = candidate.get("further_reading")
        if isinstance(further, dict) and further.get("url"):
            if further["url"] not in page:
                problems.append(f"{candidate['slug']} is missing the further-reading link")
            if f"<h2>Sources</h2>" in page and further["url"] in page.split("<h2>Sources</h2>", 1)[-1]:
                if further["url"] not in page.split("<h2>Sources</h2>", 1)[0]:
                    problems.append(f"{candidate['slug']} puts further reading only in sources")
        elif "el-more" in page:
            problems.append(f"{candidate['slug']} has a further-reading line without data")
        if candidate.get("no_platform_found"):
            if NO_PLATFORM not in page:
                problems.append(f"{candidate['slug']} is missing the no-platform sentence")
            if "<h2>Priorities</h2>" in page:
                problems.append(f"{candidate['slug']} shows priorities without a platform")
        elif candidate.get("top_points") and "<h2>Priorities</h2>" not in page:
            problems.append(f"{candidate['slug']} is missing priorities")
        if not (candidate.get("sources") or []) and "<h2>Sources</h2>" in page:
            problems.append(f"{candidate['slug']} has an empty sources section")
        has_contact = any(candidate.get(key) for key in ("phone", "email", "website", "facebook", "instagram", "x", "linkedin", "tiktok", "primary_link")) or candidate.get("other_links") or candidate.get("contact_note") or candidate.get("link_note")
        if not has_contact and "<h2>Contact</h2>" in page:
            problems.append(f"{candidate['slug']} has an empty contact section")
        if "silhouette.png" in page and candidate.get("photo_file"):
            problems.append(f"{candidate['slug']} still uses the silhouette")
        if "Open link" in page:
            problems.append(f"{candidate['slug']} still says Open link")
        if "https://chuckstradling.ca" in page:
            problems.append(f"{candidate['slug']} still uses https://chuckstradling.ca")
        if 'href="https://richardwhite.ca' in page:
            problems.append(f"{candidate['slug']} still links to richardwhite.ca without www")
        slug = candidate["slug"]
        primary = candidate.get("primary_link") or ""
        if primary and not candidate.get("website") and "facebook.com" in primary and "Facebook page" not in page:
            problems.append(f"{slug} is missing the Facebook page label")
        if slug == "tiny/david-evans":
            card = "Candidate campaign material: David Evans for Mayor card"
            if "No platform was found" in page:
                problems.append("David Evans still says no platform was found")
            if card not in page:
                problems.append("David Evans is missing the campaign card source")
            if f'href="{card}"' in page or f">{card}</a>" in page:
                problems.append("David Evans campaign card source is rendered as a link")
        if slug == "tiny/chuck-stradling":
            if "http://chuckstradling.ca/" not in page or "http://chuckstradling.ca/priorities/" not in page:
                problems.append("Chuck Stradling is missing the http site links")
        if slug == "midland/jamie-lee-ball" and "https://www.instagram.com/jamielee.ball/" not in page:
            problems.append("Jamie-Lee Ball is missing her Instagram link")
        if slug in {"wasaga-beach/brian-smith", "wasaga-beach/joe-belanger"}:
            if "Team Wasaga profile" not in page:
                problems.append(f"{slug} is missing the Team Wasaga profile label")
            if "<small>Website</small>" in page:
                problems.append(f"{slug} still labels the Team Wasaga profile as Website")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
    blog = (ROOT / "blog.html").read_text(encoding="utf-8")
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    headers = (ROOT / "_headers").read_text(encoding="utf-8")
    netlify = (ROOT / "netlify.toml").read_text(encoding="utf-8")
    hub_url = "https://jonathanwallace.ca/blog/north-simcoe-votes-2026/"
    if hub_url not in sitemap:
        problems.append("sitemap.xml is missing the election hub")
    if hub_url not in llms:
        problems.append("llms.txt is missing the election hub")
    if "/blog/north-simcoe-votes-2026/" not in blog or "blog-north-simcoe-votes-2026.jpg" not in blog:
        problems.append("blog.html is missing the election hub card")
    if "north-simcoe-votes-2026" in home or "/elections-2026/" in home:
        problems.append("index.html links to the election pages from the home page")
    if "elections-2026" in robots or "north-simcoe-votes-2026" in robots:
        problems.append("robots.txt blocks the election pages")
    for candidate in candidates:
        url = "https://jonathanwallace.ca" + candidate_url(candidate)
        if url not in sitemap:
            problems.append(f"sitemap.xml is missing {candidate['slug']}")
    for muni in guide["municipalities"]:
        url = "https://jonathanwallace.ca" + muni_path(muni["slug"])
        if url not in sitemap:
            problems.append(f"sitemap.xml is missing {muni['slug']}")
        if "listings/" not in sitemap:
            problems.append("sitemap.xml lost the listing pages")
            break
    if "north-simcoe-votes-2026" in headers or "/elections-2026/" in headers:
        problems.append("_headers still noindexes the election pages")
    if "north-simcoe-votes-2026" in netlify or 'for = "/elections-2026/' in netlify:
        problems.append("netlify.toml still noindexes the election pages")

    print(f"Wrote {len(written)} pages ({len(candidates)} candidates + {len(guide['municipalities'])} towns + hub)")
    if problems:
        print("Problems:", file=sys.stderr)
        for problem in problems:
            print(" -", problem, file=sys.stderr)
        return 1
    print("Checks passed: index,follow, canonicals, sitemap, blog card, no dashes, no Sales Representative")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
