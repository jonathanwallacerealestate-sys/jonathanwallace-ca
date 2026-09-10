#!/usr/bin/env python3
"""Weekly Market Card, Instagram. Built to 02-playbooks/weekly-market-card-instagram.md.

Locked. Only these change weekly: plate, kicker, period line, three-line headline, eight stats.

  DEC-145  type field centred on FRAME centre; reel x140..x940; assert FCX == W//2
  DEC-146  subject centring is plate selection, never crop
  DEC-147  each stat one unit; reel row pitch 186, cell height 154
  DEC-148  gold up / warm grey down, direction by POLYGON triangle; arrow and text
           centre as one group; rules live in the trough only
  DEC-160  bottom scrim 150*t**2.6
  DEC-070/176  Cormorant Garamond lockup, letterspaced Nunito Sans subline
  playbook §3  headline balances across EXACTLY three lines or the build REFUSES
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
FX0, FX1 = 140, 940
FCX = (FX0 + FX1) // 2
HEADLINE_END = 0.38
GRID_END = 0.79
ROW_PITCH, CELL_H = 186, 154

IVORY    = (247, 243, 236)
GOLD     = (201, 169, 106)
WARMGREY = (138, 131, 120)

CORM = "/home/claude/fonts/Cormorant.ttf"
PLAY = "/home/claude/fonts/PlayfairDisplay.ttf"
NUNI = "/home/claude/fonts/NunitoSans.ttf"

KICKER = "INVENTORY FELL FOR THE WRONG REASON"
LOCKUP = ["GEORGIAN BAY", "MARKET UPDATE"]
PERIOD = "WEEK OF AUGUST 31 TO SEPTEMBER 6, 2026"
HEADLINE = "Did the market improve because the sellers dropped out?"
HANDLE = "@JONATHANWALLACEREALESTATE"

STATS = [
    ("SALES",                "142",      "11.3%",  False),
    ("AVERAGE PRICE",        "$746,077", "1.7%",   False),
    ("NEW LISTINGS",         "495",      "75",     True),
    ("ACTIVE LISTINGS",      "5,267",    "161",    False),
    ("SALES TO NEW LISTINGS", "29%",     "9 pts",  False),
    ("MONTHS OF INVENTORY",  "7.7",      "0.3",    False),
    ("DAYS ON MARKET",       "47",       "2 days", False),
    ("LIST TO SALE",         "96%",      "no change", None),
]


def f(path, size, inst):
    ft = ImageFont.truetype(path, size)
    try:
        ft.set_variation_by_name(inst)
    except Exception:
        pass
    return ft


def tw(d, s, ft, track=0.0):
    if not track:
        return d.textlength(s, font=ft)
    return sum(d.textlength(c, font=ft) for c in s) + track * (len(s) - 1)


def centred(d, y, s, ft, fill, track=0.0, cx=FCX):
    x = cx - tw(d, s, ft, track) / 2
    if not track:
        d.text((x, y), s, font=ft, fill=fill)
        return
    for c in s:
        d.text((x, y), c, font=ft, fill=fill)
        x += d.textlength(c, font=ft) + track


def balance_three(d, text, ft):
    words = text.split()
    if len(words) < 3:
        return None
    best = None
    for i in range(1, len(words) - 1):
        for j in range(i + 1, len(words)):
            lines = [" ".join(words[:i]), " ".join(words[i:j]), " ".join(words[j:])]
            widest = max(tw(d, l, ft) for l in lines)
            if best is None or widest < best[0]:
                best = (widest, lines)
    return None if best[0] > (FX1 - FX0) else best[1]


def bottom_scrim(img):
    """DEC-160 curve, plus a 2D adaptive term across the stat band.

    The locked 150*t**2.6 was tuned against a bright sand foreground. A lit house
    sitting under the grid needs more, and it needs it only where the plate is
    actually bright, so the term is derived from blurred luminance rather than
    applied flat. Blur the LUMINANCE first, then derive alpha.
    """
    ys = np.linspace(0, 1, H)[:, None]
    t = np.clip((ys - 0.30) / 0.70, 0, 1)
    a = np.clip(150 * t ** 2.6, 0, 255) * np.ones((1, W))

    lum = np.asarray(img).astype(float) @ [0.2126, 0.7152, 0.0722]
    blur = np.asarray(
        Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(60))
    ).astype(float)
    local = np.clip((blur - 30) / 120, 0, 1) * 205
    band = np.clip((ys - 0.36) / 0.06, 0, 1)          # fades in above the grid
    a = np.maximum(a, local * band)

    tt = 1 - np.clip((ys - 0.02) / 0.36, 0, 1)
    a = np.maximum(a, tt * 110 * np.ones((1, W)))

    m = Image.fromarray(np.clip(a, 0, 245).astype(np.uint8), "L")
    m = m.filter(ImageFilter.GaussianBlur(14))
    return Image.composite(Image.new("RGB", (W, H), (12, 12, 12)), img, m)


def fit_label(d, s, col_w):
    for track in (2.6, 2.0, 1.4, 0.8):
        ft = f(NUNI, 23, "SemiBold")
        if tw(d, s, ft, track) <= col_w:
            return ft, track
    for size in (22, 21, 20, 19, 18):
        ft = f(NUNI, size, "SemiBold")
        if tw(d, s, ft, 0.8) <= col_w:
            return ft, 0.8
    return f(NUNI, 18, "SemiBold"), 0.6


def triangle(d, cx, cy, up, fill, w=13, h=11):
    if up:
        d.polygon([(cx, cy - h / 2), (cx - w / 2, cy + h / 2), (cx + w / 2, cy + h / 2)], fill=fill)
    else:
        d.polygon([(cx, cy + h / 2), (cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2)], fill=fill)


def build(plate, out):
    assert FCX == W // 2, f"type field centre {FCX} != frame centre {W // 2}"

    im = Image.open(plate).convert("RGB")
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    im = im.crop(((im.width - W) // 2, 0, (im.width - W) // 2 + W, H))
    img = bottom_scrim(im)
    d = ImageDraw.Draw(img)

    f_kick = f(NUNI, 22, "SemiBold")
    f_lock = f(CORM, 108, "Light")
    f_per  = f(NUNI, 24, "Regular")
    f_head = f(CORM, 62, "Regular")
    f_fig  = f(PLAY, 62, "Medium")
    f_chg  = f(NUNI, 24, "Regular")
    f_hand = f(NUNI, 23, "SemiBold")

    lines = balance_three(d, HEADLINE, f_head)
    if lines is None:
        raise SystemExit("headline will not balance across three lines: shorten it")

    y = 128
    centred(d, y, KICKER, f_kick, GOLD, track=5.0); y += 54
    for l in LOCKUP:
        centred(d, y, l, f_lock, IVORY, track=1.5); y += 106
    y += 24
    d.rectangle([FCX - 105, y, FCX + 105, y + 2], fill=GOLD); y += 34
    centred(d, y, PERIOD, f_per, WARMGREY, track=3.4); y += 64

    for l in lines:
        centred(d, y, l, f_head, IVORY); y += 76
    head_end = y - 76 + 64

    grid_top = int(GRID_END * H) - (3 * ROW_PITCH + CELL_H)
    if grid_top < head_end + 20:
        raise SystemExit(f"headline ends y{head_end}, grid must start y{grid_top}: shorten headline")

    col_w = (FX1 - FX0) // 2
    d.rectangle([FCX - 1, grid_top - 8, FCX, grid_top + 3 * ROW_PITCH + CELL_H], fill=(84, 80, 74))

    for i, (label, fig, chg, up) in enumerate(STATS):
        row, col = divmod(i, 2)
        ccx = FX0 + col * col_w + col_w // 2
        cy = grid_top + row * ROW_PITCH
        lf, lt = fit_label(d, label, col_w - 46)
        centred(d, cy, label, lf, WARMGREY, track=lt, cx=ccx)
        centred(d, cy + 38, fig, f_fig, IVORY, cx=ccx)
        # DEC-148: direction is carried by the triangle. No direction, no triangle.
        if up is None:
            centred(d, cy + 38 + 80, chg, f_chg, WARMGREY, cx=ccx)
        else:
            c = GOLD if up else WARMGREY
            gw = 13 + 9 + tw(d, chg, f_chg)
            gx = ccx - gw / 2
            triangle(d, gx + 6.5, cy + 38 + 80 + 14, up, c)
            d.text((gx + 22, cy + 38 + 80), chg, font=f_chg, fill=c)

    grid_bottom = grid_top + 3 * ROW_PITCH + CELL_H
    pct = grid_bottom / H * 100
    if abs(pct - GRID_END * 100) > 0.4:
        raise SystemExit(f"grid ends {pct:.2f}%, locked {GRID_END * 100:.0f}%")

    d.rectangle([FCX - 105, grid_bottom + 56, FCX + 105, grid_bottom + 58], fill=GOLD)
    centred(d, 1830, HANDLE, f_hand, IVORY, track=4.2)

    img.save(out, "JPEG", quality=93, subsampling=0, progressive=True)
    print(f"3 lines, headline ends {head_end / H * 100:.1f}% (target 38%) | "
          f"grid {grid_top}->{grid_bottom} = {pct:.2f}% | FCX {FCX} | handle y1830")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
