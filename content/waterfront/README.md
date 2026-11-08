# Waterfront comparison: internal notes

Not linked from the site. Do not copy listing identifiers, street addresses, or individual sale prices into the public page.

The draft page shows one source-defined sold comparison. It does not publish listing rows, photos, or official cumulative days on market. Search settings are not the control that keeps those records off the page. `content/waterfront/public-release.json` has an empty `records` array.

## Cohort on the draft page

REALM Waterfront Yes and Island No. Freehold and condo. Sold. Tiny, Penetanguishene, Midland, and Tay. Sold price $670,000 to $3,000,000. Sold dates January 1 through November 7 of 2025 and of 2026. As of November 7, 2026.

The set includes direct, shared, and indirect water access. It is not a private-shoreline study, not every mainland waterfront home, and not a same-home price index. Records with an unknown island value are outside the Island No set. Leaving them out does not prove they are on an island.

Checked totals, not recomputed from hidden rows: 19 sold listings in 2025 and 50 in 2026. Mean $1,494,684.21 to $1,339,545, down 10.38%. Median $1,505,000 to $1,200,000, down 20.27%. Price-band counts 9, 9, and 1, then 30, 16, and 4. Listing days on market, mean 44.21 to 52.98 and median 32 to 38. That clock is listing days, not official cumulative days on market.

Town figures are in `public-release.json`. Penetanguishene 2025 is one sale. A zero 2025 band does not produce an infinite percent change.

## What the November 7 live check closed

The 2025 full-year sold query was reloaded with the same filters and no hidden unavailable-date control. It matched the saved count. Midland-only matched the saved Midland count of four. November 8 through December 31, 2025 returned no sales, so the matched window and the full 2025 sold set are the same for this search.

A 2026 expired search with Island No, and the same search with that island filter removed, differ. Two expired rows that were missing from the Island No set have an unknown island field, not island yes. The wider set was not listed record by record.

A frontage field of zero is not a measured shore length. Those listings stay in the sold cohort and get no frontage band. Their street addresses stay out of the public page until historical display rights are cleared.

## Still closed to the public file

- Individual listing rows, photos, and histories
- Official cumulative days on market as a comparison
- Measured water frontage where the unit is metric, conflicting, or zero
- Expired and terminated rows treated as homes that failed to sell
- Merging an address that is only a possible match

Do not merge or deploy this draft from these notes. The menu, blog index, and sitemap stay unchanged.
