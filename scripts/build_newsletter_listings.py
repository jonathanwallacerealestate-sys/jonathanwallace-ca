#!/usr/bin/env python3
"""Build the newsletter listing pages from saved REALTOR.ca facts and local photos.

Photo folders are assets/img/listings/<slug>/.
01.jpg is the hero. Drop replacement files in that folder (same names, same order)
and rerun this script. Drive originals are copied as-is. REALTOR.ca photos are
the fallback, and the extra landscape set for 375 Champlain Road.
"""

import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path("/workspace")
SCRAPE = Path("/tmp/listings")
IMG = ROOT / "assets" / "img" / "listings"
DATA = ROOT / "assets" / "data" / "listings"
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")

COURTESY = "FARIS TEAM REAL ESTATE BROKERAGE"
BYLINE = "Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage"
PHONE_TEL = "+17059983064"
PHONE_DISP = "705-998-3064"

LISTINGS = [
    {
        "id": "30352658",
        "slug": "20-rue-eric-tiny",
        "address": "20 Rue Eric",
        "community": "Lafontaine, Tiny Township",
        "locality": "Tiny",
        "region_name": "Lafontaine",
        "postal": "L9M 0H1",
        "featured": True,
        "photo_mode": "drive",
        "zip": UPLOADS / "20-rue-eric-tiny_671b.zip",
        "agents": [("Mark Faris", "Broker"), ("Jonathan Wallace", "Realtor")],
        "waterfront_length": None,
    },
    {
        "id": "30384907",
        "slug": "7-dock-lane-tay",
        "address": "7 Dock Lane",
        "community": "Port McNicoll, Tay Township",
        "locality": "Tay",
        "region_name": "Port McNicoll",
        "postal": "L0K 1R0",
        "featured": False,
        "photo_mode": "realtor",
        "agents": [("Mark Faris", "Broker"), ("Sabrina Staunton", "Broker")],
        "waterfront_length": None,
        "missing": [
            "Lot depth is not shown on REALTOR.ca (lot size is given as 50 ft frontage, under 1/2 acre).",
            "Waterfront length is not listed separately from the 50 ft lot frontage.",
        ],
    },
    {
        "id": "30374083",
        "slug": "8-pinecone-avenue-tiny",
        "address": "8 Pinecone Avenue",
        "community": "Rural Tiny",
        "locality": "Tiny",
        "region_name": "Tiny",
        "postal": "L9M 0J2",
        "featured": False,
        "photo_mode": "drive",
        "zip": UPLOADS / "8-pinecone-avenue-tiny_f37b.zip",
        "agents": [("Mark Faris", "Broker"), ("Ryan Lesperance", None)],
        "waterfront_length": None,
    },
    {
        "id": "30372002",
        "slug": "103-silver-birch-drive-tiny",
        "address": "103 Silver Birch Drive",
        "community": "Rural Tiny",
        "locality": "Tiny",
        "region_name": "Tiny",
        "postal": "L9M 0M6",
        "featured": False,
        "photo_mode": "realtor",
        "agents": [("Mark Faris", "Broker"), ("Sabrina Staunton", "Broker")],
        "waterfront_length": None,
    },
    {
        "id": "30355545",
        "slug": "4-charles-street-penetanguishene",
        "address": "4 Charles Street",
        "community": "Penetanguishene, Simcoe County",
        "locality": "Penetanguishene",
        "region_name": "Penetanguishene",
        "postal": "L9M 2G6",
        "featured": False,
        "photo_mode": "drive",
        "zip": UPLOADS / "4-charles-street-penetanguishene_a580.zip",
        "agents": [("Mark Faris", "Broker"), ("Jonathan Wallace", "Realtor")],
        "waterfront_length": None,
        "media": [
            ("Video tour", "https://www.youtube.com/watch?v=pNc1Oy0H6cA"),
            ("360° tour", "https://youriguide.com/4_charles_street_penetanguishene_on/"),
            ("Floor plan", "https://youriguide.com/4_charles_street_penetanguishene_on/doc/floorplan_imperial_en_u.pdf"),
            ("Floor plan, metric", "https://youriguide.com/4_charles_street_penetanguishene_on/doc/floorplan_metric_en_u.pdf"),
            ("Feature book", "https://issuu.com/faristeamlistings/docs/4_charles_street_penetanguishene?fr=sOGY5YjgzNDM5Mzc"),
        ],
    },
    {
        "id": "30331640",
        "slug": "139-veterans-lane-tay",
        "address": "139 Veterans Lane",
        "community": "Victoria Harbour, Tay Township",
        "locality": "Tay",
        "region_name": "Victoria Harbour",
        "postal": "L0K 2A0",
        "featured": False,
        "photo_mode": "realtor",
        "agents": [("Mark Faris", "Broker"), ("Sabrina Staunton", "Broker")],
        "waterfront_length": None,
    },
    {
        "id": "30308427",
        "slug": "390-mildred-street-midland",
        "address": "390 Mildred Street",
        "community": "Midland",
        "locality": "Midland",
        "region_name": "Midland",
        "postal": "L4R 3R6",
        "featured": False,
        "photo_mode": "drive",
        "zip": UPLOADS / "390-mildred-street-midland_0c37.zip",
        "agents": [("Mark Faris", "Broker"), ("Jonathan Wallace", "Realtor")],
        "waterfront_length": None,
        "missing": ["Appliances are not listed on REALTOR.ca."],
    },
    {
        "id": "30299161",
        "slug": "993-whitney-crescent-midland",
        "address": "993 Whitney Crescent",
        "community": "Midland",
        "locality": "Midland",
        "region_name": "Midland",
        "postal": "L4R 5N3",
        "featured": False,
        "photo_mode": "realtor",
        "agents": [("Mark Faris", "Broker"), ("Sabrina Staunton", "Broker")],
        "waterfront_length": None,
    },
    {
        "id": "30209339",
        "slug": "375-champlain-road-penetanguishene",
        "address": "375 Champlain Road",
        "community": "Penetanguishene",
        "locality": "Penetanguishene",
        "region_name": "Penetanguishene",
        "postal": "L9M 1S3",
        "featured": False,
        "photo_mode": "drive-plus-realtor-landscape",
        "zip": UPLOADS / "375-champlain-road-penetanguishene_3c68.zip",
        "agents": [("Mark Faris", "Broker"), ("Jonathan Wallace", "Realtor")],
        "waterfront_length": None,
        "missing": [
            "Water source is not shown on REALTOR.ca.",
            "Sewer is not shown on REALTOR.ca.",
            "Waterfront length is not listed separately from the 67 ft lot frontage.",
        ],
    },
    {
        "id": "30225147",
        "slug": "1016-wright-drive-midland",
        "address": "1016 Wright Drive",
        "community": "Midland",
        "locality": "Midland",
        "region_name": "Midland",
        "postal": "L4R 0E4",
        "featured": False,
        "photo_mode": "realtor",
        "agents": [("Mark Faris", "Broker"), ("Wyatt Negrini-Weber", None)],
        "waterfront_length": None,
    },
    {
        "id": "30118761",
        "slug": "1787-champlain-road-tiny",
        "address": "1787 Champlain Road",
        "community": "Rural Tiny",
        "locality": "Tiny",
        "region_name": "Tiny",
        "postal": "L9M 0B6",
        "featured": False,
        "photo_mode": "drive",
        "zip": UPLOADS / "1787-champlain-road-tiny_9e95.zip",
        "agents": [("Mark Faris", "Broker"), ("Jonathan Wallace", "Realtor")],
        "waterfront_length": "107 ft",
        "waterfront_note": "Sandy shoreline",
        "missing": [
            "Storeys are not shown on REALTOR.ca. The style is listed as a backsplit.",
            "Basement type on REALTOR.ca rendered as FinishedFull, with no separator. The description says a finished basement, so the page says Finished.",
        ],
    },
]

# Existing page, kept in place. Index links here. Photos are the Drive set in this folder.
EXISTING_1555 = {
    "slug": "1555-baseline-road-south-tiny",
    "alias": "1555-baseline-road-s-tiny",
    "address": "1555 Baseline Road South",
    "community": "Rural Tiny",
    "locality": "Tiny",
    "postal": "L0L 2T0",
    "price": "$1,499,900",
    "mls": "S13760056",
    "beds": "3 + 2",
    "baths": "4",
    "summary": "3 + 2 bedrooms, 4 bathrooms, and 2,595 sq. ft. above grade plus a partially finished lower level, with a saltwater inground pool.",
    "hero": "/assets/img/listings/1555-baseline-road-south-tiny/01.jpg",
    "realtor_url": "https://www.realtor.ca/real-estate/30251863/1555-baseline-road-s-tiny-rural-tiny",
}


def load_text(prop_id):
    data = json.loads((SCRAPE / f"{prop_id}.json").read_text())
    return data["text"], data["finalUrl"], data["imgs"]


def between(text, start, end):
    i = text.find(start)
    if i < 0:
        return ""
    i += len(start)
    j = text.find(end, i)
    if j < 0:
        return text[i:]
    return text[i:j]


def grab(text, label, stops):
    m = re.search(rf"(?:^|\n){re.escape(label)}\n", text)
    if not m:
        return ""
    i = m.end()
    end = len(text)
    for stop in stops:
        j = text.find("\n" + stop + "\n", i)
        if j >= 0:
            end = min(end, j)
    return text[i:end].strip().split("\n")[0].strip()


def split_description(raw):
    raw = re.sub(r"\s*\(\d+\)\s*$", "", raw.strip())
    staging = ""
    m = re.search(r"(\*Please note.*)$", raw)
    if m:
        staging = m.group(1).strip()
        raw = raw[: m.start()].strip()
    parts = [p.strip() for p in re.split(r"\s(?=\d\)\s)", raw) if p.strip()]
    if staging:
        parts.append(staging)
    return parts


def fmt_measure(part):
    part = part.strip()
    m = re.match(r"(\d+)\s*ft(?:\s*,\s*(\d+)\s*in)?", part)
    if not m:
        return part
    feet, inches = m.group(1), m.group(2)
    return f"{feet}'" + (f'{inches}"' if inches else "")


def fmt_ft(raw):
    raw = " ".join(raw.split())
    m = re.match(r"(\d+)\s*ft(?:\s*,\s*(\d+)\s*in)?", raw)
    if not m:
        return raw
    if m.group(2):
        return f"{m.group(1)} ft {m.group(2)} in"
    return f"{m.group(1)} ft"


def fmt_size(raw):
    raw = " ".join(raw.split())
    if " x " in raw:
        a, b = raw.split(" x ", 1)
        return f"{fmt_measure(a)} x {fmt_measure(b)}"
    return fmt_measure(raw)


def level_name(raw):
    return raw.replace(" level", "").replace(" Level", "").strip()


def parse_rooms(block):
    lines = [ln.rstrip() for ln in block.splitlines() if ln.strip() and ln.strip() not in {"Metric", "•", "Imperial"}]
    rooms = []
    current = ""
    i = 0
    while i < len(lines) - 1:
        line = lines[i]
        nxt = lines[i + 1].strip()
        if "\t" in line and "ft" in nxt:
            cells = [c.strip() for c in line.split("\t")]
            named = [c for c in cells if c]
            if cells and cells[0]:
                current = level_name(named[0])
                room = named[1] if len(named) > 1 else ""
            else:
                room = named[0] if named else ""
            if room:
                rooms.append({"level": current, "room": room, "size": fmt_size(nxt)})
            i += 2
            continue
        i += 1
    return rooms


def pretty_range(raw):
    nums = re.findall(r"\d+", raw.replace(",", ""))
    if len(nums) >= 2:
        return f"{int(nums[0]):,} - {int(nums[1]):,} sq. ft."
    return raw


def lot_parts(raw):
    dim, _, extra = raw.partition("|")
    dim = dim.replace("FT", "ft").replace("  ", " ").strip()
    dim = re.sub(r"\s*ft", " ft", dim)
    dim = dim.replace("ft", "ft").strip()
    # "140 x 150 ft" already. "50 ft" stays.
    dim = dim.replace(" ft", " ft")
    extra = extra.replace("under", "Under").strip()
    return dim, extra


def beds_label(header_beds, above, below):
    if above and below:
        return f"{above} + {below}", f"{above} above grade, {below} below grade"
    if above:
        return above, None
    return header_beds.strip(), None


def finished_line(description_paras):
    blob = " ".join(description_paras)
    tail = ""
    low = blob.lower()
    if "partially finished lower level" in low:
        tail = " plus a partially finished lower level"
    elif "finished lower level" in low:
        tail = " plus a finished lower level"
    elif "unfinished basement" in low:
        tail = " plus an unfinished basement" if "above grade" in low else " with an unfinished basement"
    elif "finished basement" in low:
        tail = " plus a finished basement"
    m = re.search(r"(\d{1,3}(?:,\d{3})*)\s+above grade\s+sq\.?\s*ft\.?", blob, re.I)
    if m:
        return f"{m.group(1)} sq. ft. above grade{tail}"
    m = re.search(r"(\d{1,3}(?:,\d{3})*)\s+fin\.?\s*sq\.?\s*ft\.?", blob, re.I)
    if m:
        return f"{m.group(1)} sq. ft.{tail}"
    m = re.search(r"(\d{1,3}(?:,\d{3})*)\s+sq\.?\s*ft\.?", blob, re.I)
    if m:
        return f"{m.group(1)} sq. ft.{tail}"
    return ""


def title_heat(value):
    value = value.replace("Natural gas", "natural gas").replace("Propane", "propane")
    return value


def parse_listing(meta):
    text, url, imgs = load_text(meta["id"])
    price = between(text, "Favourite\n", "\n").strip()
    # price is on its own line before the address repeat. Find $ line.
    price_m = re.search(r"\$[0-9,]+", text)
    price = price_m.group(0)
    mls = re.search(r"MLS® Number:\s*(\S+)", text).group(1)
    header = between(text, "Get started with a mortgage", "Highlights")
    header_lines = [ln.strip() for ln in header.splitlines() if ln.strip()]
    # pattern: beds, Bedrooms, baths, Bathrooms, range, Square Feet
    beds_header = header_lines[0]
    baths_header = header_lines[2]
    sq_range = header_lines[4]
    desc_raw = between(text, "Listing Description\n", "\nLocation Description").strip()
    paras = split_description(desc_raw)
    cross = between(text, "Location Description\n", "\nProperty Summary").strip()
    summary_block = between(text, "Property Summary\n", "\nTime on REALTOR.ca")
    building = between(text, "\nBuilding\n", "\nMeasurements\n")
    land = between(text, "\nLand\n", "\nData provided by:")
    rooms = parse_rooms(between(text, "Rooms\n", "\nLand\n"))

    def field(block, label):
        return grab(block + "\nEND", label, ["Property Type", "Building Type", "Storeys", "Square Footage", "Community Name", "Title", "Land Size", "Age Of Building", "Annual Property Taxes", "Parking Type", "Bedrooms", "Above Grade", "Below Grade", "Bathrooms", "Total", "Partial", "Interior Features", "Appliances Included", "Flooring", "Basement Features", "Basement Type", "Building Features", "Features", "Foundation Type", "Style", "Architecture Style", "Split Level Style", "Building Amenities", "Rental Equipment", "Structures", "Heating & Cooling", "Cooling", "Fireplace", "Heating Type", "Utilities", "Utility Type", "Utility-Hydro", "Utility Sewer", "Water", "Exterior Features", "Exterior Finish", "Pool Type", "Pool Features", "Neighbourhood Features", "Community Features", "Amenities Nearby", "Parking", "Total Parking Spaces", "Lot Features", "Fencing", "Frontage", "Land Depth", "Landscape Features", "View", "Other Property Information", "Access", "Easements", "Zoning Description", "Waterfront Features", "Waterfront", "Waterfront Name", "Surface Water", "END"])

    above = field(building, "Above Grade")
    below = field(building, "Below Grade")
    beds, beds_note = beds_label(beds_header, above, below)
    bath_total = field(building, "Total") or baths_header
    bath_partial = field(building, "Partial")
    land_size_raw = field(summary_block, "Land Size")
    lot_dim, lot_extra = lot_parts(land_size_raw) if land_size_raw else ("", "")
    frontage = field(land, "Frontage")
    depth = field(land, "Land Depth")
    if frontage:
        frontage = fmt_ft(field(land, "Frontage"))
    if depth:
        depth = fmt_ft(field(land, "Land Depth"))

    appliances_raw = field(building, "Appliances Included")
    appliances = [a.strip() for a in appliances_raw.split(",") if a.strip()] if appliances_raw else []
    rental = field(building, "Rental Equipment")
    area_exact = finished_line(paras)
    waterfront = "Waterfront" in land or "Georgian Bay" in land
    water_name = field(land, "Waterfront Name")
    parsed = {
        "price": price,
        "mls": mls,
        "realtor_url": url,
        "beds": beds,
        "beds_note": beds_note,
        "baths": bath_total,
        "bath_partial": bath_partial,
        "sq_range": sq_range.replace("sqft", "sq. ft.").replace(" - ", " - "),
        "area_exact": area_exact,
        "paras": paras,
        "cross": cross.replace("/", " / "),
        "property_type": field(summary_block, "Property Type"),
        "building_type": field(summary_block, "Building Type"),
        "storeys": field(summary_block, "Storeys"),
        "community_name": field(summary_block, "Community Name"),
        "title": field(summary_block, "Title"),
        "lot_dim": lot_dim,
        "lot_extra": lot_extra,
        "age": field(summary_block, "Age Of Building"),
        "taxes": field(summary_block, "Annual Property Taxes"),
        "parking_type": field(summary_block, "Parking Type"),
        "parking_spaces": field(building, "Total Parking Spaces") or field(summary_block, "Total Parking Spaces"),
        "flooring": field(building, "Flooring"),
        "basement_features": field(building, "Basement Features"),
        "basement_type": field(building, "Basement Type"),
        "features": field(building, "Features"),
        "foundation": field(building, "Foundation Type"),
        "style": field(building, "Style"),
        "architecture": field(building, "Architecture Style"),
        "split": field(building, "Split Level Style"),
        "structures": field(building, "Structures") or field(land, "Structures"),
        "cooling": field(building, "Cooling"),
        "fireplace": field(building, "Fireplace"),
        "heating": title_heat(field(building, "Heating Type")),
        "sewer": field(building, "Utility Sewer"),
        "water": field(building, "Water"),
        "hydro": field(building, "Utility-Hydro"),
        "exterior": field(building, "Exterior Finish"),
        "pool": field(building, "Pool Type"),
        "pool_features": field(building, "Pool Features"),
        "nearby": field(building, "Amenities Nearby") or field(land, "Amenities Nearby"),
        "community_features": field(building, "Community Features"),
        "fencing": field(land, "Fencing"),
        "frontage": frontage,
        "depth": depth,
        "view": field(land, "View"),
        "access": field(land, "Access"),
        "zoning": field(land, "Zoning Description"),
        "waterfront": waterfront,
        "water_name": water_name,
        "rooms": rooms,
        "appliances": appliances,
        "rental": rental,
        "imgs": imgs,
        "staging": any(p.startswith("*Please note") for p in paras),
    }
    if meta["slug"] == "1787-champlain-road-tiny":
        parsed["basement_type"] = "Finished"
    return parsed


def summary_for(meta, parsed):
    beds = parsed["beds"]
    baths = parsed["baths"]
    area = parsed["area_exact"]
    bits = [f"{beds} bedroom" + ("s" if beds != "1" else "")]
    bits.append(f"{baths} bathroom" + ("s" if baths != "1" else ""))
    if area:
        bits.append(area)
    text = ", ".join(bits[:2])
    if area:
        text += f", and {area}"
    text += f" in {meta['region_name']}."
    if parsed["waterfront"] and parsed["water_name"]:
        text += f" Waterfront on {parsed['water_name']}."
    if meta.get("waterfront_length"):
        text += f" {meta['waterfront_length']} of sandy shoreline."
    if parsed["pool"]:
        extra = parsed["pool_features"] or parsed["pool"]
        text += f" {extra}."
    return text


def facts_for(meta, parsed):
    facts = []

    def add(label, value, note=""):
        if value:
            facts.append({"label": label, "value": value, "note": note})

    add("Bedrooms", parsed["beds"], parsed["beds_note"] or "")
    add("Bathrooms", f"{parsed['baths']} Bathroom" + ("s" if parsed["baths"] != "1" else ""))
    area_value = parsed["area_exact"] or pretty_range(parsed["sq_range"])
    area_note = ""
    if parsed["area_exact"] and parsed["sq_range"]:
        area_note = f"Size range {pretty_range(parsed['sq_range'])}"
    add("Finished area", area_value, area_note)
    add("Lot size", parsed["lot_dim"], parsed["lot_extra"])
    add("Lot frontage", parsed["frontage"])
    add("Lot depth", parsed["depth"])
    if parsed["waterfront"]:
        add("Waterfront", parsed["water_name"] or "Waterfront")
    if meta.get("waterfront_length"):
        add("Waterfront length", meta["waterfront_length"], meta.get("waterfront_note") or "")
    ptype = parsed["building_type"] or parsed["property_type"]
    style = parsed["architecture"] or parsed["split"] or parsed["style"]
    add("Property type", ptype)
    add("Style", style)
    add("Storeys", parsed["storeys"])
    add("Title", parsed["title"])
    add("Age", parsed["age"])
    add("Annual taxes", parsed["taxes"])
    parking = parsed["parking_type"] or ""
    parking = parking.replace("Attached Garage, Garage", "Attached garage").replace("Detached Garage, Garage", "Detached garage").replace("No Garage", "No garage")
    add("Parking", parking, f"{parsed['parking_spaces']} total parking spaces" if parsed["parking_spaces"] else "")
    add("Heating", parsed["heating"])
    add("Cooling", parsed["cooling"])
    add("Water", parsed["water"])
    add("Sewer", parsed["sewer"])
    add("Zoning", parsed["zoning"])
    base_note = parsed["basement_features"]
    add("Basement", parsed["basement_type"], base_note or "")
    add("Foundation", parsed["foundation"])
    add("Exterior", parsed["exterior"])
    add("Flooring", parsed["flooring"])
    if parsed["fireplace"]:
        add("Fireplaces", parsed["fireplace"])
    add("Structures", parsed["structures"])
    if parsed["pool"]:
        add("Pool", ", ".join(p for p in [parsed["pool"], parsed["pool_features"]] if p))
    if parsed["hydro"]:
        add("Backup power", parsed["hydro"])
    add("Fencing", parsed["fencing"])
    add("View", parsed["view"])
    add("Access", parsed["access"])
    add("Nearby", parsed["nearby"])
    if parsed["community_features"]:
        add("Community", parsed["community_features"])
    add("Cross streets", parsed["cross"])
    add("Community", meta["community"])
    # Community added twice if community_features used the label. Fix label.
    if parsed["community_features"]:
        for fact in facts:
            if fact["label"] == "Community" and fact["value"] == parsed["community_features"]:
                fact["label"] = "Community features"
    return facts


def install_photos(meta, parsed):
    slug = meta["slug"]
    dest = IMG / slug
    if dest.exists():
        for old in dest.iterdir():
            if old.is_file():
                old.unlink()
    dest.mkdir(parents=True, exist_ok=True)
    sources = []
    mode = meta["photo_mode"]
    if mode in {"drive", "drive-plus-realtor-landscape"}:
        import zipfile
        with zipfile.ZipFile(meta["zip"]) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith((".jpg", ".jpeg")) and not n.startswith("__MACOSX")]
            names.sort(key=lambda n: int(re.search(r"(\d+)\.jpe?g$", n, re.I).group(1)))
            # 1787 starts at 00 (aerial). The front exterior is 01. Hero is the front.
            if meta["slug"] == "1787-champlain-road-tiny" and len(names) > 1 and names[0].rstrip("/").endswith("00.jpg"):
                names[0], names[1] = names[1], names[0]
            for n in names:
                sources.append(("drive", zf.read(n), n))
    if mode in {"realtor", "drive-plus-realtor-landscape"}:
        urls = []
        seen = set()
        for url in parsed["imgs"]:
            name = url.split("/")[-1]
            if name in seen or "cdn.realtor.ca/listings" not in url:
                continue
            seen.add(name)
            urls.append(url)
        urls.sort(key=lambda u: int(re.search(r"_(\d+)\.", u).group(1)))
        for url in urls:
            req = urllib.request.Request(url, headers={"Referer": "https://www.realtor.ca/", "User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                blob = resp.read()
            if mode == "drive-plus-realtor-landscape":
                from io import BytesIO
                with Image.open(BytesIO(blob)) as im:
                    w, h = im.size
                if w < h:
                    continue
            sources.append(("realtor", blob, url))
    photos = []
    from io import BytesIO
    hero = None
    for i, (origin, blob, ref) in enumerate(sources, start=1):
        filename = f"{i:02d}.jpg"
        path = dest / filename
        path.write_bytes(blob)
        with Image.open(BytesIO(blob)) as im:
            w, h = im.size
            if hero is None:
                hero = im.convert("RGB")
        alt = f"Front exterior at {meta['address']}" if i == 1 and mode != "realtor" else f"Photo {i} at {meta['address']}"
        if i == 1 and mode == "realtor":
            alt = f"Photo 1 at {meta['address']}"
        photos.append({"src": f"/assets/img/listings/{slug}/{filename}", "w": w, "h": h, "alt": alt, "origin": origin})
    og = dest / "og-1200x630.jpg"
    if hero is not None:
        target_w, target_h = 1200, 630
        scale = max(target_w / hero.width, target_h / hero.height)
        resized = hero.resize((int(hero.width * scale), int(hero.height * scale)), Image.Resampling.LANCZOS)
        left = (resized.width - target_w) // 2
        top = (resized.height - target_h) // 2
        resized.crop((left, top, left + target_w, top + target_h)).save(og, "JPEG", quality=86, optimize=True)
    manifest = {
        "slug": slug,
        "source": mode,
        "hero": "01.jpg",
        "files": [Path(p["src"]).name for p in photos],
        "swap": "Replace the numbered jpgs in this folder. 01.jpg is the hero. Then rerun scripts/build_newsletter_listings.py.",
    }
    (dest / "photos.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return photos


def e(value):
    return html.escape(value or "", quote=True)


def listed_line(agents):
    parts = []
    for name, role in agents:
        parts.append(f"{name}, {role}" if role else name)
    if len(parts) == 1:
        return f"Listed by {parts[0]}, {COURTESY}"
    return f"Listed by {parts[0]}, and {parts[1]}, {COURTESY}"


def page_html(meta, parsed, photos):
    slug = meta["slug"]
    canonical = f"https://jonathanwallace.ca/listings/{slug}"
    full_address = f"{meta['address']}, {meta['locality']}, Ontario {meta['postal']}"
    place = f"{meta['locality']}, Ontario {meta['postal']}"
    if meta["locality"] == "Tay":
        place = f"{meta['region_name']}, Ontario {meta['postal']}"
    title = f"{meta['address']}, {meta['locality']} | {parsed['price']}"
    desc = summary_for(meta, parsed)
    if len(desc) > 170:
        desc = desc[:167].rsplit(" ", 1)[0] + "."
    hero = photos[0]
    og = f"https://jonathanwallace.ca/assets/img/listings/{slug}/og-1200x630.jpg"
    facts = facts_for(meta, parsed)
    photo_json = json.dumps([{"src": p["src"], "w": p["w"], "h": p["h"], "alt": p["alt"]} for p in photos], indent=2)
    a1 = urllib.parse.quote(f"{meta['address']}, {meta['region_name']}, ON")
    sms = urllib.parse.quote(f"Hi Jonathan, I would like to book a showing at {meta['address']} in {meta['region_name']}. MLS {parsed['mls']}.")
    calendly = f"https://calendly.com/jonathan-faristeam/private-showing-request?a1={a1}"
    price_num = re.sub(r"[^0-9]", "", parsed["price"])
    bed_num = 0
    if parsed["beds_note"]:
        nums = [int(n) for n in re.findall(r"\d+", parsed["beds"])]
        bed_num = sum(nums) if nums else 0
    else:
        m = re.search(r"\d+", parsed["beds"])
        bed_num = int(m.group(0)) if m else 0
    bath_num = int(parsed["baths"])
    schema = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": f"{meta['address']}, {meta['locality']}",
        "url": canonical,
        "description": desc,
        "image": og,
        "offers": {"@type": "Offer", "price": price_num, "priceCurrency": "CAD"},
        "address": {
            "@type": "PostalAddress",
            "streetAddress": meta["address"],
            "addressLocality": meta["locality"],
            "addressRegion": "ON",
            "postalCode": meta["postal"],
            "addressCountry": "CA",
        },
        "broker": {"@id": "https://jonathanwallace.ca/#agent"},
    }
    if bed_num:
        schema["numberOfBedrooms"] = bed_num
    if bath_num:
        schema["numberOfBathroomsTotal"] = bath_num

    fact_html = []
    for fact in facts:
        note = f"<span>{e(fact['note'])}</span>" if fact["note"] else ""
        fact_html.append(f'      <div class="fact"><dt>{e(fact["label"])}</dt><dd>{e(fact["value"])}{note}</dd></div>')
    room_rows = "\n".join(
        f'        <tr><td>{e(r["level"])}</td><td>{e(r["room"])}</td><td>{e(r["size"])}</td></tr>' for r in parsed["rooms"]
    )
    desc_html = "\n      ".join(f"<p>{e(p)}</p>" for p in parsed["paras"])
    appliances = ""
    if parsed["appliances"] or parsed["rental"]:
        items = "\n      ".join(f"<li>{e(a)}</li>" for a in parsed["appliances"])
        rental = f"<p>Rental equipment: {e(parsed['rental'])}.</p>" if parsed["rental"] else ""
        appliances = f'''
<section class="section section--sand">
  <div class="wrap">
    <p class="eyebrow">Included</p>
    <h2>Appliances</h2>
    <ul class="listing-appliances">
      {items}
    </ul>
    {rental}
  </div>
</section>'''
    media = ""
    if meta.get("media"):
        links = "\n      ".join(
            f'<li><a class="btn btn--ghost" href="{e(href)}" target="_blank" rel="noopener">{e(label)}</a></li>'
            for label, href in meta["media"]
        )
        media = f'''
<section class="section">
  <div class="wrap">
    <p class="eyebrow">See it yourself</p>
    <h2>Video, 360° tour, floor plan, and feature book</h2>
    <ul class="listing-media">
      {links}
    </ul>
  </div>
</section>'''
    rooms_section = ""
    if parsed["rooms"]:
        rooms_section = f'''
<section class="section">
  <div class="wrap">
    <p class="eyebrow">Room sizes</p>
    <h2>Rooms</h2>
    <table class="rooms">
      <thead>
        <tr><th scope="col">Level</th><th scope="col">Room</th><th scope="col">Size</th></tr>
      </thead>
      <tbody>
{room_rows}
      </tbody>
    </table>
  </div>
</section>'''
    staging = ""
    if parsed["staging"]:
        staging = "<p>Some photos are virtually staged to show the potential of the home.</p>"
    ga_addr = e(full_address)
    ga_mls = e(parsed["mls"])
    return f'''<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-P36FJB8L');</script>
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(hero["alt"])}">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="Jonathan Wallace, Your Georgian Bay Specialist">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{og}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="/assets/css/listing.css">
<link rel="preload" as="image" href="{e(hero["src"])}">
<script type="application/ld+json">
{json.dumps(schema, indent=2)}
</script>
</head>
<body class="listing-page">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P36FJB8L" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<header class="site-header">
  <div class="wrap nav">
    <div class="brand"><a href="/"><span class="brand__name">Jonathan Wallace</span><span class="brand__tag">Your Georgian Bay Specialist</span></a></div>
    <nav><ul class="nav__links" id="navLinks">
      <li><a href="/sell.html">Sell</a></li><li><a href="/buy.html">Buy</a></li><li><a href="/home-tours.html">Home Tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/resources">Resources</a></li><li><a href="/blog.html">Blog</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li>
      <li class="nav__cta"><a class="btn btn--primary" href="/home-value.html">Price My Home</a></li>
    </ul></nav>
    <button class="nav__toggle" id="navToggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>

<div class="gallery" id="gallery" tabindex="0" aria-roledescription="carousel" aria-label="Photos of {e(meta["address"])}, {e(meta["locality"])}">
  <div class="gallery__stage" id="galleryStage">
    <img id="galleryImg" src="{e(hero["src"])}" width="{hero["w"]}" height="{hero["h"]}" alt="{e(hero["alt"])}" fetchpriority="high" draggable="false">
  </div>
  <div class="gallery__tools">
    <button type="button" class="gallery__nav" id="galleryPrev">Previous</button>
    <p class="gallery__count" id="galleryCount" aria-live="polite">1 of {len(photos)}</p>
    <button type="button" class="gallery__nav" id="galleryNext">Next</button>
  </div>
  <p class="gallery__hint">Swipe the photo, tap either side, or choose a thumbnail.</p>
  <div class="gallery__thumbs" id="galleryThumbs"></div>
</div>
<script type="application/json" id="listing-photos">
{photo_json}
</script>

<section class="section section--sand">
  <div class="wrap">
    <p class="eyebrow listing-kicker">{e(meta["community"])}</p>
    <h1 class="listing-address">{e(meta["address"])}</h1>
    <p class="listing-place">{e(place)}</p>
    <p class="listing-price">{e(parsed["price"])}</p>
    <p class="listing-mls">MLS® {e(parsed["mls"])}</p>
    <p class="listing-summary">{e(summary_for(meta, parsed))}</p>
    <p class="listing-courtesy">Listing courtesy of {COURTESY}</p>
    <p class="listing-realtor"><a href="{e(parsed["realtor_url"])}" target="_blank" rel="noopener">View on REALTOR.ca</a></p>
    <div class="stack-actions">
      <a class="btn btn--primary btn--lg" href="#book" data-ga4="book_showing" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Book a showing</a>
      <a class="btn btn--ghost btn--lg listing-call" href="tel:{PHONE_TEL}" data-ga4="click_to_call" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}"><span class="listing-call__wide">Call or text</span><span class="listing-call__narrow">Call</span></a>
      <a class="btn btn--ghost btn--lg listing-sms" href="sms:{PHONE_TEL}?body={sms}" data-ga4="click_to_text" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Text</a>
    </div>
  </div>
</section>
{media}
<section class="section">
  <div class="wrap">
    <p class="eyebrow">Key facts</p>
    <h2>The details</h2>
    <dl class="facts">
{chr(10).join(fact_html)}
    </dl>
  </div>
</section>

<section class="section section--sand">
  <div class="wrap">
    <p class="eyebrow">MLS® description</p>
    <h2>In the listing's words</h2>
    <div class="listing-desc" id="mls-description">
      {desc_html}
    </div>
  </div>
</section>
{rooms_section}
{appliances}
<section class="section section--sand" id="book">
  <div class="wrap" style="max-width:760px;">
    <p class="eyebrow">Showings</p>
    <h2>Book a showing</h2>
    <a class="btn btn--primary btn--lg btn--block" href="{calendly}" target="_blank" rel="noopener" data-cta="calendly-showing" data-ga4="calendly_showing" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Book a showing time</a>
    <p class="book-note">Pick a time that works for you. I just need to confirm it with the sellers, and I'll get back to you right away.</p>
    <p class="book-form-lead">Rather not pick a time? Send me a note and I'll reach out.</p>
    <form class="form" name="showing-request" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you.html">
      <input type="hidden" name="form-name" value="showing-request">
      <input type="hidden" name="address" value="{e(full_address)}">
      <input type="hidden" name="mls" value="{e(parsed["mls"])}">
      <input type="hidden" name="topic" value="Buying a home">
      <input type="hidden" name="source_page" value="/listings/{slug}">
      <p class="hp"><label>Don't fill this out: <input name="bot-field"></label></p>
      <div class="field"><label for="showing-name">Name</label><input id="showing-name" name="name" autocomplete="name" required></div>
      <div class="form__row">
        <div class="field"><label for="showing-email">Email</label><input id="showing-email" type="email" name="email" autocomplete="email" required></div>
        <div class="field"><label for="showing-phone">Phone</label><input id="showing-phone" type="tel" name="phone" autocomplete="tel" required></div>
      </div>
      <div class="field"><label for="showing-times">Preferred times</label><textarea id="showing-times" name="preferred_times" rows="4" required placeholder="A couple of days and times that work for you"></textarea></div>
      <label class="consent"><input type="checkbox" name="casl_consent" value="yes" required> <span>I agree to be contacted by Jonathan Wallace about this showing, and I can unsubscribe anytime. (CASL)</span></label>
      <button class="btn btn--primary btn--block btn--lg" type="submit" data-ga4="book_showing" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Request a showing</button>
      <p class="form__note">{BYLINE}. 531 King St, Midland, ON L4R 3N6.</p>
    </form>
  </div>
</section>

<section class="section">
  <div class="wrap listing-disclosure">
    <p class="eyebrow">Disclosure</p>
    <h2>Listing information</h2>
    <p>{e(listed_line(meta["agents"]))}</p>
    <p>{BYLINE}</p>
    <p>Listing courtesy of {COURTESY}</p>
    <p>MLS® {e(parsed["mls"])}</p>
    {staging}
    <p><a href="{e(parsed["realtor_url"])}" target="_blank" rel="noopener">View on REALTOR.ca</a></p>
    <p>Information is deemed reliable but not guaranteed. Listing data courtesy of the MLS® System (Toronto Regional Real Estate Board).</p>
    <p>REALTOR®, MLS® and the associated logos are trademarks owned by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. Not intended to solicit properties already listed for sale or buyers/sellers under contract.</p>
  </div>
</section>

<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <span class="brand__name">Jonathan Wallace</span>
      <p style="margin-top:12px;">Georgian Bay real estate. Midland, Penetanguishene, Tiny, Tay &amp; Wasaga Beach.</p>
      <div class="footer__social">
        <a href="https://youtube.com/@jonathanwallaceRE" aria-label="YouTube" target="_blank" rel="noopener">YT</a>
        <a href="https://instagram.com/jonathanwallacerealestate" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
        <a href="https://www.linkedin.com/in/jonathanwallacerealestate" aria-label="LinkedIn" target="_blank" rel="noopener">in</a>
      </div>
    </div>
    <div><h4>Explore</h4><ul><li><a href="/listings">Listings</a></li><li><a href="/sell.html">Sell your home</a></li><li><a href="/buy.html">Buy a home</a></li><li><a href="/home-tours.html">Home tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/home-value.html">Home value</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/blog.html">Blog</a></li><li><a href="/weekly">Weekly market hub</a></li><li><a href="/resources">Free guides</a></li><li><a href="/vendors">Verified Vendors</a></li></ul></div>
    <div>
      <h4>Get in touch</h4>
      <ul>
        <li><a href="tel:{PHONE_TEL}">{PHONE_DISP}</a></li>
        <li><a href="mailto:jonathan@faristeam.ca">Email Jonathan</a></li>
        <li>Midland, Ontario</li>
      </ul>
    </div>
    <div>
      <h4>Prefer to call?</h4>
      <p style="font-size:.9rem;">I answer my own phone.</p>
      <a class="btn btn--primary" href="tel:{PHONE_TEL}" data-ga4="click_to_call" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Call or text</a>
    </div>
  </div>
  <div class="wrap footer__legal">
    <p><strong>Jonathan Wallace, REALTOR®</strong> · Faris Team Real Estate, Brokerage</p>
    <p>REALTOR®, MLS® and the associated logos are trademarks owned by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. Not intended to solicit properties already listed for sale or buyers/sellers under contract.</p>
    <p>© <span id="year">2026</span> Jonathan Wallace. All rights reserved. · <a href="/privacy.html">Privacy Policy</a></p>
  </div>
</footer>

<div class="listing-bar" role="region" aria-label="Contact about this listing">
  <div class="listing-bar__inner">
    <a class="btn btn--primary" href="{calendly}" target="_blank" rel="noopener" data-cta="calendly-showing" data-ga4="calendly_showing" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Book a showing</a>
    <a class="btn btn--bar listing-call" href="tel:{PHONE_TEL}" data-ga4="click_to_call" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}"><span class="listing-call__wide">Call or text</span><span class="listing-call__narrow">Call</span></a>
    <a class="btn btn--bar listing-sms" href="sms:{PHONE_TEL}?body={sms}" data-ga4="click_to_text" data-listing-address="{ga_addr}" data-listing-mls="{ga_mls}">Text</a>
  </div>
</div>
<script src="/assets/js/main.js"></script>
<script src="/assets/js/listing.js"></script>
</body>
</html>
'''


def card(item, featured=False):
    cls = "listing-hero" if featured else "listing-card"
    return f'''<a class="{cls}" href="/listings/{e(item["slug"])}">
  <img src="{e(item["hero"])}" alt="{e(item["alt"])}" width="{item["w"]}" height="{item["h"]}">
  <div class="{cls}__body">
    <p class="eyebrow">{e(item["kicker"])}</p>
    <h2>{e(item["address"])}</h2>
    <p class="listing-card__place">{e(item["place"])}</p>
    <p class="listing-card__price">{e(item["price"])}</p>
    <p class="listing-card__meta">{e(item["beds"])} bd · {e(item["baths"])} ba</p>
    <p>{e(item["summary"])}</p>
    <span class="btn btn--primary">View this home</span>
  </div>
</a>'''


def index_html(cards_data):
    featured = cards_data[0]
    rest = "\n".join(card(item) for item in cards_data[1:])
    hero_card = card(featured, featured=True)
    urls = [{"@type": "ListItem", "position": i + 1, "url": f"https://jonathanwallace.ca/listings/{item['slug']}", "name": item["address"]} for i, item in enumerate(cards_data)]
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Homes for sale",
        "url": "https://jonathanwallace.ca/listings",
        "description": "Current Georgian Bay listings from Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage.",
        "isPartOf": {"@id": "https://jonathanwallace.ca/#agent"},
        "mainEntity": {"@type": "ItemList", "itemListElement": urls},
    }
    return f'''<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-P36FJB8L');</script>
<title>Homes for sale | Jonathan Wallace</title>
<meta name="description" content="Current homes for sale with Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage. Midland, Penetanguishene, Tiny and Tay.">
<link rel="canonical" href="https://jonathanwallace.ca/listings">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jonathanwallace.ca/listings">
<meta property="og:title" content="Homes for sale | Jonathan Wallace">
<meta property="og:description" content="Current homes for sale with Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage. Midland, Penetanguishene, Tiny and Tay.">
<meta property="og:image" content="https://jonathanwallace.ca/assets/img/listings/20-rue-eric-tiny/og-1200x630.jpg">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="Jonathan Wallace, Your Georgian Bay Specialist">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Homes for sale | Jonathan Wallace">
<meta name="twitter:description" content="Current homes for sale with Jonathan Wallace, Realtor with Faris Team Real Estate Brokerage.">
<meta name="twitter:image" content="https://jonathanwallace.ca/assets/img/listings/20-rue-eric-tiny/og-1200x630.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="/assets/css/listing.css">
<script type="application/ld+json">
{json.dumps(schema, indent=2)}
</script>
</head>
<body class="listing-page listing-index">
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P36FJB8L" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<header class="site-header">
  <div class="wrap nav">
    <div class="brand"><a href="/"><span class="brand__name">Jonathan Wallace</span><span class="brand__tag">Your Georgian Bay Specialist</span></a></div>
    <nav><ul class="nav__links" id="navLinks">
      <li><a href="/sell.html">Sell</a></li><li><a href="/buy.html">Buy</a></li><li><a href="/home-tours.html">Home Tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/resources">Resources</a></li><li><a href="/blog.html">Blog</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li>
      <li class="nav__cta"><a class="btn btn--primary" href="/home-value.html">Price My Home</a></li>
    </ul></nav>
    <button class="nav__toggle" id="navToggle" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>

<section class="section section--sand">
  <div class="wrap">
    <p class="eyebrow">Georgian Bay</p>
    <h1>Homes for sale</h1>
    <p class="listing-summary">Twelve homes from this week's notes. Open one for the photos, the facts, and a showing with Jonathan.</p>
    <p class="eyebrow">Featured this week</p>
    {hero_card}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <p class="eyebrow">All listings</p>
    <h2>The rest of the list</h2>
    <div class="listing-grid">
      {rest}
    </div>
  </div>
</section>

<section class="section section--sand" id="book">
  <div class="wrap" style="max-width:760px;">
    <p class="eyebrow">Showings</p>
    <h2>Ask Jonathan about a showing</h2>
    <p>Tell me which home you want to see. I will confirm the time with the seller and get back to you.</p>
    <a class="btn btn--primary btn--lg btn--block" href="tel:{PHONE_TEL}">Call or text {PHONE_DISP}</a>
    <p class="book-form-lead">Or send a note.</p>
    <form class="form" name="showing-request" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you.html">
      <input type="hidden" name="form-name" value="showing-request">
      <input type="hidden" name="address" value="Listings index">
      <input type="hidden" name="mls" value="">
      <input type="hidden" name="topic" value="Buying a home">
      <input type="hidden" name="source_page" value="/listings">
      <p class="hp"><label>Don't fill this out: <input name="bot-field"></label></p>
      <div class="field"><label for="showing-name">Name</label><input id="showing-name" name="name" autocomplete="name" required></div>
      <div class="form__row">
        <div class="field"><label for="showing-email">Email</label><input id="showing-email" type="email" name="email" autocomplete="email" required></div>
        <div class="field"><label for="showing-phone">Phone</label><input id="showing-phone" type="tel" name="phone" autocomplete="tel" required></div>
      </div>
      <div class="field"><label for="showing-times">Which home, and when works</label><textarea id="showing-times" name="preferred_times" rows="4" required></textarea></div>
      <label class="consent"><input type="checkbox" name="casl_consent" value="yes" required> <span>I agree to be contacted by Jonathan Wallace about this showing, and I can unsubscribe anytime. (CASL)</span></label>
      <button class="btn btn--primary btn--block btn--lg" type="submit">Request a showing</button>
      <p class="form__note">{BYLINE}. 531 King St, Midland, ON L4R 3N6.</p>
    </form>
  </div>
</section>

<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <span class="brand__name">Jonathan Wallace</span>
      <p style="margin-top:12px;">Georgian Bay real estate. Midland, Penetanguishene, Tiny, Tay &amp; Wasaga Beach.</p>
      <div class="footer__social">
        <a href="https://youtube.com/@jonathanwallaceRE" aria-label="YouTube" target="_blank" rel="noopener">YT</a>
        <a href="https://instagram.com/jonathanwallacerealestate" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
        <a href="https://www.linkedin.com/in/jonathanwallacerealestate" aria-label="LinkedIn" target="_blank" rel="noopener">in</a>
      </div>
    </div>
    <div><h4>Explore</h4><ul><li><a href="/listings">Listings</a></li><li><a href="/sell.html">Sell your home</a></li><li><a href="/buy.html">Buy a home</a></li><li><a href="/home-tours.html">Home tours</a></li><li><a href="/communities.html">Communities</a></li><li><a href="/home-value.html">Home value</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li></ul></div>
    <div>
      <h4>Get in touch</h4>
      <ul>
        <li><a href="tel:{PHONE_TEL}">{PHONE_DISP}</a></li>
        <li><a href="mailto:jonathan@faristeam.ca">Email Jonathan</a></li>
        <li>Midland, Ontario</li>
      </ul>
    </div>
    <div>
      <h4>Prefer to call?</h4>
      <p style="font-size:.9rem;">I answer my own phone.</p>
      <a class="btn btn--primary" href="tel:{PHONE_TEL}">Call or text</a>
    </div>
  </div>
  <div class="wrap footer__legal">
    <p><strong>Jonathan Wallace, REALTOR®</strong> · Faris Team Real Estate, Brokerage</p>
    <p>REALTOR®, MLS® and the associated logos are trademarks owned by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. Not intended to solicit properties already listed for sale or buyers/sellers under contract.</p>
    <p>© <span id="year">2026</span> Jonathan Wallace. All rights reserved. · <a href="/privacy.html">Privacy Policy</a></p>
  </div>
</footer>
<div class="listing-bar" role="region" aria-label="Contact Jonathan">
  <div class="listing-bar__inner">
    <a class="btn btn--primary" href="#book">Request a showing</a>
    <a class="btn btn--bar listing-call" href="tel:{PHONE_TEL}"><span class="listing-call__wide">Call or text</span><span class="listing-call__narrow">Call</span></a>
    <a class="btn btn--bar listing-sms" href="sms:{PHONE_TEL}">Text</a>
  </div>
</div>
<script src="/assets/js/main.js"></script>
</body>
</html>
'''


def main():
    import urllib.parse  # noqa: F401 used in page_html via global? 
    # page_html uses urllib.parse. Ensure import at module level.
    DATA.mkdir(parents=True, exist_ok=True)
    cards = []
    built = []
    for meta in LISTINGS:
        print("build", meta["slug"], flush=True)
        parsed = parse_listing(meta)
        photos = install_photos(meta, parsed)
        record = {
            "slug": meta["slug"],
            "address": meta["address"],
            "community": meta["community"],
            "price": parsed["price"],
            "mls": parsed["mls"],
            "realtorUrl": parsed["realtor_url"],
            "courtesy": f"Listing courtesy of {COURTESY}",
            "photoSource": meta["photo_mode"],
            "photoCount": len(photos),
            "missing": meta.get("missing", []),
            "summary": summary_for(meta, parsed),
        }
        (DATA / f"{meta['slug']}.json").write_text(json.dumps(record, indent=2) + "\n")
        html_out = page_html(meta, parsed, photos)
        if "\u2014" in html_out or "\u2013" in html_out:
            raise SystemExit(f"dash found in {meta['slug']}")
        if "Sales Representative" in html_out or "Salesperson" in html_out:
            raise SystemExit(f"title leak in {meta['slug']}")
        (ROOT / "listings" / f"{meta['slug']}.html").write_text(html_out)
        place = f"{meta['locality']}, Ontario {meta['postal']}"
        if meta["locality"] == "Tay":
            place = f"{meta['region_name']}, Ontario {meta['postal']}"
        cards.append({
            "slug": meta["slug"],
            "address": meta["address"],
            "place": place,
            "kicker": meta["community"],
            "price": parsed["price"],
            "beds": parsed["beds"],
            "baths": parsed["baths"],
            "summary": summary_for(meta, parsed),
            "hero": photos[0]["src"],
            "alt": photos[0]["alt"],
            "w": photos[0]["w"],
            "h": photos[0]["h"],
        })
        built.append(record)
        print(" ", parsed["price"], parsed["mls"], len(photos), "photos", flush=True)

    # Insert 1555 in the user's order, before 375 Champlain.
    idx = next(i for i, c in enumerate(cards) if c["slug"] == "375-champlain-road-penetanguishene")
    from PIL import Image as PILImage
    hero_path = ROOT / EXISTING_1555["hero"].lstrip("/")
    with PILImage.open(hero_path) as im:
        w, h = im.size
    cards.insert(idx, {
        "slug": EXISTING_1555["slug"],
        "address": EXISTING_1555["address"],
        "place": f"{EXISTING_1555['locality']}, Ontario {EXISTING_1555['postal']}",
        "kicker": EXISTING_1555["community"],
        "price": EXISTING_1555["price"],
        "beds": EXISTING_1555["beds"],
        "baths": EXISTING_1555["baths"],
        "summary": EXISTING_1555["summary"],
        "hero": EXISTING_1555["hero"],
        "alt": "Front exterior at 1555 Baseline Road South",
        "w": w,
        "h": h,
    })
    (ROOT / "listings" / "index.html").write_text(index_html(cards))
    (DATA / "_built.json").write_text(json.dumps(built, indent=2) + "\n")
    print("pages", len(cards))


if __name__ == "__main__":
    import urllib.parse
    main()
