# Recently Sold gallery intro

The homepage does not request `assets/data/recently-sold.json`. That file is not in the repo, and fetching it produced a 404 while the section stayed hidden.

When Jonathan has verified Faris Team sales to publish, add `assets/data/recently-sold.json` with real entries only, then restore the gallery. Each object in `sold[]` needs price, address, beds, baths, note and image. No invented sales, and no sold prices copied from anonymized case studies.
