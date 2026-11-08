/**
 * North Simcoe waterfront archive.
 * Pure functions for bands, filters, sold-price math, and listing-vs-outcome links.
 * This module does not fetch MLS files and does not decide that a dataset is public.
 * Public rendering must go through viewModel(), which returns no rows and no totals
 * unless every release flag is set. An empty result is pending, not a market of zero.
 */

export const TOWNS = ["Tiny", "Penetanguishene", "Midland", "Tay"];
export const AS_OF = "2026-11-07";
export const PRICE_MIN = 670000;
export const PRICE_MAX = 3000000;
export const PENDING = "Pending review";
export const UNKNOWN = "Unknown";

export const PRICE_BANDS = [
  { id: "670-1500", label: "$670,000 to under $1,500,000", min: 670000, max: 1500000, maxInclusive: false },
  { id: "1500-2300", label: "$1,500,000 to under $2,300,000", min: 1500000, max: 2300000, maxInclusive: false },
  { id: "2300-3000", label: "$2,300,000 to $3,000,000", min: 2300000, max: 3000000, maxInclusive: true }
];

export const FRONTAGE_BANDS = [
  { id: "below-40", label: "Under 40 ft", min: 0, max: 40, maxInclusive: false },
  { id: "40-60", label: "40 to under 60 ft", min: 40, max: 60, maxInclusive: false },
  { id: "60-100", label: "60 to under 100 ft", min: 60, max: 100, maxInclusive: false },
  { id: "100-150", label: "100 to under 150 ft", min: 100, max: 150, maxInclusive: false },
  { id: "150-200", label: "150 to under 200 ft", min: 150, max: 200, maxInclusive: false },
  { id: "200-plus", label: "200 ft and over", min: 200, max: Infinity, maxInclusive: true }
];

export function parseFlexibleDate(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || /unknown|pending/i.test(s)) return null;
  let iso = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = s;
  else {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!m) return null;
    iso = `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return iso;
}

export function periodEnd(year, mode) {
  const y = Number(year);
  if (y === 2026) return "2026-11-07";
  if (mode === "full") return `${y}-12-31`;
  return `${y}-11-07`;
}

export function inScopeAmount(amount) {
  return Number.isFinite(amount) && amount >= PRICE_MIN && amount <= PRICE_MAX;
}

export function priceBand(amount) {
  if (!Number.isFinite(amount)) return "unknown";
  for (const band of PRICE_BANDS) {
    if (amount >= band.min && (band.maxInclusive ? amount <= band.max : amount < band.max)) return band.id;
  }
  return "out-of-window";
}

export function bandPrice(record) {
  if (!record) return { amount: null, basis: "unknown", label: "Price unknown" };
  if (record.status === "sold") {
    return { amount: finiteOrNull(record.soldPrice), basis: "sold", label: "Sold price" };
  }
  if (record.status === "expired" || record.status === "terminated") {
    return { amount: finiteOrNull(record.finalAskingPrice), basis: "final-asking", label: "Final asking price" };
  }
  return { amount: null, basis: "unknown", label: "Price unknown" };
}

export function frontageBandFromVerifiedFeet(feet) {
  if (!Number.isFinite(feet) || feet < 0) return "unknown";
  for (const band of FRONTAGE_BANDS) {
    const upperOk = band.maxInclusive ? feet <= band.max : feet < band.max;
    if (feet >= band.min && upperOk) return band.id;
  }
  return "unknown";
}

export function normalizeUnit(unit) {
  const s = String(unit || "").trim().toLowerCase();
  if (!s) return null;
  if (/^(ft|feet|foot)\b/.test(s)) return "ft";
  if (/^(m|metre|meter|metres|meters)\b/.test(s)) return "m";
  return "other";
}

/**
 * Verified feet bands require an explicit feet verification flag, a feet unit,
 * and no unit conflict. Metres are never converted. A conflict is not assigned
 * by checking whether metres and feet look close.
 */
export function resolveFrontage(input) {
  const src = input || {};
  const unit = normalizeUnit(src.rawUnit);
  const conflict = src.unitConflict === true;
  const verified = src.feetVerified === true
    && !conflict
    && unit === "ft"
    && Number.isFinite(src.verifiedFeet);
  let band = "unknown";
  let bandBasis = "unknown";
  if (conflict) {
    band = "unresolved";
    bandBasis = "unresolved_unit_conflict";
  } else if (verified) {
    band = frontageBandFromVerifiedFeet(src.verifiedFeet);
    bandBasis = "verified_feet";
  } else if (unit === "m") {
    bandBasis = "metric_not_converted";
  }
  return {
    rawLabel: src.rawLabel ?? null,
    rawValue: src.rawValue ?? null,
    rawUnit: src.rawUnit ?? null,
    followingText: src.followingText ?? null,
    normalizedFeet: verified ? src.verifiedFeet : null,
    band,
    bandBasis
  };
}

export function frontageMatches(record, filter) {
  if (!filter || filter === "all") return true;
  const band = record?.frontage?.band || "unknown";
  if (filter === "unknown") return band === "unknown" || band === "unresolved";
  return band === filter;
}

export function classifyShoreline({ waterfrontType, cardFacts, propertyClass } = {}) {
  const type = String(waterfrontType || "").trim().toLowerCase();
  const blob = `${propertyClass || ""} ${cardFacts || ""}`;
  const condo = /condo/i.test(blob) || String(propertyClass || "").toUpperCase() === "CONDO";
  if (type === "indirect") {
    return {
      shorelineClass: "indirect",
      shorelineNote: "Source type is indirect. Indirect access is not direct shoreline."
    };
  }
  if (type === "shared" || condo) {
    return {
      shorelineClass: "shared",
      shorelineNote: condo && type === "direct"
        ? "Source type said direct and the property is a condo. Classed as shared. Direct is not a private title finding."
        : "Shared waterfront. This is not exclusive shoreline."
    };
  }
  if (type === "direct") {
    return {
      shorelineClass: "direct",
      shorelineNote: "Source type is direct. That is not a title opinion of private shoreline."
    };
  }
  return {
    shorelineClass: "unknown",
    shorelineNote: "Shoreline class is unknown. A waterfront yes flag is not a class."
  };
}

export function classifyBasement(text) {
  if (text == null || String(text).trim() === "") {
    return { finish: "unknown", extent: null, crawlSpace: "unknown", raw: null };
  }
  const raw = String(text).trim();
  if (/^none$/i.test(raw)) return { finish: "none", extent: null, crawlSpace: "no", raw };
  const partialFinish = /partially finished|partial finish/i.test(raw);
  const finished = /\bfinished\b/i.test(raw);
  const unfinished = /\bunfinished\b/i.test(raw);
  let finish = "unknown";
  if (partialFinish || (finished && unfinished)) finish = "partial";
  else if (finished) finish = "finished";
  else if (unfinished) finish = "unfinished";
  const extent = /partial basement/i.test(raw) ? "partial" : (/\bfull\b/i.test(raw) ? "full" : null);
  return {
    finish,
    extent,
    crawlSpace: /crawl/i.test(raw) ? "yes" : "no",
    raw
  };
}

export function classifyGarage(yesNo, type) {
  const answer = String(yesNo || "").trim().toLowerCase();
  if (answer === "yes") return { yes: "yes", type: type || null };
  if (answer === "no" || /^none$/i.test(String(type || ""))) return { yes: "no", type: type || null };
  if (yesNo == null && type == null) return { yes: "unknown", type: null };
  return { yes: "unknown", type: type || null };
}

export function parseExactSqft(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (!/^[\d,]+(\.\d+)?$/.test(raw)) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function townFromAddress(address) {
  if (!address) return "unknown";
  const last = String(address).split(",").pop().trim().toLowerCase().replace(/\s+/g, " ");
  const map = {
    tiny: "Tiny",
    "tiny township": "Tiny",
    penetanguishene: "Penetanguishene",
    midland: "Midland",
    tay: "Tay",
    "tay township": "Tay"
  };
  return map[last] || "unknown";
}

export function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  const out = [];
  const seen = new Set();
  for (const photo of photos) {
    if (!photo || typeof photo.src !== "string" || !photo.src.trim()) continue;
    if (seen.has(photo.src)) continue;
    seen.add(photo.src);
    out.push({ src: photo.src, alt: photo.alt || "" });
    if (out.length === 10) break;
  }
  return out;
}

export function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/** A zero baseline is undefined, not infinite growth. */
export function pctChange(from, to) {
  if (from == null || to == null) return null;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from === 0) return null;
  return ((to - from) / from) * 100;
}

export function inArchive(record, filters = {}) {
  if (!record) return false;
  const price = bandPrice(record);
  if (Number.isFinite(price.amount) && !inScopeAmount(price.amount)) return false;
  if (record.island === "yes") return false;

  if (filters.year && filters.year !== "all") {
    const knownYear = record.eventDate ? record.eventDate.slice(0, 4) : null;
    const year = knownYear || (record.cohortYear == null ? "" : String(record.cohortYear));
    if (year !== String(filters.year)) return false;
  }

  if (filters.period === "matched" || filters.period === "full") {
    if (record.eventDate) {
      const year = Number(record.eventDate.slice(0, 4));
      const end = periodEnd(year, filters.period === "full" ? "full" : "matched");
      if (record.eventDate < `${year}-01-01` || record.eventDate > end) return false;
    }
  }

  if (filters.town && filters.town !== "all" && record.town !== filters.town) return false;
  if (filters.status && filters.status !== "all" && record.status !== filters.status) return false;
  if (filters.priceBand && filters.priceBand !== "all" && priceBand(price.amount) !== filters.priceBand) return false;
  if (!frontageMatches(record, filters.frontage)) return false;
  if (filters.shoreline && filters.shoreline !== "all" && record.shorelineClass !== filters.shoreline) return false;
  return true;
}

export function inSoldStats(record, filters = {}) {
  if (!record || record.status !== "sold") return false;
  if (!Number.isFinite(record.soldPrice) || !inScopeAmount(record.soldPrice)) return false;
  if (!record.eventDate) return false;
  const year = Number(record.eventDate.slice(0, 4));
  if (filters.years && !filters.years.map(Number).includes(year)) return false;
  const end = periodEnd(year, filters.period === "full" ? "full" : "matched");
  if (record.eventDate < `${year}-01-01` || record.eventDate > end) return false;
  if (filters.town && filters.town !== "all" && record.town !== filters.town) return false;
  if (filters.shoreline && filters.shoreline !== "all" && record.shorelineClass !== filters.shoreline) return false;
  return true;
}

export function uniqueByMls(records) {
  const seen = new Set();
  const rows = [];
  let duplicateMls = 0;
  for (const record of records) {
    if (record.mls && seen.has(record.mls)) {
      duplicateMls += 1;
      continue;
    }
    if (record.mls) seen.add(record.mls);
    rows.push(record);
  }
  return { rows, duplicateMls };
}

function exposureSummary(rows) {
  const listingReady = rows.length > 0 && rows.every((row) => Number.isFinite(row.listingDom) && row.listingDom >= 0);
  const officialReady = rows.length > 0 && rows.every((row) => Number.isFinite(row.officialCdom) && row.officialCdom >= 0);
  const derivedReady = rows.length > 0 && rows.every((row) => row.historyValidated === true && Number.isFinite(row.derivedActiveExposure) && row.derivedActiveExposure >= 0);
  const listingValues = rows.map((row) => row.listingDom);
  return {
    listingDom: listingReady
      ? { n: rows.length, mean: mean(listingValues), median: median(listingValues), basis: "listing-dom" }
      : null,
    officialCdom: officialReady
      ? { n: rows.length, mean: mean(rows.map((row) => row.officialCdom)), median: median(rows.map((row) => row.officialCdom)), basis: "official-cdom" }
      : null,
    derivedActiveExposure: derivedReady
      ? { n: rows.length, mean: mean(rows.map((row) => row.derivedActiveExposure)), median: median(rows.map((row) => row.derivedActiveExposure)), basis: "derived-linked-history" }
      : null
  };
}

export function summarizeSold(records, filters = {}) {
  const matched = (records || []).filter((record) => inSoldStats(record, filters));
  const { rows, duplicateMls } = uniqueByMls(matched);
  const prices = rows.map((row) => row.soldPrice);
  const n = prices.length;
  const bands = {};
  for (const band of PRICE_BANDS) bands[band.id] = { count: 0, share: n ? 0 : null };
  for (const price of prices) {
    const id = priceBand(price);
    if (bands[id]) bands[id].count += 1;
  }
  if (n) {
    for (const id of Object.keys(bands)) bands[id].share = bands[id].count / n;
  }
  return {
    n,
    mean: mean(prices),
    median: median(prices),
    bands,
    duplicateMlsDropped: duplicateMls,
    exposure: exposureSummary(rows),
    isHomeValueIndex: false,
    likeForLikeValueChange: false,
    smallN: n > 0 && n < 10
  };
}

export function compareYears(records, filters = {}) {
  const period = filters.period === "full" ? "full" : "matched";
  const shoreline = filters.shoreline || "all";
  const towns = {};
  for (const town of ["all", ...TOWNS]) {
    const y2025 = summarizeSold(records, { period, years: [2025], town, shoreline });
    const y2026 = summarizeSold(records, { period, years: [2026], town, shoreline });
    const bandShifts = {};
    for (const band of PRICE_BANDS) {
      const left = y2025.bands[band.id];
      const right = y2026.bands[band.id];
      bandShifts[band.id] = {
        countChangePct: pctChange(left.count, right.count),
        shareChangePoints: left.share == null || right.share == null ? null : (right.share - left.share) * 100
      };
    }
    towns[town] = {
      y2025,
      y2026,
      countChangePct: pctChange(y2025.n, y2026.n),
      meanChangePct: pctChange(y2025.mean, y2026.mean),
      medianChangePct: pctChange(y2025.median, y2026.median),
      bandShifts,
      likeForLikeValueChange: false,
      isHomeValueIndex: false,
      matchedPair: period === "matched"
    };
  }
  return {
    period,
    shoreline,
    asOf: AS_OF,
    towns,
    likeForLikeValueChange: false,
    isHomeValueIndex: false,
    note: period === "matched"
      ? "Both years use January 1 through November 7. 2026 is year to date."
      : "2025 uses the full year. 2026 still ends November 7, so this pair is not matched."
  };
}

export function outcomeCards(records) {
  const groups = new Map();
  const order = [];
  (records || []).forEach((record, index) => {
    const confirmed = record.link && record.link.confidence === "confirmed" && record.link.propertyId;
    const key = confirmed ? `c:${record.link.propertyId}` : `row:${record.mls || index}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(record);
  });
  return order.map((key) => {
    const episodes = groups.get(key);
    const confirmed = key.startsWith("c:");
    const sold = episodes
      .filter((episode) => episode.status === "sold" && episode.eventDate)
      .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));
    const primary = sold[0] || [...episodes].sort((a, b) => ((b.eventDate || "") > (a.eventDate || "") ? 1 : -1))[0];
    return {
      key,
      episodes,
      confidence: confirmed ? "confirmed" : (episodes[0].link?.confidence || "unlinked"),
      primary,
      outcomeStatus: sold.length ? "sold" : primary.status,
      countsAsUnsoldProperty: false,
      collapsed: confirmed && episodes.length > 1
    };
  });
}

export function applyConfirmedLinks(records, groups) {
  const map = new Map();
  for (const group of groups || []) {
    for (const mls of group.mls || []) map.set(mls, group.propertyId);
  }
  return (records || []).map((record) => (
    map.has(record.mls)
      ? { ...record, link: { propertyId: map.get(record.mls), confidence: "confirmed" } }
      : record
  ));
}

export function lightboxReduce(state, action) {
  const length = state?.length || 0;
  if (!length) return { index: 0, length: 0, open: false };
  if (action.type === "open") return { index: 0, length, open: true };
  if (action.type === "close") return { ...state, length, open: false };
  if (action.type === "next") return { ...state, length, open: true, index: (state.index + 1) % length };
  if (action.type === "prev") return { ...state, length, open: true, index: (state.index - 1 + length) % length };
  return state;
}

export function canShowRecords(dataset) {
  const publication = dataset?.publication;
  return Boolean(
    publication
    && publication.recordsClearedForPublicDisplay === true
    && publication.validationStatus === "released"
    && Array.isArray(dataset.records)
    && dataset.records.length > 0
  );
}

export function canShowAggregates(dataset) {
  const publication = dataset?.publication;
  const overall = dataset?.aggregates?.towns?.all;
  return Boolean(
    publication
    && publication.aggregatesCleared === true
    && publication.marketComparisonValidated === true
    && overall
    && overall.y2025
    && overall.y2026
  );
}

export function viewModel(dataset, filters = {}) {
  const photosAllowed = dataset?.publication?.photoRightsCleared === true;
  const published = canShowAggregates(dataset) ? dataset.aggregates : null;
  if (!canShowRecords(dataset)) {
    return {
      gated: true,
      records: [],
      outcomes: [],
      comparison: published,
      photosAllowed: false,
      emptyReason: "pending"
    };
  }
  const records = dataset.records.map((record) => ({
    ...record,
    photos: photosAllowed ? normalizePhotos(record.photos) : []
  }));
  const visible = records.filter((record) => inArchive(record, filters));
  const mode = filters.view === "outcomes" ? "outcomes" : "listings";
  const publication = dataset.publication || {};
  const computed = publication.aggregatesCleared === true && publication.marketComparisonValidated === true
    ? compareYears(records, { period: filters.period || "matched", shoreline: filters.compareShoreline || filters.shoreline || "all" })
    : null;
  return {
    gated: false,
    records: visible,
    outcomes: outcomeCards(visible),
    mode,
    comparison: published || computed,
    photosAllowed,
    emptyReason: visible.length ? null : "no-match"
  };
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function numberOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && /^[\d.]+$/.test(value.trim())) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function statusFromRaw(status) {
  const value = String(status || "").toUpperCase();
  if (value === "SLD" || value === "SOLD") return "sold";
  if (value === "EXP" || value === "EXPIRED") return "expired";
  if (value === "TER" || value === "TERMINATED") return "terminated";
  return "unknown";
}

function frontageFromRaw(row, detail) {
  const src = detail || {};
  const status = String(src.waterfrontage_band_status || row.waterfrontage_band_status || "");
  const label = src.water_frontage_label || src.water_frontage_label_as_shown || row.water_frontage_label_as_shown || null;
  const unit = src.water_frontage_unit_as_shown || row.water_frontage_following_text_as_shown || null;
  const value = src.water_frontage_as_shown ?? row.water_frontage_value_as_shown ?? null;
  const numeric = numberOrNull(value);
  return resolveFrontage({
    rawLabel: label,
    rawValue: value ?? null,
    rawUnit: unit,
    followingText: row.water_frontage_following_text_as_shown || null,
    unitConflict: /conflict/i.test(status),
    feetVerified: status === "feet_verified_no_conflict",
    verifiedFeet: status === "feet_verified_no_conflict" ? numeric : null
  });
}

function adaptOne(row, cohortYear, detail, link) {
  const status = statusFromRaw(row.status);
  const shoreline = classifyShoreline({
    waterfrontType: detail?.waterfront_type_field || row.waterfront_type_field || null,
    cardFacts: row.cardFacts || "",
    propertyClass: row.propertyClass || null
  });
  const eventDate = status === "sold"
    ? parseFlexibleDate(row.soldDate)
    : status === "expired"
      ? parseFlexibleDate(row.expiryDate_exact || row.expiryDate)
      : parseFlexibleDate(row.termination_event_date);
  const soldPrice = status === "sold" ? numberOrNull(row.sold_price_exact ?? row.exact_sold_price) : null;
  const finalAskingPrice = numberOrNull(
    row.list_price_on_sold_record_exact
    ?? row.list_price_exact
    ?? row.lastAsk_exact
    ?? detail?.sold_listing_list_price
  );
  return {
    mls: row.mls || null,
    status,
    cohortYear,
    eventDate,
    eventDateKnown: Boolean(eventDate),
    town: townFromAddress(row.address),
    address: row.address || null,
    soldPrice,
    finalAskingPrice,
    startingPrice: numberOrNull(row.original_list_price),
    contractDate: parseFlexibleDate(row.contractDate),
    closingDate: parseFlexibleDate(detail?.closing_date || row.closing_date),
    listingDom: numberOrNull(detail?.dom ?? row.detail_dom ?? row.dom),
    officialCdom: numberOrNull(detail?.official_cdom ?? row.official_cdom),
    historyValidated: detail?.history_validated === true || row.history_validated === true,
    derivedActiveExposure: (detail?.history_validated === true || row.history_validated === true)
      ? numberOrNull(detail?.derived_active_exposure ?? row.derived_active_exposure)
      : null,
    beds: numberOrNull(detail?.beds),
    baths: numberOrNull(detail?.baths),
    aboveGradeSqft: parseExactSqft(detail?.above_grade_finished_sqft),
    belowGradeSqft: parseExactSqft(detail?.below_grade_finished_sqft),
    garage: classifyGarage(detail?.garage_yes_no, detail?.garage_type),
    basement: classifyBasement(detail?.basement_as_shown),
    yearBuilt: /^\d{4}$/.test(String(detail?.year_built_exact || "").trim()) ? Number(detail.year_built_exact) : null,
    ageRange: detail?.approx_age_range || null,
    frontage: frontageFromRaw(row, detail),
    lotDimensionsRaw: detail?.lot_size_as_shown || null,
    lotAreaRaw: detail?.lot_size_area_as_shown || null,
    ...shoreline,
    island: "unverified",
    islandQuery: "no",
    photos: normalizePhotos(row.photos || detail?.photos),
    sourcePhotoCount: numberOrNull(row.photo_count ?? detail?.photo_count),
    link: link || null,
    recordedSaleIsNotTitleClosing: status === "sold"
  };
}

/**
 * Adapt a saved REALM research file into normalized rows.
 * Address-candidate campaigns are kept as candidates and are not confirmed links.
 * Client remarks, source URLs, and lot dimensions are not turned into water frontage.
 */
export function adaptRealmFile(raw, cohortYear) {
  const details = new Map((raw?.sold_property_details || []).map((detail) => [detail.mls, detail]));
  const linkByMls = new Map();
  for (const campaign of raw?.cross_status_campaigns || []) {
    for (const episode of campaign.episodes || []) {
      if (!episode.mls) continue;
      linkByMls.set(episode.mls, {
        propertyId: campaign.normalized_address_key || null,
        confidence: "address_candidate"
      });
    }
  }
  const groups = [
    ...(raw?.records || []),
    ...(raw?.sold_records || []),
    ...(raw?.expired_records || []),
    ...(raw?.terminated_records || [])
  ];
  return {
    cohortYear,
    internalOnly: true,
    records: groups.map((row) => adaptOne(row, cohortYear, details.get(row.mls), linkByMls.get(row.mls) || null))
  };
}

export function basementLabel(basement) {
  if (!basement) return UNKNOWN;
  if (basement.finish === "none") return "None";
  if (basement.finish === "partial") return "Partial";
  if (basement.finish === "finished") return "Finished";
  if (basement.finish === "unfinished") return "Unfinished";
  return UNKNOWN;
}

export function frontageLabel(frontage) {
  if (!frontage) return UNKNOWN;
  const rawBits = [frontage.rawLabel, frontage.rawValue, frontage.rawUnit].filter((part) => part != null && part !== "").join(" ");
  if (frontage.bandBasis === "verified_feet" && Number.isFinite(frontage.normalizedFeet)) {
    const band = FRONTAGE_BANDS.find((item) => item.id === frontage.band);
    return `${frontage.normalizedFeet} ft, ${band ? band.label : frontage.band}. Source: ${rawBits || UNKNOWN}`;
  }
  if (frontage.band === "unresolved") {
    return `Unresolved unit conflict. Not placed in a frontage band. Source: ${rawBits || UNKNOWN}`;
  }
  if (frontage.bandBasis === "metric_not_converted") {
    return `Recorded as ${rawBits || "metres"}. Not converted to feet. Band unknown.`;
  }
  return UNKNOWN;
}

export function cardModel(record, allRecords = []) {
  const price = bandPrice(record);
  const photos = normalizePhotos(record.photos);
  const facts = [
    ["Bedrooms", record.beds == null ? UNKNOWN : String(record.beds)],
    ["Bathrooms", record.baths == null ? UNKNOWN : String(record.baths)],
    ["Above-ground finished", record.aboveGradeSqft == null ? UNKNOWN : `${formatCount(record.aboveGradeSqft)} sq ft`],
    ["Finished below ground", record.belowGradeSqft == null ? UNKNOWN : `${formatCount(record.belowGradeSqft)} sq ft`],
    ["Garage", record.garage?.yes === "yes" ? "Yes" : record.garage?.yes === "no" ? "No" : UNKNOWN],
    ["Basement finish", basementLabel(record.basement)],
    ["Crawl space", record.basement?.crawlSpace === "yes" ? "Yes" : record.basement?.crawlSpace === "no" ? "No" : UNKNOWN],
    ["Water frontage", frontageLabel(record.frontage)],
    ["Lot size", lotLabel(record)],
    ["Year built", record.yearBuilt == null ? UNKNOWN : String(record.yearBuilt)],
    ["Age range", record.ageRange || UNKNOWN],
    ["Starting price", record.startingPrice == null ? UNKNOWN : formatCad(record.startingPrice)],
    ["Final asking price", record.finalAskingPrice == null ? UNKNOWN : formatCad(record.finalAskingPrice)],
    ["Sold price", record.status === "sold" ? (record.soldPrice == null ? UNKNOWN : formatCad(record.soldPrice)) : "Not a recorded sale"],
    ["Price used for the band", price.amount == null ? UNKNOWN : `${price.label}, ${formatCad(price.amount)}`],
    ["Recorded sale date", record.status === "sold" ? (record.eventDate || UNKNOWN) : "Not a recorded sale"],
    ["Title closing", record.closingDate || UNKNOWN],
    ["Contract date", record.contractDate || UNKNOWN],
    ["Expiry date", record.status === "expired" ? (record.eventDate || UNKNOWN) : "Not an expiry row"],
    ["Terminated date", record.status === "terminated" ? (record.eventDate || UNKNOWN) : "Not a terminated row"],
    ["Listing days on market", record.listingDom == null ? UNKNOWN : String(record.listingDom)],
    ["Official cumulative days on market", record.officialCdom == null ? UNKNOWN : String(record.officialCdom)],
    ["Derived active exposure", record.historyValidated === true && record.derivedActiveExposure != null ? String(record.derivedActiveExposure) : UNKNOWN],
    ["Shoreline", shorelineName(record.shorelineClass)],
    ["Island", record.island === "yes" ? "Yes" : record.island === "no" ? "No" : "Unverified"]
  ];
  return {
    title: record.address || "Address pending",
    town: record.town || UNKNOWN,
    status: record.status,
    statusLabel: statusLabel(record.status),
    priceLabel: price.label,
    priceText: price.amount == null ? UNKNOWN : formatCad(price.amount),
    facts,
    history: historyLines(record, allRecords),
    photos,
    photoLabel: photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "No photos",
    shorelineNote: record.shorelineNote || ""
  };
}

function shorelineName(value) {
  if (value === "direct") return "Direct";
  if (value === "shared") return "Shared";
  if (value === "indirect") return "Indirect";
  return UNKNOWN;
}

function statusLabel(status) {
  if (status === "sold") return "Sold";
  if (status === "expired") return "Expired";
  if (status === "terminated") return "Terminated";
  return UNKNOWN;
}

function lotLabel(record) {
  const parts = [record.lotDimensionsRaw, record.lotAreaRaw].filter(Boolean);
  return parts.length ? parts.join("; ") : UNKNOWN;
}

function historyLines(record, allRecords) {
  const lines = [];
  if (record.status === "sold") {
    lines.push("This row is one recorded sale. The sale date is not proof that land title has closed.");
  } else {
    lines.push("This is a listing episode. It is not, by itself, a property that never sold.");
  }
  if (record.link?.confidence === "confirmed" && record.link.propertyId) {
    const siblings = allRecords.filter((item) => item !== record && item.link?.propertyId === record.link.propertyId && item.link?.confidence === "confirmed");
    if (!siblings.length) lines.push("No other confirmed listing is linked.");
    for (const sibling of siblings) {
      lines.push(`Linked ${statusLabel(sibling.status).toLowerCase()} listing ${sibling.mls || "without an id"}${sibling.eventDate ? `, ${sibling.eventDate}` : ", date unknown"}.`);
    }
  } else if (record.link?.confidence === "address_candidate") {
    lines.push("Another saved row shares a normalized address. That link is a candidate only, so these rows are not merged and a later outcome is not treated as confirmed.");
  } else {
    lines.push("No confirmed later outcome is linked.");
  }
  if (!record.eventDate && record.status === "terminated") {
    lines.push("The terminated date is unknown. A later update date is not used in its place.");
  }
  return lines;
}

export function formatCad(amount) {
  if (!Number.isFinite(amount)) return UNKNOWN;
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(amount);
}

function formatCount(amount) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(amount);
}

export function formatStat(value, kind) {
  if (value == null || (typeof value === "number" && !Number.isFinite(value))) return UNKNOWN;
  if (kind === "cad") return formatCad(value);
  if (kind === "pct") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }
  if (kind === "share") return `${(value * 100).toFixed(1)}%`;
  if (kind === "days") return `${new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 }).format(value)} days`;
  return String(value);
}
