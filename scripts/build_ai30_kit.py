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
        "The formatted Letter of Opinion file is not in this folder yet. The handout for Make the Letter of Opinion Yours has the prompt and the steps.",
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
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.writestr(path, files[path])
    print(f"wrote {zip_path} ({len(files)} files)")


if __name__ == "__main__":
    main()
