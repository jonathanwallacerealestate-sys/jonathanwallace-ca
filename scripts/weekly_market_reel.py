"""APPROVED weekly market 9:16 Instagram card (use this, not weekly_market_card.py).
Usage: python3 scripts/weekly_market_reel.py plate.png out.jpg  (edit WEEK, SUMMARY, KICKER, STATS first).
Plate: Artlist 9:16 render of the week's house, roof peak at about 78% of the height.
Fonts in /home/claude/fonts: PlayfairDisplay.ttf, NunitoSans.ttf (Google Fonts variable files).
Weekly market 9:16 card in the approved Sep 21 to 27, 2026 layout (market-sep-21-27-2026-reel.jpg).
No drop shadow, no gradient overlay (DEC-20261103-02)."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

PLATE, OUT = sys.argv[1], sys.argv[2]
F = "/home/claude/fonts/"
WEEK = "Week of November 9 to 15, 2026"
SUMMARY = "Sales slowed. Inventory eased to 8.5."
KICKER = "BUYER’S MARKET · 8.5 MONTHS OF INVENTORY"
STATS = [  # label, value, change, direction (True up, False down, None no change)
    ("SALES", "99", "25.0%", False), ("AVERAGE PRICE", "$693,942", "9.9%", False),
    ("NEW LISTINGS", "332", "14.7%", False), ("ACTIVE LISTINGS", "4,684", "113", False),
    ("SALES TO NEW LISTINGS", "30%", "4 pts", False), ("MONTHS OF INVENTORY", "8.5", "0.1", False),
    ("DAYS ON MARKET", "59", "1 day", True), ("LIST TO SALE", "95%", "1 pt", False),
]
IVORY, GOLD, GREY, RULE = (247, 236, 228), (201, 169, 106), (150, 142, 134), (176, 150, 112)
UPC, DNC = (236, 200, 128), (214, 206, 198)  # arrows: brighter gold up, light warm grey down (contrast fix 2026-11-17)

def font(name, size, var):
    f = ImageFont.truetype(F + name, size); f.set_variation_by_name(var); return f

im = Image.open(PLATE).convert("RGB").resize((1080, 1920), Image.LANCZOS)
# Grade the sky toward charcoal (photo grade, not an overlay): desaturate and darken above the treeline.
top = im.crop((0, 0, 1080, 1440))
top = ImageEnhance.Color(top).enhance(0.35); top = ImageEnhance.Brightness(top).enhance(0.62)
mask = Image.new("L", (1080, 1440))
for y in range(1440):
    a = 255 if y < 1300 else int(255 * (1440 - y) / 140)
    mask.paste(a, (0, y, 1080, y + 1))
im.paste(top, (0, 0), mask)
d = ImageDraw.Draw(im)

def spaced(text, xc, y, f, fill, track):
    w = sum(d.textlength(c, font=f) for c in text) + track * (len(text) - 1)
    x = xc - w / 2
    for c in text:
        d.text((x, y), c, font=f, fill=fill, anchor="ls"); x += d.textlength(c, font=f) + track

spaced("@JONATHANWALLACEREALESTATE", 540, 173, font("NunitoSans.ttf", 29, "Regular"), IVORY, 2.2)
spaced(KICKER, 540, 244, font("NunitoSans.ttf", 32, "SemiBold"), GOLD, 1.2)
hf = font("PlayfairDisplay.ttf", 90, "Regular")
d.text((540, 342), "GEORGIAN BAY", font=hf, fill=IVORY, anchor="ms")
d.text((540, 428), "MARKET UPDATE", font=hf, fill=IVORY, anchor="ms")
d.line([(332, 470), (748, 470)], fill=RULE, width=2)
bf = font("NunitoSans.ttf", 34, "Regular")
d.text((540, 538), WEEK, font=bf, fill=IVORY, anchor="ms")
d.text((540, 585), SUMMARY, font=bf, fill=IVORY, anchor="ms")

def dashed(x0, y0, x1, y1, dash=7, gap=6):
    import math
    L = math.hypot(x1 - x0, y1 - y0); n = 0.0
    while n < L:
        e = min(n + dash, L)
        d.line([(x0 + (x1 - x0) * n / L, y0 + (y1 - y0) * n / L), (x0 + (x1 - x0) * e / L, y0 + (y1 - y0) * e / L)], fill=RULE, width=2)
        n += dash + gap

TOP, RH = 628, 173
dashed(540, TOP, 540, TOP + RH * 4 - 2)
for r in (1, 2, 3):
    dashed(92, TOP + RH * r, 988, TOP + RH * r)
lf = font("NunitoSans.ttf", 30, "SemiBold"); vf = font("PlayfairDisplay.ttf", 60, "Medium"); cf = font("NunitoSans.ttf", 30, "Regular")
for i, (lab, val, chg, up) in enumerate(STATS):
    xc = 316 if i % 2 == 0 else 764; y0 = TOP + RH * (i // 2)
    spaced(lab, xc, y0 + 43, lf, GOLD, 0.8)
    d.text((xc, y0 + 105), val, font=vf, fill=IVORY, anchor="ms", features=["lnum"])
    tw = d.textlength(chg, font=cf); yb = y0 + 149
    if up is None:
        d.text((xc, yb), chg, font=cf, fill=IVORY, anchor="ms")
    else:
        ax = xc - (tw + 38) / 2; col = UPC if up else DNC
        tri = [(ax, yb - 1), (ax + 28, yb - 1), (ax + 14, yb - 25)] if up else [(ax, yb - 25), (ax + 28, yb - 25), (ax + 14, yb - 1)]
        d.polygon(tri, fill=col)
        d.text((ax + 38, yb), chg, font=cf, fill=IVORY, anchor="ls")
im.save(OUT, "JPEG", quality=88, progressive=True, optimize=True)
print("ok")
