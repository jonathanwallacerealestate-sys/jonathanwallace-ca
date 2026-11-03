#!/usr/bin/env python3
"""Build the Straight Answers video library (/ask/) from content/ask-videos.json.

Writes:
  ask/index.html            the library hub, filterable by topic
  ask/<slug>.html           one page per video: video, short answer, transcript, schema
  index.html                the homepage strip between the ASK-STRIP markers

Media lives at assets/video/ask/<slug>.mp4 (H.264, 720x1280, faststart) and
assets/img/ask/<slug>.jpg (poster frame).

While "live" is false in the JSON, every /ask page is noindex, nothing is added to
sitemap.xml or llms.txt, and a preview bar shows at the top of each page.

Run: python3 scripts/build_ask.py
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://jonathanwallace.ca"
EVAL = "https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma"

data = json.load(open(os.path.join(ROOT, "content/ask-videos.json"), encoding="utf-8"))
LIVE = data["live"]
VIDEOS = data["videos"]
CATS = ["Selling", "Buying", "Market"]


def esc(s):
    return html.escape(s, quote=True)


def read(path):
    return open(os.path.join(ROOT, path), encoding="utf-8").read()


def absolutize(chunk):
    # Shared header/footer use relative links; /ask/ pages sit one folder down.
    return re.sub(r'href="(?!https?:|mailto:|tel:|/|#)([^"]+)"', r'href="/\1"', chunk)


faq = read("faq.html")
GTM_HEAD = re.search(r"<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->", faq, re.S).group(0)
GTM_BODY = re.search(r"<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->", faq, re.S).group(0)
HEADER = absolutize(re.search(r'<header class="site-header">.*?</header>', faq, re.S).group(0))
FOOTER = absolutize(re.search(r'<footer class="footer">.*?</footer>', faq, re.S).group(0))


def iso_duration(sec):
    return f"PT{sec // 60}M{sec % 60}S"


def mmss(sec):
    return f"{sec // 60}:{sec % 60:02d}"


def video_obj(v):
    return {
        "@type": "VideoObject",
        "@id": f"{SITE}/ask/{v['slug']}#video",
        "name": v["question"],
        "description": v["short"],
        "thumbnailUrl": f"{SITE}/assets/img/ask/{v['slug']}.jpg",
        "contentUrl": f"{SITE}/assets/video/ask/{v['slug']}.mp4",
        "uploadDate": v["date"] + "T09:00:00-05:00",
        "duration": iso_duration(v["duration"]),
        "inLanguage": "en-CA",
        "transcript": v["transcript"].replace("\n\n", " "),
        "author": {"@id": f"{SITE}/#jonathan"},
        "publisher": {"@id": f"{SITE}/#agent"},
    }


def head(title, desc, canonical, image, schema):
    robots = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" if LIVE else "noindex, follow"
    return f"""<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
{GTM_HEAD}
<meta name="robots" content="{robots}">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="/assets/css/ask.css">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="video.other">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{image}">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="Jonathan Wallace, Your Georgian Bay Specialist">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{json.dumps(schema, indent=2, ensure_ascii=False)}
</script>
</head>
<body class="ask-page">
{GTM_BODY}
"""


PREVIEW_BAR = "" if LIVE else (
    '<div class="ask-preview">Preview only. The Straight Answers library is hidden from search '
    "and the menu until it launches.</div>\n"
)


def card(v, heading="h3"):
    return f"""<a class="ask-card" href="/ask/{v['slug']}" data-cat="{v['category']}" data-ga4="ask_card_{v['slug']}">
  <span class="ask-card__frame"><img src="/assets/img/ask/{v['slug']}.jpg" alt="Jonathan Wallace answering: {esc(v['question'])}" loading="lazy" width="720" height="1280"><span class="ask-card__play" aria-hidden="true"></span><span class="ask-card__time">{mmss(v['duration'])}</span></span>
  <span class="ask-card__cat">{v['category']}</span>
  <{heading} class="ask-card__q">{esc(v['card'])}</{heading}>
</a>"""


def cta(v):
    if v["category"] == "Buying":
        primary = '<a class="btn btn--primary btn--lg" href="/find-your-home.html" data-ga4="cta_private_search">Start a private home search</a>'
    else:
        primary = f'<a class="btn btn--primary btn--lg" href="{EVAL}" data-ga4="book_home_evaluation" target="_blank" rel="noopener">Book a home evaluation</a>'
    return f"""<div class="ask-cta">
      <p class="ask-cta__lead">Have a question about your own situation?</p>
      <div class="ask-cta__row">{primary}<a class="btn btn--ghost btn--lg" href="sms:+17054332525" data-ga4="cta_text">Text 705-433-2525</a></div>
    </div>"""


def build_question(v, others):
    url = f"{SITE}/ask/{v['slug']}"
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            video_obj(v),
            {
                "@type": "FAQPage",
                "@id": url + "#faq",
                "mainEntity": [{
                    "@type": "Question",
                    "name": v["question"],
                    "acceptedAnswer": {"@type": "Answer", "text": v["short"], "author": {"@id": f"{SITE}/#jonathan"}},
                }],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Straight Answers", "item": SITE + "/ask/"},
                    {"@type": "ListItem", "position": 3, "name": v["question"], "item": url},
                ],
            },
        ],
    }
    paras = "\n".join(f"      <p>{esc(p)}</p>" for p in v["transcript"].split("\n\n"))
    related = [o for o in others if o["category"] == v["category"]][:3]
    related += [o for o in others if o not in related][: 3 - len(related)]
    rel_cards = "\n".join(card(o) for o in related)
    page = head(
        f"{v['question']} | Jonathan Wallace",
        v["short"][:155].rsplit(" ", 1)[0] + "...",
        url,
        f"{SITE}/assets/img/ask/{v['slug']}.jpg",
        schema,
    )
    page += PREVIEW_BAR + HEADER + f"""

<main class="ask-q">
  <div class="wrap">
    <nav class="ask-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/ask/">Straight Answers</a><span>/</span>{v['category']}</nav>
    <div class="ask-q__grid">
      <div class="ask-q__video">
        <video controls playsinline preload="none" poster="/assets/img/ask/{v['slug']}.jpg" width="720" height="1280">
          <source src="/assets/video/ask/{v['slug']}.mp4" type="video/mp4">
        </video>
      </div>
      <div class="ask-q__body">
        <p class="eyebrow">Straight Answers · {v['category']}</p>
        <h1>{esc(v['question'])}</h1>
        <p class="ask-byline">Jonathan Wallace, REALTOR® · {mmss(v['duration'])} video</p>
        <div class="ask-short">
          <p class="ask-short__label">The short answer</p>
          <p>{esc(v['short'])}</p>
        </div>
        {cta(v)}
        <p class="ask-related-read">Read more: <a href="{v['related']['href']}">{esc(v['related']['label'])}</a></p>
      </div>
    </div>

    <section class="ask-transcript">
      <h2>What Jonathan Wallace said</h2>
{paras}
    </section>
  </div>
</main>

<section class="section section--sand">
  <div class="wrap">
    <div class="ask-more__head"><h2>More straight answers</h2><a class="ask-all" href="/ask/">See every question</a></div>
    <div class="ask-grid ask-grid--three">
{rel_cards}
    </div>
  </div>
</section>

{FOOTER}
<script src="/assets/js/main.js"></script>
</body>
</html>
"""
    with open(os.path.join(ROOT, "ask", v["slug"] + ".html"), "w", encoding="utf-8") as fh:
        fh.write(page)


def build_hub():
    url = SITE + "/ask/"
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": url,
                "name": "Straight Answers: Georgian Bay real estate questions, answered on camera",
                "url": url,
                "author": {"@id": f"{SITE}/#jonathan"},
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/ask/{v['slug']}", "name": v["question"]}
                        for i, v in enumerate(VIDEOS)
                    ],
                },
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Straight Answers", "item": url},
                ],
            },
        ],
    }
    chips = '<button class="ask-chip is-on" data-filter="all">All</button>' + "".join(
        f'<button class="ask-chip" data-filter="{c}">{c}</button>' for c in CATS if any(v["category"] == c for v in VIDEOS)
    )
    cards = "\n".join(card(v, "h2") for v in VIDEOS)
    page = head(
        "Straight Answers: Georgian Bay Real Estate Questions | Jonathan Wallace",
        "Short, unscripted videos where Jonathan Wallace answers the questions buyers and sellers in Midland, Penetanguishene, Tiny, Tay and Wasaga Beach are asking right now.",
        url,
        f"{SITE}/assets/img/ask/{VIDEOS[0]['slug']}.jpg",
        schema,
    )
    page += PREVIEW_BAR + HEADER + f"""

<section class="ask-hero">
  <div class="wrap">
    <p class="eyebrow">Straight Answers</p>
    <h1>The questions people are asking me right now.</h1>
    <p>Short videos, no script, my honest read. Each one answers a real question from a buyer or seller on Georgian Bay. If yours is not here, <a href="/contact.html">ask me directly</a>.</p>
  </div>
</section>

<main class="section ask-hub">
  <div class="wrap">
    <div class="ask-chips" role="group" aria-label="Filter by topic">{chips}</div>
    <div class="ask-grid" id="askGrid">
{cards}
    </div>
  </div>
</main>

{FOOTER}
<script src="/assets/js/main.js"></script>
<script>
(function(){{var chips=document.querySelectorAll('.ask-chip'),cards=document.querySelectorAll('#askGrid .ask-card');
chips.forEach(function(c){{c.addEventListener('click',function(){{var f=c.getAttribute('data-filter');
chips.forEach(function(x){{x.classList.toggle('is-on',x===c);}});
cards.forEach(function(k){{k.hidden=!(f==='all'||k.getAttribute('data-cat')===f);}});}});}});}})();
</script>
</body>
</html>
"""
    with open(os.path.join(ROOT, "ask", "index.html"), "w", encoding="utf-8") as fh:
        fh.write(page)


def build_strip():
    cards = "\n".join(card(v) for v in VIDEOS[:6])
    strip = f"""<!-- ASK-STRIP:START (generated by scripts/build_ask.py) -->
<section class="section ask-strip">
  <div class="wrap">
    <div class="ask-more__head">
      <div><p class="eyebrow">Straight Answers</p><h2 class="mb-0">The questions people are asking me right now</h2></div>
      <a class="ask-all" href="/ask/" data-ga4="ask_see_all">See every question</a>
    </div>
    <div class="ask-row">
{cards}
    </div>
  </div>
</section>
<!-- ASK-STRIP:END -->"""
    idx = read("index.html")
    if "<!-- ASK-STRIP:START" in idx:
        idx = re.sub(r"<!-- ASK-STRIP:START.*?<!-- ASK-STRIP:END -->", strip, idx, flags=re.S)
    else:
        idx = idx.replace("<!-- HOME TOURS, YOUTUBE LEAD-GEN PILLAR -->", strip + "\n\n<!-- HOME TOURS, YOUTUBE LEAD-GEN PILLAR -->", 1)
    if "/assets/css/ask.css" not in idx:
        idx = idx.replace("</head>", '<link rel="stylesheet" href="/assets/css/ask.css">\n</head>', 1)
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(idx)


os.makedirs(os.path.join(ROOT, "ask"), exist_ok=True)
for v in VIDEOS:
    for p in (f"assets/video/ask/{v['slug']}.mp4", f"assets/img/ask/{v['slug']}.jpg"):
        if not os.path.exists(os.path.join(ROOT, p)):
            raise SystemExit(f"missing media: {p}")
    build_question(v, [o for o in VIDEOS if o is not v])
build_hub()
build_strip()
print(f"Built /ask/ with {len(VIDEOS)} videos (live={LIVE}).")
