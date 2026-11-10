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


def handout(day):
    lines = [
        day["title"],
        "",
        f"Section: {day['section']}",
        f"About: {day['minutes']}",
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
        "The kits folder has the Letter of Opinion kit, the client email template, the Deal Card kit, and Prompts by Area.",
        "The sample one-page Letter of Opinion is kits/Letter-of-Opinion-123-Sample-Street-SAMPLE.pdf. The name, phone, email, office address, and brokerage on it are placeholders.",
        "The handout for Make the Letter of Opinion Yours has the prompt and the steps.",
        "",
        "Skills",
    ]
    files = {}
    seen = set()
    for day in plan["days"]:
        name = safe_name(day["title"])
        if name in seen:
            raise SystemExit("duplicate skill file name: " + name)
        seen.add(name)
        files[f"handouts/{name}.txt"] = handout(day)
        readme.append(f"- {day['title']}")
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
        files[f"kits/{path.name}"] = blob
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.writestr(path, files[path])
    print(f"wrote {zip_path} ({len(files)} files)")


if __name__ == "__main__":
    main()
