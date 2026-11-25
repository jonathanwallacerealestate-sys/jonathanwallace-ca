#!/usr/bin/env python3
"""Keep the homepage "Market updates and guides" cards in step with blog.html.

The homepage shows two cards:
  Slot 1: the newest market update  = the card inside blog.html's LATEST MARKET UPDATE markers.
  Slot 2: the newest published piece = the first card after the /LATEST MARKET UPDATE marker.

Both are copied from blog.html into index.html between the HOME SLOTS markers, so the
homepage can never fall behind the blog again. Runs in the Netlify build before
check_site.py, and can be run locally:  python3 scripts/sync_home_slots.py
Exits 0 when the homepage already matches or was updated; 1 if a marker is missing.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD = re.compile(r"<a class='listing' href='[^']+'.*?</a>", re.S)
START = "<!-- HOME SLOTS (auto-synced from blog.html by scripts/sync_home_slots.py; do not edit by hand) -->"
END = "<!-- /HOME SLOTS -->"


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as fh:
        return fh.read()


def home_slots():
    """Return the two homepage cards, built from blog.html."""
    blog = read("blog.html")
    latest = re.search(r"<!-- LATEST MARKET UPDATE.*?-->(.*?)<!-- /LATEST MARKET UPDATE -->", blog, re.S)
    if not latest:
        sys.exit("sync_home_slots: blog.html has no LATEST MARKET UPDATE markers")
    slot1 = CARD.search(latest.group(1))
    slot2 = CARD.search(blog, latest.end())
    if not slot1 or not slot2:
        sys.exit("sync_home_slots: could not find both cards in blog.html")
    return [slot1.group(0), slot2.group(0)]


def to_home(card):
    """Blog card markup -> homepage card markup (slightly larger type on the homepage)."""
    card = card.replace("font-size:1.05rem", "font-size:1.15rem").replace("font-size:.9rem", "font-size:.92rem")
    lines = [ln.strip() for ln in card.splitlines() if ln.strip()]
    return "\n".join("          " + ("  " if 0 < i < len(lines) - 1 else "") + ln for i, ln in enumerate(lines))


def build_block():
    s1, s2 = (to_home(c) for c in home_slots())
    return (
        f"{START}\n"
        f"          <!-- SLOT 1: NEWEST MARKET UPDATE -->\n{s1}\n"
        f"          <!-- SLOT 2: NEWEST PUBLISHED PIECE -->\n{s2}\n"
        f"          {END}"
    )


def main():
    index = read("index.html")
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.S)
    if not pattern.search(index):
        print("sync_home_slots: index.html has no HOME SLOTS markers")
        return 1
    updated = pattern.sub(lambda _: build_block(), index)
    if updated == index:
        print("sync_home_slots: homepage already matches blog.html")
        return 0
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(updated)
    print("sync_home_slots: homepage cards updated from blog.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
