import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PENDING,
  UNKNOWN,
  adaptRealmFile,
  applyConfirmedLinks,
  bandPrice,
  basementLabel,
  canShowAggregates,
  canShowRecords,
  cardModel,
  classifyBasement,
  classifyShoreline,
  compareYears,
  frontageLabel,
  inArchive,
  inSoldStats,
  lightboxReduce,
  mean,
  median,
  normalizePhotos,
  outcomeCards,
  parseExactSqft,
  parseFlexibleDate,
  pctChange,
  periodEnd,
  priceBand,
  resolveFrontage,
  summarizeSold,
  viewModel
} from "./waterfront-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function row(overrides) {
  return {
    mls: "MLS-TEST-1",
    status: "sold",
    cohortYear: 2026,
    eventDate: "2026-06-01",
    town: "Tiny",
    address: "1 Example Lane, Tiny",
    soldPrice: 900000,
    finalAskingPrice: 950000,
    startingPrice: null,
    listingDom: 10,
    officialCdom: null,
    historyValidated: false,
    derivedActiveExposure: null,
    beds: null,
    baths: null,
    aboveGradeSqft: null,
    belowGradeSqft: null,
    garage: { yes: "unknown", type: null },
    basement: { finish: "unknown", extent: null, crawlSpace: "unknown", raw: null },
    yearBuilt: null,
    ageRange: null,
    frontage: resolveFrontage({}),
    lotDimensionsRaw: null,
    lotAreaRaw: null,
    shorelineClass: "direct",
    shorelineNote: "Source type is direct. That is not a title opinion of private shoreline.",
    island: "unverified",
    photos: [],
    link: null,
    ...overrides
  };
}

test("price bands are non-overlapping and use the stated edges", () => {
  assert.equal(priceBand(669999.99), "out-of-window");
  assert.equal(priceBand(670000), "670-1500");
  assert.equal(priceBand(1499999.99), "670-1500");
  assert.equal(priceBand(1500000), "1500-2300");
  assert.equal(priceBand(2299999.99), "1500-2300");
  assert.equal(priceBand(2300000), "2300-3000");
  assert.equal(priceBand(3000000), "2300-3000");
  assert.equal(priceBand(3000000.01), "out-of-window");
  assert.equal(priceBand(null), "unknown");
});

test("sold rows use the sold price and expired or terminated rows use final asking", () => {
  const sold = bandPrice(row({ status: "sold", soldPrice: 1500000, finalAskingPrice: 670000 }));
  const expired = bandPrice(row({ status: "expired", soldPrice: 2300000, finalAskingPrice: 680000 }));
  const terminated = bandPrice(row({ status: "terminated", soldPrice: 2300000, finalAskingPrice: 3000000 }));
  assert.deepEqual(sold, { amount: 1500000, basis: "sold", label: "Sold price" });
  assert.equal(priceBand(sold.amount), "1500-2300");
  assert.equal(expired.label, "Final asking price");
  assert.equal(priceBand(expired.amount), "670-1500");
  assert.equal(terminated.basis, "final-asking");
  assert.equal(priceBand(terminated.amount), "2300-3000");
});

test("frontage bands keep the edges and refuse conflicts, metres, and lot frontage", () => {
  const feet = (verifiedFeet) => resolveFrontage({ rawUnit: "ft", feetVerified: true, verifiedFeet, unitConflict: false });
  assert.equal(feet(0).band, "below-40");
  assert.equal(feet(39.99).band, "below-40");
  assert.equal(feet(40).band, "40-60");
  assert.equal(feet(59.99).band, "40-60");
  assert.equal(feet(60).band, "60-100");
  assert.equal(feet(99.99).band, "60-100");
  assert.equal(feet(100).band, "100-150");
  assert.equal(feet(149.99).band, "100-150");
  assert.equal(feet(150).band, "150-200");
  assert.equal(feet(199.99).band, "150-200");
  assert.equal(feet(200).band, "200-plus");
  assert.equal(feet(480).band, "200-plus");

  const conflict = resolveFrontage({ rawUnit: "m", rawValue: 61, feetVerified: true, verifiedFeet: 61, unitConflict: true });
  assert.equal(conflict.band, "unresolved");
  assert.equal(conflict.normalizedFeet, null);

  const metres = resolveFrontage({ rawUnit: "Metres", rawValue: 25, feetVerified: false, verifiedFeet: 82.02 });
  assert.equal(metres.band, "unknown");
  assert.equal(metres.bandBasis, "metric_not_converted");
  assert.equal(metres.normalizedFeet, null);

  const claimedFeetButMetricUnit = resolveFrontage({ rawUnit: "m", feetVerified: true, verifiedFeet: 80, unitConflict: false });
  assert.equal(claimedFeetButMetricUnit.normalizedFeet, null);
  assert.equal(claimedFeetButMetricUnit.band, "unknown");
});

test("mean, median, and percent change stay null instead of inventing a baseline", () => {
  assert.equal(mean([]), null);
  assert.equal(median([]), null);
  assert.equal(mean([2, 4, 9]), 5);
  assert.equal(median([1, 2, 3]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(pctChange(0, 5), null);
  assert.equal(pctChange(null, 5), null);
  assert.equal(pctChange(200, 150), -25);
  assert.equal(pctChange(8, 10), 25);
});

test("sold stats dedupe the same MLS id and do not treat a mean change as a value index", () => {
  const records = [
    row({ mls: "MLS-A", soldPrice: 800000, eventDate: "2025-02-01", cohortYear: 2025 }),
    row({ mls: "MLS-A", soldPrice: 800000, eventDate: "2025-02-01", cohortYear: 2025 }),
    row({ mls: "MLS-B", soldPrice: 1200000, eventDate: "2025-03-01", cohortYear: 2025 }),
    row({ mls: "MLS-C", soldPrice: 3100000, eventDate: "2025-04-01", cohortYear: 2025 })
  ];
  const stats = summarizeSold(records, { period: "matched", years: [2025], town: "all" });
  assert.equal(stats.n, 2);
  assert.equal(stats.duplicateMlsDropped, 1);
  assert.equal(stats.mean, 1000000);
  assert.equal(stats.median, 1000000);
  assert.equal(stats.bands["670-1500"].count, 2);
  assert.equal(stats.bands["670-1500"].share, 1);
  assert.equal(stats.isHomeValueIndex, false);
  assert.equal(stats.likeForLikeValueChange, false);
  assert.equal(stats.exposure.officialCdom, null);
  assert.equal(stats.exposure.derivedActiveExposure, null);
  assert.equal(stats.exposure.listingDom.median, 10);
});

test("listing DOM, official CDOM, and derived exposure stay separate", () => {
  const ready = [
    row({ mls: "MLS-1", listingDom: 4, officialCdom: 40, historyValidated: true, derivedActiveExposure: 90 }),
    row({ mls: "MLS-2", listingDom: 6, officialCdom: 20, historyValidated: true, derivedActiveExposure: 30 })
  ];
  const exposure = summarizeSold(ready, { years: [2026], period: "matched" }).exposure;
  assert.equal(exposure.listingDom.mean, 5);
  assert.equal(exposure.officialCdom.mean, 30);
  assert.equal(exposure.derivedActiveExposure.mean, 60);

  const incomplete = [
    row({ mls: "MLS-1", listingDom: 4, officialCdom: 40 }),
    row({ mls: "MLS-2", listingDom: null, officialCdom: null })
  ];
  const hidden = summarizeSold(incomplete, { years: [2026], period: "matched" }).exposure;
  assert.equal(hidden.listingDom, null);
  assert.equal(hidden.officialCdom, null);
  assert.equal(hidden.derivedActiveExposure, null);
});

test("matched dates stop on November 7 and 2026 does not grow a full year", () => {
  assert.equal(periodEnd(2025, "matched"), "2025-11-07");
  assert.equal(periodEnd(2025, "full"), "2025-12-31");
  assert.equal(periodEnd(2026, "matched"), "2026-11-07");
  assert.equal(periodEnd(2026, "full"), "2026-11-07");

  const late = row({ status: "expired", eventDate: "2025-12-31", cohortYear: 2025, finalAskingPrice: 700000, soldPrice: null });
  assert.equal(inArchive(late, { year: "2025", period: "matched" }), false);
  assert.equal(inArchive(late, { year: "2025", period: "full" }), true);

  const edge = row({ eventDate: "2025-11-07", cohortYear: 2025 });
  const next = row({ eventDate: "2025-11-08", cohortYear: 2025 });
  assert.equal(inSoldStats(edge, { years: [2025], period: "matched" }), true);
  assert.equal(inSoldStats(next, { years: [2025], period: "matched" }), false);

  const afterCutoff = row({ eventDate: "2026-11-08" });
  assert.equal(inSoldStats(afterCutoff, { years: [2026], period: "full" }), false);
  assert.equal(inSoldStats(row({ eventDate: "2026-11-07" }), { years: [2026], period: "full" }), true);
});

test("unknown terminated dates stay out of sold math and are not replaced by a later update", () => {
  const adapted = adaptRealmFile({
    terminated_records: [{
      mls: "MLS-TER",
      status: "TER",
      address: "9 Example Road, Tay",
      lastAsk_exact: 780000,
      termination_event_date: null,
      lastUpdate: "2026-01-01",
      listing_expiry_date: "2026-02-01",
      dom: 12,
      photo_count: 22
    }]
  }, 2026);
  const record = adapted.records[0];
  assert.equal(record.eventDate, null);
  assert.equal(record.finalAskingPrice, 780000);
  assert.equal(inArchive(record, { year: "2026", period: "matched" }), true);
  assert.equal(inSoldStats(record, { years: [2026], period: "matched" }), false);
  assert.equal(summarizeSold(adapted.records, { years: [2026] }).n, 0);
  const card = cardModel(record);
  assert.match(card.history.join(" "), /terminated date is unknown/i);
  assert.equal(card.photoLabel, "No photos");
  assert.equal(card.photos.length, 0);
});

test("expired and sold rows stay separate until a link is confirmed", () => {
  const expired = row({
    mls: "MLS-EXP",
    status: "expired",
    eventDate: "2026-03-01",
    soldPrice: null,
    finalAskingPrice: 990000,
    link: { propertyId: "1 example lane", confidence: "address_candidate" }
  });
  const sold = row({
    mls: "MLS-SLD",
    status: "sold",
    eventDate: "2026-05-01",
    soldPrice: 970000,
    link: { propertyId: "1 example lane", confidence: "address_candidate" }
  });
  assert.equal(outcomeCards([expired, sold]).length, 2);
  assert.equal(outcomeCards([expired, sold]).every((item) => item.countsAsUnsoldProperty === false), true);

  const confirmed = applyConfirmedLinks([expired, sold], [{ propertyId: "parcel-1", mls: ["MLS-EXP", "MLS-SLD"] }]);
  const outcomes = outcomeCards(confirmed);
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].collapsed, true);
  assert.equal(outcomes[0].outcomeStatus, "sold");
  assert.equal(outcomes[0].countsAsUnsoldProperty, false);
  assert.equal(summarizeSold(confirmed, { years: [2026], period: "matched" }).n, 1);
  const expiredCard = cardModel(confirmed[0], confirmed);
  assert.match(expiredCard.history.join(" "), /Linked sold listing MLS-SLD/);
  assert.match(expiredCard.history.join(" "), /not, by itself, a property that never sold/);
});

test("comparison percent changes are null when a year has no sales, and they are not a value index", () => {
  const records = [
    row({ mls: "MLS-25", cohortYear: 2025, eventDate: "2025-04-02", soldPrice: 1000000, town: "Midland", address: "2 Example Ave, Midland" }),
    row({ mls: "MLS-26", cohortYear: 2026, eventDate: "2026-04-02", soldPrice: 800000, town: "Tay", address: "3 Example Ave, Tay" })
  ];
  const compared = compareYears(records, { period: "matched", shoreline: "all" });
  assert.equal(compared.likeForLikeValueChange, false);
  assert.equal(compared.isHomeValueIndex, false);
  assert.equal(compared.towns.Midland.y2026.n, 0);
  assert.equal(compared.towns.Midland.countChangePct, -100);
  assert.equal(compared.towns.Midland.meanChangePct, null);
  assert.equal(compared.towns.Tay.y2025.n, 0);
  assert.equal(compared.towns.Tay.countChangePct, null);
  assert.equal(compared.towns.all.meanChangePct, -20);
  assert.equal(compared.towns.all.matchedPair, true);
  const full = compareYears(records, { period: "full" });
  assert.equal(full.towns.all.matchedPair, false);
  assert.match(full.note, /not matched/);
});

test("shoreline classes stay separate and a condo marked direct is shared", () => {
  assert.equal(classifyShoreline({ waterfrontType: "Direct" }).shorelineClass, "direct");
  assert.equal(classifyShoreline({ waterfrontType: "Indirect", cardFacts: "Condo" }).shorelineClass, "indirect");
  assert.equal(classifyShoreline({ waterfrontType: "Direct", cardFacts: "2 Beds Condo Apartment" }).shorelineClass, "shared");
  assert.equal(classifyShoreline({ waterfrontType: "Direct", cardFacts: "sqftCondo Townhouse2-Storey" }).shorelineClass, "shared");
  assert.equal(classifyShoreline({ waterfrontType: "Indirect", cardFacts: "sqftCondo AptApartment" }).shorelineClass, "indirect");
  assert.equal(classifyShoreline({ waterfrontType: "Shared" }).shorelineClass, "shared");
  assert.equal(classifyShoreline({}).shorelineClass, "unknown");
  assert.match(classifyShoreline({ waterfrontType: "Direct" }).shorelineNote, /not a title opinion/);

  const direct = row({ shorelineClass: "direct" });
  const shared = row({ mls: "MLS-SH", shorelineClass: "shared" });
  const indirect = row({ mls: "MLS-IN", shorelineClass: "indirect" });
  const visible = [direct, shared, indirect].filter((record) => inArchive(record, { shoreline: "indirect" }));
  assert.deepEqual(visible.map((record) => record.mls), ["MLS-IN"]);
});

test("partial basement finish is not called finished, and missing measures stay unknown", () => {
  assert.equal(classifyBasement("Finished / Partially Finished").finish, "partial");
  assert.equal(classifyBasement("Unfinished / Partial Basement").finish, "unfinished");
  assert.equal(classifyBasement("Unfinished / Partial Basement").extent, "partial");
  assert.equal(classifyBasement("Crawl Space").finish, "unknown");
  assert.equal(classifyBasement("Crawl Space").crawlSpace, "yes");
  assert.equal(basementLabel(classifyBasement("Finished")), "Finished");
  assert.equal(basementLabel(classifyBasement(null)), UNKNOWN);
  assert.equal(parseExactSqft("3500-5000"), null);
  assert.equal(parseExactSqft("2,288"), 2288);
  assert.equal(parseExactSqft(null), null);
});

test("adapter keeps raw frontage, ignores lot frontage, and does not copy remarks or urls", () => {
  const adapted = adaptRealmFile({
    records: [{
      mls: "MLS-SOLD",
      status: "SLD",
      soldDate: "5/22/2026",
      address: "4 Example Cres, Penetanguishene",
      dom: 8,
      cardFacts: "3 Beds Condo",
      sold_price_exact: 1400000,
      list_price_on_sold_record_exact: 1500000,
      photo_count: 40,
      detail_url: "https://example.invalid/private",
      waterfront_evidence_from_client_remarks: "private remark should not be copied"
    }],
    sold_property_details: [{
      mls: "MLS-SOLD",
      waterfront_type_field: "Direct",
      water_frontage_label: "Water Frontage (M)",
      water_frontage_as_shown: "25",
      water_frontage_unit_as_shown: "Meters",
      waterfrontage_band_status: "metric_source_not_converted_to_feet",
      lot_size_as_shown: "200 x 200 Feet",
      above_grade_finished_sqft: "1800",
      below_grade_finished_sqft: null,
      basement_as_shown: "Partially Finished",
      garage_yes_no: "No",
      year_built_exact: "1998",
      waterfront_evidence_from_client_remarks: "do not publish this sentence"
    }],
    expired_records: [{
      mls: "MLS-LATE",
      status: "EXP",
      address: "5 Example Cres, Midland",
      expiryDate: "12/31/2025",
      lastUpdate: "1/1/2026",
      lastAsk_exact: 1100000,
      photo_count: 3
    }],
    cross_status_campaigns: [{
      normalized_address_key: "5 example cres",
      episodes: [{ mls: "MLS-LATE" }, { mls: "MLS-SOLD" }]
    }]
  }, 2026);

  const sold = adapted.records.find((record) => record.mls === "MLS-SOLD");
  const expired = adapted.records.find((record) => record.mls === "MLS-LATE");
  assert.equal(sold.town, "Penetanguishene");
  assert.equal(sold.shorelineClass, "shared");
  assert.equal(sold.frontage.normalizedFeet, null);
  assert.equal(sold.frontage.bandBasis, "metric_not_converted");
  assert.equal(sold.frontage.rawValue, "25");
  assert.equal(sold.lotDimensionsRaw, "200 x 200 Feet");
  assert.equal(sold.aboveGradeSqft, 1800);
  assert.equal(sold.belowGradeSqft, null);
  assert.equal(sold.basement.finish, "partial");
  assert.equal(sold.garage.yes, "no");
  assert.equal(sold.yearBuilt, 1998);
  assert.equal(sold.startingPrice, null);
  assert.equal(sold.eventDate, "2026-05-22");
  assert.equal(sold.photos.length, 0);
  assert.equal(sold.sourcePhotoCount, 40);
  assert.equal(sold.link.confidence, "address_candidate");
  assert.equal(expired.eventDate, "2025-12-31");
  assert.equal(expired.cohortYear, 2026);
  const packed = JSON.stringify(adapted);
  assert.equal(packed.includes("do not publish"), false);
  assert.equal(packed.includes("example.invalid"), false);
  assert.match(frontageLabel(sold.frontage), /Not converted to feet/);
  const card = cardModel(sold);
  assert.equal(card.facts.find((fact) => fact[0] === "Bedrooms")[1], UNKNOWN);
  assert.equal(card.facts.find((fact) => fact[0] === "Finished below ground")[1], UNKNOWN);
  assert.equal(card.facts.find((fact) => fact[0] === "Starting price")[1], UNKNOWN);
  assert.equal(card.photoLabel, "No photos");
});

test("photos cap at 10 real sources and drop blanks and duplicates", () => {
  const photos = normalizePhotos([
    null,
    { src: "" },
    { src: "a.jpg", alt: "one" },
    { src: "a.jpg", alt: "repeat" },
    ...Array.from({ length: 12 }, (_, index) => ({ src: `p${index}.jpg`, alt: "" }))
  ]);
  assert.equal(photos.length, 10);
  assert.equal(photos[0].src, "a.jpg");
  assert.equal(new Set(photos.map((photo) => photo.src)).size, 10);
});

test("the public release file stays gated and an empty flagged file is not zero sales", () => {
  const dataset = JSON.parse(fs.readFileSync(path.join(root, "content/waterfront/public-release.json"), "utf8"));
  assert.equal(dataset.records.length, 0);
  assert.equal(dataset.aggregates, null);
  assert.equal(canShowRecords(dataset), false);
  assert.equal(canShowAggregates(dataset), false);
  const view = viewModel(dataset, { year: "2026", period: "matched" });
  assert.equal(view.gated, true);
  assert.equal(view.comparison, null);
  assert.deepEqual(view.records, []);
  assert.equal(view.emptyReason, "pending");

  const flaggedEmpty = {
    publication: {
      validationStatus: "released",
      recordsClearedForPublicDisplay: true,
      aggregatesCleared: true,
      marketComparisonValidated: true,
      coverageComplete: true,
      photoRightsCleared: true
    },
    records: []
  };
  assert.equal(viewModel(flaggedEmpty).emptyReason, "pending");
  assert.equal(viewModel(flaggedEmpty).comparison, null);
});

test("records can be held back from totals, and photos stay off without photo clearance", () => {
  const records = [row({ photos: [{ src: "/photos/one.jpg", alt: "door" }, { src: "/photos/one.jpg", alt: "door again" }] })];
  const dataset = {
    publication: {
      validationStatus: "released",
      recordsClearedForPublicDisplay: true,
      aggregatesCleared: false,
      marketComparisonValidated: false,
      coverageComplete: false,
      photoRightsCleared: false
    },
    records
  };
  const view = viewModel(dataset, { period: "matched" });
  assert.equal(view.gated, false);
  assert.equal(view.comparison, null);
  assert.equal(view.photosAllowed, false);
  assert.equal(view.records[0].photos.length, 0);

  const withTotals = {
    ...dataset,
    publication: { ...dataset.publication, aggregatesCleared: true, marketComparisonValidated: true, coverageComplete: true, photoRightsCleared: true }
  };
  const released = viewModel(withTotals, { period: "matched", shoreline: "direct" });
  assert.equal(released.comparison.towns.all.y2026.n, 1);
  assert.equal(released.comparison.likeForLikeValueChange, false);
  assert.equal(released.records[0].photos.length, 1);
});

test("archive filters combine year, town, status, band, frontage, and shoreline", () => {
  const records = [
    row({ mls: "A", town: "Tiny", soldPrice: 700000, frontage: resolveFrontage({ rawUnit: "ft", feetVerified: true, verifiedFeet: 45 }), shorelineClass: "direct" }),
    row({ mls: "B", town: "Tay", soldPrice: 1600000, status: "sold", frontage: resolveFrontage({ rawUnit: "ft", feetVerified: true, verifiedFeet: 210 }), shorelineClass: "indirect" }),
    row({ mls: "C", status: "expired", soldPrice: null, finalAskingPrice: 900000, eventDate: "2026-01-15", frontage: resolveFrontage({ unitConflict: true, rawUnit: "m", rawValue: 10 }), shorelineClass: "shared" })
  ];
  assert.deepEqual(records.filter((record) => inArchive(record, { priceBand: "670-1500" })).map((record) => record.mls), ["A", "C"]);
  assert.deepEqual(records.filter((record) => inArchive(record, { frontage: "200-plus" })).map((record) => record.mls), ["B"]);
  assert.deepEqual(records.filter((record) => inArchive(record, { frontage: "unknown" })).map((record) => record.mls), ["C"]);
  assert.deepEqual(records.filter((record) => inArchive(record, { frontage: "below-40" })).map((record) => record.mls), []);
  assert.equal(inArchive(records[2], { status: "expired", town: "Tiny", shoreline: "shared" }), true);
});

test("lightbox keyboard actions wrap and close without inventing a frame", () => {
  assert.deepEqual(lightboxReduce({ index: 0, length: 0, open: false }, { type: "open" }), { index: 0, length: 0, open: false });
  let state = lightboxReduce({ index: 0, length: 3, open: false }, { type: "open" });
  state = lightboxReduce(state, { type: "prev" });
  assert.equal(state.index, 2);
  state = lightboxReduce(state, { type: "next" });
  assert.equal(state.index, 0);
  state = lightboxReduce(state, { type: "close" });
  assert.equal(state.open, false);
});

test("committed public files do not carry withheld candidate claims or raw listing extracts", () => {
  const files = [
    "blog-north-simcoe-waterfront.html",
    "content/waterfront/public-release.json",
    "assets/js/waterfront-model.mjs",
    "assets/js/waterfront-page.mjs",
    "assets/js/waterfront-model.test.mjs",
    "scripts/waterfront-adapt.mjs"
  ];
  const banned = [
    "10.38",
    "20.27",
    "1,494,684",
    "1,339,545",
    "1494684",
    "1339545",
    "163.16",
    "S12027846",
    "S12525204",
    "S12309465",
    "S12211897",
    "realmmlp.ca"
  ];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const isDenylist = file.endsWith("waterfront-model.test.mjs");
    if (!isDenylist) {
      for (const token of banned) {
        assert.equal(text.includes(token), false, `${file} contains ${token}`);
      }
      assert.equal(text.includes("\u2014"), false, `${file} contains an em dash`);
      assert.equal(text.includes("&mdash;"), false, `${file} contains an em dash entity`);
    }
  }
  const page = fs.readFileSync(path.join(root, "blog-north-simcoe-waterfront.html"), "utf8");
  assert.match(page, new RegExp(PENDING));
  assert.match(page, /noindex, nofollow/);
  assert.equal(page.includes("eval/188-old-mill-road"), false);
  const release = fs.readFileSync(path.join(root, "content/waterfront/public-release.json"), "utf8");
  assert.match(release, /"records": \[\]/);
});

test("date parsing rejects impossible dates and update-only strings", () => {
  assert.equal(parseFlexibleDate("5/22/2026"), "2026-05-22");
  assert.equal(parseFlexibleDate("2025-11-07"), "2025-11-07");
  assert.equal(parseFlexibleDate("13/40/2026"), null);
  assert.equal(parseFlexibleDate("unknown"), null);
  assert.equal(parseFlexibleDate(""), null);
});
