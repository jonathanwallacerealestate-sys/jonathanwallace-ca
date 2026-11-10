#!/usr/bin/env python3
"""Build ai-30-days/kit/ai-bootcamp-resources.zip from days.json.

Run this after editing the bootcamp lessons so the download stays in step
with the prompts on the page.
"""

import json
import re
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
plan_path = root / "ai-30-days" / "days.json"
zip_path = root / "ai-30-days" / "kit" / "ai-bootcamp-resources.zip"
lesson_zip_dir = root / "ai-30-days" / "kit" / "lessons"
source_dir = root / "ai-30-days" / "kit" / "source"
forms_dir = root / "ai-30-days" / "kit" / "forms"
FORM_FILES = (
    "Form_200_Listing_Agreement_master.pdf",
    "RECO_Information_Guide_master.pdf",
)
FORBIDDEN = (
    "Jonathan Wallace",
    "jonathan@faristeam.ca",
    "705-433-2525",
    "531 King Street",
    "Faris Team",
    "FarisTeam",
    "1gVOahhpWV00QdTg44BbqIaCOhjplNq1t",
    "30-Day-Checklist",
    "\u2014",
)


def safe_name(title):
    cleaned = re.sub(r"[^\w\s-]", "", title, flags=re.UNICODE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or "skill"


def lesson_folder(day):
    # The folder name is the lesson title, with no number in front.
    title = str(day["title"]).strip()
    if not title or re.search(r"[\\/\x00]", title):
        raise SystemExit("title cannot be a folder name: " + title)
    return title


# Shared files sit in the lesson that introduces them. Prompts by Area
# is used across the lessons, so those two files stay beside the read-me
# and do not add an extra folder.
KIT_HOME = {
    "Letter-of-Opinion-Kit.docx": 16,
    "Letter-of-Opinion-Kit.md": 16,
    "Letter-of-Opinion-Client-Email-Template.docx": 16,
    "Letter-of-Opinion-Client-Email-Template.md": 16,
    "Letter-of-Opinion-123-Sample-Street-SAMPLE.pdf": 16,
    "Deal-Card-Kit.docx": 20,
    "Deal-Card-Kit.md": 20,
    "Prompts-by-Area.docx": 0,
    "Prompts-by-Area.md": 0,
}


def handout(day):
    lines = [
        day["title"],
        "",
        f"Section: {day['section']}",
        f"Time: {day['minutes']}",
        "The more you teach it, the better it gets.",
        "",
        day["why"],
        "",
        "Steps",
    ]
    for index, step in enumerate(day["steps"], start=1):
        lines.append(f"{index}. {step}")
        for link in day.get("links") or []:
            if link.get("step") == index and str(link.get("href", "")).startswith("https://"):
                lines.append(f"   {link['label']}: {link['href']}")
    if day.get("tip"):
        lines.extend(["", f"Tip. {day['tip']}"])
    if day.get("optionalNote"):
        lines.extend(["", f"Optional. {day['optionalNote']}"])
    lines.extend(["", "Challenge", day["assignment"], "", "Prompts"])
    for prompt in day.get("prompts") or []:
        lines.extend(["", prompt, ""])
    if day.get("sample"):
        lines.extend(["Sample, made up", "", day["sample"], ""])
    text = "\n".join(lines).strip() + "\n"
    if "\u2014" in text:
        raise SystemExit("em dash in " + day["title"])
    return text


def main():
    plan = json.loads(plan_path.read_text())
    readme = [
        "AI Bootcamp: Zero to Hero",
        "",
        "Handouts and the copy-paste prompts for each skill.",
        "Open the handout for the skill you are on. The prompts are the words you paste into your AI.",
        "",
        "Each lesson has its own folder, named the same as the lesson. The forms folder is still there.",
        "The Letter of Opinion kit, the client email template, and the sample letter are in Make the Letter of Opinion Yours.",
        "The sample one-page Letter of Opinion is Make the Letter of Opinion Yours/Letter-of-Opinion-123-Sample-Street-SAMPLE.pdf. The name, phone, email, office address, and brokerage on it are placeholders.",
        "The handout in that folder has the prompt and the steps.",
        "The Deal Card kit is in Deal Card Setup.",
        "Prompts by Area sits next to this read-me.",
        "",
        "The forms folder has the listing masters, in your kit:",
        "- forms/Form_200_Listing_Agreement_master.pdf",
        "- forms/RECO_Information_Guide_master.pdf",
        "Faris Team brokerage details are already on them. Add your own name and work address when you fill them.",
        "",
        "Folders",
    ]
    files = {}
    lesson_packs = {}
    seen = set()
    folders = {}
    ids = {}
    for day in plan["days"]:
        lesson_id = str(day.get("id") or "")
        if not re.fullmatch(r"[a-z0-9-]+", lesson_id):
            raise SystemExit("lesson id must stay a lowercase slug: " + lesson_id)
        if lesson_id in ids.values():
            raise SystemExit("duplicate lesson id: " + lesson_id)
        name = safe_name(day["title"])
        if name in seen:
            raise SystemExit("duplicate skill file name: " + name)
        seen.add(name)
        folder = lesson_folder(day)
        number = int(day["day"])
        folders[number] = folder
        ids[number] = lesson_id
        handout_path = f"{folder}/{folder}.txt"
        files[handout_path] = handout(day)
        lesson_packs[lesson_id] = {handout_path: files[handout_path]}
        readme.append(f"- {folder}")
    readme_text = "\n".join(readme).strip() + "\n"
    if "\u2014" in readme_text:
        raise SystemExit("em dash in read me")
    files["read-me.txt"] = readme_text
    if not source_dir.is_dir():
        raise SystemExit("missing kit source folder")
    for path in sorted(source_dir.iterdir()):
        if not path.is_file():
            continue
        if "30-Day-Checklist" in path.name or "Bootcamp-Checklist" in path.name:
            raise SystemExit("checklist file must stay out of the kit: " + path.name)
        blob = path.read_bytes()
        for needle in FORBIDDEN:
            if needle.encode("utf-8") in blob:
                raise SystemExit(path.name + " still contains " + needle)
        home = KIT_HOME.get(path.name)
        if home is None:
            raise SystemExit("no lesson folder for kit file: " + path.name)
        if home == 0:
            files[path.name] = blob
            if path.name.startswith("Prompts-by-Area."):
                lesson_packs[ids[2]][f"{folders[2]}/{path.name}"] = blob
        else:
            packed = f"{folders[home]}/{path.name}"
            files[packed] = blob
            lesson_packs[ids[home]][packed] = blob
    if not forms_dir.is_dir():
        raise SystemExit("missing forms folder")
    for name in FORM_FILES:
        path = forms_dir / name
        if not path.is_file():
            raise SystemExit("missing form: " + name)
        blob = path.read_bytes()
        if not blob.startswith(b"%PDF"):
            raise SystemExit(name + " is not a PDF")
        for needle in ("Jonathan Wallace", "jonathan@faristeam.ca", "705-433-2525"):
            if needle.encode("utf-8") in blob:
                raise SystemExit(name + " still contains " + needle)
        files[f"forms/{name}"] = blob
        lesson_packs[ids[23]][f"forms/{name}"] = blob
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.writestr(path, files[path])
    lesson_zip_dir.mkdir(parents=True, exist_ok=True)
    for stale in lesson_zip_dir.glob("*.zip"):
        if stale.stem not in lesson_packs:
            stale.unlink()
    for lesson_id, pack in lesson_packs.items():
        out = lesson_zip_dir / f"{lesson_id}.zip"
        ordered = sorted(pack, key=lambda item: (item.startswith("forms/"), item))
        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in ordered:
                archive.writestr(path, pack[path])
    print(f"wrote {zip_path} ({len(files)} files) and {len(lesson_packs)} lesson zips")


if __name__ == "__main__":
    main()
