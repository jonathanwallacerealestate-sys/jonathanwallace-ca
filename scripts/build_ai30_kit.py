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
    # Two digits only, so a file manager sorts the lessons before forms.
    return f"{int(day['day']):02d} {safe_name(day['title'])}"


# Shared files sit in the lesson that introduces them. Prompts by Area
# is used across the lessons, so it sorts first and forms stay last.
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
        f"Time: About {day['minutes']}",
        "",
        day["why"],
        "",
        "Steps",
    ]
    for index, step in enumerate(day["steps"], start=1):
        lines.append(f"{index}. {step}")
    if day.get("tip"):
        lines.extend(["", f"Tip. {day['tip']}"])
    if day.get("optionalNote"):
        lines.extend(["", f"Optional. {day['optionalNote']}"])
    lines.extend(["", "Assignment", day["assignment"], "", "Prompts"])
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
        "Each lesson has its own folder, numbered so the folders stay in order. Forms are last.",
        "The Letter of Opinion kit, the client email template, and the sample letter are in 16 Make the Letter of Opinion Yours.",
        "The sample one-page Letter of Opinion is 16 Make the Letter of Opinion Yours/Letter-of-Opinion-123-Sample-Street-SAMPLE.pdf. The name, phone, email, office address, and brokerage on it are placeholders.",
        "The handout in that folder has the prompt and the steps.",
        "The Deal Card kit is in 20 Deal Card Setup.",
        "Prompts by Area is in 00 Prompts by Area.",
        "",
        "The forms folder is last. It has the listing masters, in your kit:",
        "- forms/Form_200_Listing_Agreement_master.pdf",
        "- forms/RECO_Information_Guide_master.pdf",
        "Faris Team brokerage details are already on them. Add your own name and work address when you fill them.",
        "",
        "Folders",
    ]
    files = {}
    seen = set()
    folders = {}
    for day in plan["days"]:
        name = safe_name(day["title"])
        if name in seen:
            raise SystemExit("duplicate skill file name: " + name)
        seen.add(name)
        folder = lesson_folder(day)
        folders[int(day["day"])] = folder
        files[f"{folder}/{name}.txt"] = handout(day)
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
            folder = "00 Prompts by Area"
        else:
            folder = folders[home]
        files[f"{folder}/{path.name}"] = blob
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
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.writestr(path, files[path])
    print(f"wrote {zip_path} ({len(files)} files)")


if __name__ == "__main__":
    main()
