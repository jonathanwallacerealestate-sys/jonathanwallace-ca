import {
  FRONTAGE_BANDS,
  PENDING,
  PRICE_BANDS,
  TOWNS,
  UNKNOWN,
  cardModel,
  formatStat,
  lightboxReduce,
  normalizePhotos,
  viewModel
} from "./waterfront-model.mjs";

const YEAR_LABEL = {
  matched: {
    2025: "2025, January 1 to November 7",
    2026: "2026, January 1 to November 7"
  },
  full: {
    2025: "2025 full year",
    2026: "2026 year to date, through November 7"
  }
};

function text(node, value) {
  if (node) node.textContent = value;
}

function field(root, id) {
  return root.querySelector(`#${id}`);
}

function selectedPeriod(root) {
  const checked = root.querySelector("input[name='wf-period']:checked");
  return checked && checked.value === "full" ? "full" : "matched";
}

function selectedView(root) {
  const checked = root.querySelector("input[name='wf-view']:checked");
  return checked && checked.value === "outcomes" ? "outcomes" : "listings";
}

function readFilters(root) {
  return {
    period: selectedPeriod(root),
    year: field(root, "wf-year").value,
    town: field(root, "wf-town").value,
    status: field(root, "wf-status").value,
    priceBand: field(root, "wf-band").value,
    frontage: field(root, "wf-frontage").value,
    shoreline: field(root, "wf-shore").value,
    view: selectedView(root)
  };
}

function resetFilters(root) {
  root.querySelectorAll("select").forEach((select) => {
    select.value = "all";
  });
  const matched = root.querySelector("input[name='wf-period'][value='matched']");
  const listings = root.querySelector("input[name='wf-view'][value='listings']");
  if (matched) matched.checked = true;
  if (listings) listings.checked = true;
}

function money(amount) {
  if (amount == null || !Number.isFinite(amount)) return UNKNOWN;
  const cents = Math.abs(amount - Math.round(amount)) > 0.001;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0
  }).format(amount);
}

function signedPct(value) {
  if (value == null || !Number.isFinite(value)) return "n/a (zero baseline)";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function bandText(summary, id) {
  if (!summary) return PENDING;
  const band = summary.bands[id];
  if (!band) return PENDING;
  if (band.sharePct != null) return `${band.count} (${Number(band.sharePct).toFixed(2)}%)`;
  if (summary.n === 0) return `0, ${UNKNOWN} share`;
  return `${band.count}, ${formatStat(band.share, "share")} of recorded sales`;
}

function domText(summary) {
  const dom = summary && (summary.listingDom || (summary.exposure && summary.exposure.listingDom));
  if (!dom || !Number.isFinite(dom.mean) || !Number.isFinite(dom.median)) return UNKNOWN;
  return `${dom.mean} days mean; ${dom.median} days median`;
}

function fillYear(card, year, summary, gated) {
  text(card.querySelector(`[data-year-label='${year}']`), YEAR_LABEL[card.closest("[data-period]")?.dataset.period || "matched"][year]);
  const set = (name, value) => text(card.querySelector(`[data-stat='${name}'][data-year='${year}']`), value);
  if (gated || !summary) {
    set("n", PENDING);
    set("mean", PENDING);
    set("median", PENDING);
    for (const band of PRICE_BANDS) set(band.id, PENDING);
    set("listingDom", PENDING);
    set("officialCdom", UNKNOWN);
    set("derived", UNKNOWN);
    return;
  }
  set("n", String(summary.n));
    set("mean", money(summary.mean));
    set("median", money(summary.median));
    for (const band of PRICE_BANDS) set(band.id, bandText(summary, band.id));
    set("listingDom", domText(summary));
    set("officialCdom", UNKNOWN);
    set("derived", UNKNOWN);
}

function renderComparison(root, view, filters) {
  const period = filters.period === "full" ? "full" : "matched";
  root.querySelectorAll("[data-period]").forEach((node) => {
    node.dataset.period = period;
  });
  const note = field(root, "wf-period-note");
  if (!view.comparison) {
    text(note, period === "full"
      ? "Full 2025 beside 2026 through November 7. These windows are not the same length. Figures are not on this page yet."
      : "January 1 to November 7 each year. Figures are not on this page yet.");
  } else if (period === "full") {
    text(note, "For sold listings in this search, full-year 2025 matches January 1 to November 7. November 8 through December 31, 2025 returned no sales. 2026 still ends November 7.");
  } else {
    text(note, "Sold dates from January 1 to November 7 each year. As of November 7, 2026. Listing days on market are for that listing, not official cumulative days on market.");
  }
  const comparison = view.comparison;
  root.querySelectorAll("[data-town]").forEach((card) => {
    const town = card.getAttribute("data-town");
    const block = comparison ? comparison.towns[town] : null;
    fillYear(card, "2025", block && block.y2025, !comparison);
    fillYear(card, "2026", block && block.y2026, !comparison);
    const change = card.querySelector("[data-stat='change']");
    if (!comparison || !block) {
      text(change, "Change in the mean: Pending review. Change in the median: Pending review. A change in the average is not a change in the value of the same homes.");
      return;
    }
    const small = (block.y2025.smallN || block.y2026.smallN || block.y2025.n < 10 || block.y2026.n < 10)
      ? " One year has fewer than 10 sales."
      : "";
    const domChange = Number.isFinite(block.listingDomMeanChangePct)
      ? ` Listing days on market, mean ${signedPct(block.listingDomMeanChangePct)}, median ${signedPct(block.listingDomMedianChangePct)}.`
      : "";
    text(change, `Sales ${signedPct(block.countChangePct)}. Mean ${signedPct(block.meanChangePct)}. Median ${signedPct(block.medianChangePct)}.${domChange} Not a same-home value change.${small}`);
  });
}

function factList(facts) {
  const list = document.createElement("dl");
  list.className = "wf-dl";
  for (const [label, value] of facts) {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    list.append(term, detail);
  }
  return list;
}

function photoControl(card, openLightbox) {
  if (!card.photos.length) {
    const empty = document.createElement("div");
    empty.className = "wf-photo wf-photo--empty";
    const label = document.createElement("p");
    label.textContent = "No photos";
    empty.append(label);
    return empty;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "wf-photo";
  button.setAttribute("aria-label", `View ${card.photoLabel} of ${card.title}`);
  const image = document.createElement("img");
  image.src = card.photos[0].src;
  image.alt = card.photos[0].alt || `${card.title}, photo 1 of ${card.photos.length}`;
  image.width = 640;
  image.height = 360;
  const count = document.createElement("span");
  count.className = "wf-photo__count";
  count.textContent = card.photoLabel;
  button.append(image, count);
  button.addEventListener("click", () => openLightbox(card.photos, card.title, button));
  return button;
}

function renderCard(record, all, openLightbox) {
  const card = cardModel(record, all);
  const article = document.createElement("article");
  article.className = "wf-card";
  const heading = document.createElement("h3");
  heading.textContent = card.title;
  const where = document.createElement("p");
  where.className = "wf-where";
  where.textContent = `${card.town} · ${card.statusLabel}`;
  const price = document.createElement("p");
  price.className = "wf-price";
  const priceName = document.createElement("span");
  priceName.textContent = card.priceLabel;
  price.append(priceName, document.createTextNode(card.priceText));
  const history = document.createElement("ol");
  history.className = "wf-history";
  for (const line of card.history) {
    const item = document.createElement("li");
    item.textContent = line;
    history.append(item);
  }
  article.append(
    photoControl(card, openLightbox),
    heading,
    where,
    price,
    factList(card.facts),
    history
  );
  if (card.shorelineNote) {
    const note = document.createElement("p");
    note.className = "wf-note";
    note.textContent = card.shorelineNote;
    article.append(note);
  }
  return article;
}

function renderArchive(root, view, filters, openLightbox) {
  const count = field(root, "wf-result-count");
  const empty = field(root, "wf-empty");
  const grid = field(root, "wf-grid");
  const viewNote = field(root, "wf-view-note");
  text(viewNote, filters.view === "outcomes"
    ? "Linked properties group only a confirmed match. A later sale is the outcome. An address match that is only possible stays separate."
    : "Each listing is shown on its own. An expired or terminated listing is not labeled as a home that never sold.");
  grid.replaceChildren();
  if (view.gated) {
    const labelFor = (id) => {
      const node = field(root, id);
      if (!node) return "";
      const option = node.selectedOptions && node.selectedOptions[0];
      return option ? option.textContent : node.value;
    };
    const bits = [labelFor("wf-year"), labelFor("wf-town"), labelFor("wf-status"), labelFor("wf-band"), labelFor("wf-frontage"), labelFor("wf-shore")];
    text(count, `Property records are under review. Filters: ${bits.join("; ")}.`);
    empty.hidden = false;
    text(empty, "Property records are under review.");
    return;
  }
  const items = filters.view === "outcomes" ? view.outcomes : view.records;
  const noun = filters.view === "outcomes" ? "linked properties" : "listings";
  if (!items.length) {
    text(count, `0 ${noun} match these filters.`);
    empty.hidden = false;
    text(empty, "No properties match these filters. Clear them to start again.");
    return;
  }
  text(count, `Showing ${items.length} ${noun}.`);
  empty.hidden = true;
  const all = view.records;
  for (const item of items) {
    const record = item.primary || item;
    const article = renderCard(record, all, openLightbox);
    if (item.episodes && item.episodes.length > 1) {
      const extra = document.createElement("p");
      extra.className = "wf-note";
      extra.textContent = `Confirmed link: ${item.episodes.length} listing episodes, one property outcome.`;
      article.append(extra);
    }
    grid.append(article);
  }
}

function bindLightbox(dialog) {
  let photos = [];
  let opener = null;
  let state = { index: 0, length: 0, open: false };
  const image = dialog.querySelector("img");
  const title = dialog.querySelector(".wf-lightbox__title");
  const count = dialog.querySelector(".wf-lightbox__count");

  function paint() {
    if (!photos.length) return;
    const photo = photos[state.index];
    image.src = photo.src;
    image.alt = photo.alt || "";
    text(count, `${state.index + 1} of ${photos.length}`);
  }

  function open(nextPhotos, nextTitle, button) {
    photos = normalizePhotos(nextPhotos);
    if (!photos.length) return;
    opener = button || null;
    state = lightboxReduce({ index: 0, length: photos.length, open: false }, { type: "open" });
    text(title, nextTitle || "Photos");
    paint();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    dialog.querySelector(".wf-lightbox__close").focus();
  }

  dialog.querySelector(".wf-lightbox__close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".wf-lightbox__nav--prev").addEventListener("click", () => {
    state = lightboxReduce(state, { type: "prev" });
    paint();
  });
  dialog.querySelector(".wf-lightbox__nav--next").addEventListener("click", () => {
    state = lightboxReduce(state, { type: "next" });
    paint();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      state = lightboxReduce(state, { type: "prev" });
      paint();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      state = lightboxReduce(state, { type: "next" });
      paint();
    }
  });
  dialog.addEventListener("close", () => {
    state = lightboxReduce({ ...state, length: photos.length }, { type: "close" });
    if (opener && typeof opener.focus === "function") opener.focus();
  });
  const stage = dialog.querySelector(".wf-lightbox__stage");
  let pointerId = null;
  let startX = 0;
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
  });
  stage.addEventListener("pointerup", (event) => {
    if (pointerId !== event.pointerId) return;
    const delta = event.clientX - startX;
    pointerId = null;
    if (delta <= -40) {
      state = lightboxReduce(state, { type: "next" });
      paint();
    } else if (delta >= 40) {
      state = lightboxReduce(state, { type: "prev" });
      paint();
    }
  });
  return { open };
}

function renderAll(root, dataset, lightbox) {
  const filters = readFilters(root);
  const view = viewModel(dataset, filters);
  renderComparison(root, view, filters);
  renderArchive(root, view, filters, lightbox.open);
}

async function boot() {
  const root = document.getElementById("wf-app");
  const dialog = document.getElementById("wfLightbox");
  if (!root || !dialog) return;
  let dataset = { publication: { validationStatus: "withheld" }, records: [] };
  try {
    const response = await fetch("/content/waterfront/public-release.json", { cache: "no-store" });
    if (response.ok) dataset = await response.json();
  } catch (error) {
    dataset = { publication: { validationStatus: "withheld" }, records: [] };
  }
  const lightbox = bindLightbox(dialog);
  const render = () => renderAll(root, dataset, lightbox);
  root.addEventListener("change", render);
  field(root, "wf-reset").addEventListener("click", () => {
    resetFilters(root);
    render();
  });
  render();
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    window.__wfDebug = {
      openLightbox(photos, title) {
        lightbox.open(photos, title || "Photo check", document.activeElement);
      }
    };
  }
}

boot();
