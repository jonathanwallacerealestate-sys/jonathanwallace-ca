#!/usr/bin/env python3
"""Pre-deploy check for jonathanwallace.ca. Runs as the Netlify build command, so a
failed check stops the deploy instead of shipping a half-finished publish.

Checks (each maps to a logged rule):
- Every JSON-LD block parses (DEC-263).
- Every indexable blog post is in sitemap.xml, llms.txt and has a card on blog.html,
  and blog.html's ItemList matches its visible cards (DEC-256, DEC-20260923-06).
- /market-update-latest points at the newest market update (DEC-20261001-21).
- No sitemap URL is noindex (DEC-260).
- No self-serving aggregateRating on Jonathan Wallace's own entity (DEC-252).
- No em dashes in visible copy, titles or meta descriptions (DEC-20261021-13).
- No wrong phone number (DEC-TBD-e: 705-733-2525 is wrong everywhere).

Run locally: python3 scripts/check_site.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://jonathanwallace.ca"
SKIP = ("assets/", "elections-2026/", "jacqui-oauth/", "listings/_template", "seller-valuation/", ".git/", "node_modules/")
problems = []


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def norm(url):
    url = url.split("#")[0].split("?")[0]
    url = url.replace(SITE, "")
    if url.endswith("/index.html"):
        url = url[: -len("index.html")]
    if url.endswith(".html"):
        url = url[:-5]
    return url.rstrip("/") or "/"


pages = sorted(
    p for p in glob.glob("**/*.html", root_dir=ROOT, recursive=True) if not p.startswith(SKIP)
)
sitemap = read("sitemap.xml")
sitemap_urls = {norm(u) for u in re.findall(r"<loc>(.*?)</loc>", sitemap)}
llms = read("llms.txt")
llms_urls = {norm(u) for u in re.findall(r"\((https://jonathanwallace\.ca[^)\s]*)\)", llms)}
blog = read("blog.html")
card_urls = [norm(h) for h in re.findall(r"<a class='listing' href='([^']+)'", blog)]

for path in pages:
    text = read(path)
    robots = re.search(r'<meta name="robots" content="([^"]*)"', text)
    noindex = bool(robots and "noindex" in robots.group(1))
    url = norm("/" + path)

    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
        try:
            data = json.loads(block)
        except ValueError as exc:
            problems.append(f"{path}: JSON-LD does not parse ({exc})")
            continue
        if '"aggregateRating"' in json.dumps(data) and re.search(r'"@id"\s*:\s*"[^"]*#(agent|jonathan)"', block):
            problems.append(f"{path}: aggregateRating on Jonathan Wallace's own entity (DEC-252)")

    if "705-733-2525" in text or "7057332525" in text:
        problems.append(f"{path}: wrong phone number 705-733-2525")

    if not noindex:
        visible = re.sub(r"<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->", "", text, flags=re.S | re.I)
        title = re.search(r"<title>(.*?)</title>", text, re.S)
        desc = re.search(r'<meta name="description" content="([^"]*)"', text)
        body = re.sub(r"<[^>]+>", " ", visible)
        for label, chunk in (("copy", body), ("title", title.group(1) if title else ""), ("meta description", desc.group(1) if desc else "")):
            if "—" in chunk or "&mdash;" in chunk:
                problems.append(f"{path}: em dash in {label} (DEC-20261021-13)")

    if noindex and url in sitemap_urls:
        problems.append(f"{path}: noindex page is listed in sitemap.xml (DEC-260)")

    is_post = os.path.basename(path).startswith("blog-") or (path.startswith("blog/") and path.endswith("index.html"))
    if is_post and not noindex:
        if url not in sitemap_urls:
            problems.append(f"{path}: missing from sitemap.xml")
        if url not in llms_urls:
            problems.append(f"{path}: missing from llms.txt (DEC-256)")
        if url not in card_urls:
            problems.append(f"{path}: no card on blog.html")

# blog.html ItemList must match the visible cards, in order (DEC-20260923-06)
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', blog, re.S):
    data = json.loads(block)
    if isinstance(data, dict) and data.get("@type") == "Blog":
        listed = [norm(item["url"]) for item in data["mainEntity"]["itemListElement"]]
        if listed != card_urls:
            problems.append("blog.html: ItemList does not match the visible card order")

# no duplicate redirect sources in netlify.toml
froms = re.findall(r'^\s*from = "([^"]+)"', read("netlify.toml"), re.M)
for dup in sorted({f for f in froms if froms.count(f) > 1}):
    problems.append(f"netlify.toml: redirect from {dup} is defined more than once")

# /market-update-latest must point at the newest market update (DEC-20261001-21)
toml = read("netlify.toml")
targets = re.findall(r'from = "/market-update-latest/?"\s*\n\s*to = "([^"]+)"', toml)
newest, newest_date = None, ""
for path in glob.glob("blog-market-update-*.html", root_dir=ROOT):
    page = read(path)
    published = re.search(r'"datePublished"\s*:\s*"([^"]+)"', page) or re.search(r'article:published_time" content="([^"]+)"', page)
    if published and published.group(1) > newest_date:
        newest, newest_date = path, published.group(1)
for target in targets:
    if newest and norm(target) != norm("/" + newest):
        problems.append(f"netlify.toml: /market-update-latest points to {target}, newest market update is /{newest}")

if problems:
    print(f"check_site: {len(problems)} problem(s), deploy stopped:")
    for p in problems:
        print(" -", p)
    sys.exit(1)
print(f"check_site: OK ({len(pages)} pages checked)")
