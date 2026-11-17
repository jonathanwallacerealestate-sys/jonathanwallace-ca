"""Weekly market 4:5 Facebook card (1080 x 1350), matching market-sep-21-27-2026-facebook.jpg.
Usage: python3 scripts/weekly_market_facebook.py plate_9x16.png out.jpg "Week of November 9 to 15, 2026"
Plate: the same 9:16 Artlist plate as the Instagram 9:16 card. Bottom 1350 px of the 1080 x 1920 plate.
Sky graded toward charcoal (photo grade, not an overlay). No drop shadow, no gradient panel (DEC-20261103-02)."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
PLATE, OUT, WEEK = sys.argv[1], sys.argv[2], sys.argv[3]
F = "/home/claude/fonts/"
IVORY, RULE = (247, 236, 228), (201, 169, 106)
def font(name, size, var):
    f = ImageFont.truetype(F + name, size); f.set_variation_by_name(var); return f
im = Image.open(PLATE).convert("RGB").resize((1080, 1920), Image.LANCZOS).crop((0, 570, 1080, 1920))
top = im.crop((0, 0, 1080, 760))
top = ImageEnhance.Color(top).enhance(0.45); top = ImageEnhance.Brightness(top).enhance(0.7)
mask = Image.new("L", (1080, 760))
for y in range(760):
    mask.paste(255 if y < 560 else int(255 * (760 - y) / 200), (0, y, 1080, y + 1))
im.paste(top, (0, 0), mask)
d = ImageDraw.Draw(im)
hf = font("PlayfairDisplay.ttf", 92, "Regular")
d.text((540, 272), "GEORGIAN BAY", font=hf, fill=IVORY, anchor="ms")
d.text((540, 368), "MARKET UPDATE", font=hf, fill=IVORY, anchor="ms")
d.line([(160, 402), (920, 402)], fill=RULE, width=3)
d.text((540, 458), WEEK, font=font("NunitoSans.ttf", 36, "Regular"), fill=IVORY, anchor="ms")
im.save(OUT, "JPEG", quality=88, progressive=True, optimize=True)
print("ok")
