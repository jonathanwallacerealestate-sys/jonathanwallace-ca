# Editing the bootcamp curriculum

Progress is stored by a permanent lesson id, not by the lesson's place in the list.

- Never change an id. Never reuse an id.
- The frozen list is `LEGACY_DAY_IDS` in `netlify/functions/_shared/ai30.mjs`. Leave that list in its original order.
- A new lesson gets a new id, appended to that list, and an entry in `ai-30-days/days.json`.
- Reordering `days.json` only changes which unfinished lesson shows next. Finished lessons stay finished. Points, completion times, and login streaks stay as they are.
- Removing a lesson takes it out of `days.json` only. Leave its id in `LEGACY_DAY_IDS`. Anyone who finished it keeps that completion and those points.
- Do not edit stored progress by hand.
