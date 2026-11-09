/* Shared listing gallery. Reads #listing-photos (JSON) from the page.
   Swipe (pointer), thumbnail click, image click, and arrow keys. */
(function () {
  var dataNode = document.getElementById('listing-photos');
  var img = document.getElementById('galleryImg');
  var stage = document.getElementById('galleryStage');
  if (!dataNode || !img || !stage) return;

  var photos;
  try { photos = JSON.parse(dataNode.textContent); } catch (e) { return; }
  if (!photos || !photos.length) return;

  var countEl = document.getElementById('galleryCount');
  var thumbsEl = document.getElementById('galleryThumbs');
  var prevBtn = document.getElementById('galleryPrev');
  var nextBtn = document.getElementById('galleryNext');
  var index = 0;
  var thumbButtons = [];
  var suppressClick = false;
  var pointerId = null;
  var startX = 0;
  var startY = 0;

  function show(i) {
    index = (i + photos.length) % photos.length;
    var photo = photos[index];
    if (img.getAttribute('src') !== photo.src) img.src = photo.src;
    img.alt = photo.alt;
    img.width = photo.w;
    img.height = photo.h;
    if (countEl) countEl.textContent = (index + 1) + ' of ' + photos.length;
    thumbButtons.forEach(function (btn, n) {
      if (n === index) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
    var active = thumbButtons[index];
    if (active && thumbsEl) {
      var left = active.offsetLeft - (thumbsEl.clientWidth - active.clientWidth) / 2;
      thumbsEl.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
    }
    var upcoming = photos[(index + 1) % photos.length];
    if (upcoming && upcoming.src) {
      var pre = new Image();
      pre.src = upcoming.src;
    }
  }

  photos.forEach(function (photo, n) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Show photo ' + (n + 1) + ': ' + photo.alt);
    var thumb = document.createElement('img');
    thumb.alt = '';
    thumb.width = photo.w;
    thumb.height = photo.h;
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.src = photo.src;
    btn.appendChild(thumb);
    btn.addEventListener('click', function () { show(n); });
    thumbsEl.appendChild(btn);
    thumbButtons.push(btn);
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { show(index - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { show(index + 1); });

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  });
  stage.addEventListener('pointerup', function (e) {
    if (pointerId !== e.pointerId) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    pointerId = null;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick = true;
      show(index + (dx < 0 ? 1 : -1));
      setTimeout(function () { suppressClick = false; }, 400);
    }
  });
  stage.addEventListener('pointercancel', function () { pointerId = null; });
  stage.addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; return; }
    var rect = stage.getBoundingClientRect();
    var x = e.clientX - rect.left;
    show(index + (x < rect.width / 2 ? -1 : 1));
  });

  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.target && e.target.isContentEditable) return;
    if (e.key === 'ArrowRight') { show(index + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { show(index - 1); e.preventDefault(); }
  });

  show(0);
})();

/* Spec cards and the mobile contact bar.
   Clarity, Nov 6 2026: a phone visitor tapped Bedrooms and Bathrooms and
   nothing happened, and the fixed contact bar sat on the hero photo because
   it was pushed up by the full height of the in-flow cookie notice. */
(function () {
  function sectionFor(heading) {
    var nodes = document.querySelectorAll('h2');
    var want = heading.toLowerCase();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent.trim().toLowerCase() === want) {
        return nodes[i].closest('section') || nodes[i];
      }
    }
    return null;
  }
  function ensureId(el, id) {
    if (!el) return '';
    if (!el.id) el.id = id;
    return el.id;
  }

  var details = sectionFor('the details');
  var rooms = sectionFor('rooms');
  var appliances = sectionFor('appliances');
  var description = sectionFor("in the listing's words");
  var detailsId = ensureId(details, 'listing-details');
  var roomsId = ensureId(rooms, 'listing-rooms');
  var appliancesId = ensureId(appliances, 'listing-appliances');
  var descriptionId = ensureId(description, 'listing-description');

  function targetFor(label) {
    var text = label.toLowerCase();
    if (text.indexOf('bed') !== -1 && roomsId) return { id: roomsId, hint: 'See room sizes' };
    if (text.indexOf('bath') !== -1 && descriptionId) return { id: descriptionId, hint: 'See the description' };
    if (text.indexOf('bath') !== -1 && roomsId) return { id: roomsId, hint: 'See room sizes' };
    if (text.indexOf('appliance') !== -1 && appliancesId) return { id: appliancesId, hint: 'See appliances' };
    if (detailsId) return { id: detailsId, hint: '' };
    return null;
  }

  var facts = document.querySelectorAll('.facts .fact');
  for (var f = 0; f < facts.length; f++) {
    var fact = facts[f];
    if (fact.querySelector('a')) continue;
    var term = fact.querySelector('dt');
    var label = term ? term.textContent.replace(/\s+/g, ' ').trim() : '';
    var target = targetFor(label);
    if (!target) {
      fact.classList.add('fact--static');
      continue;
    }
    var link = document.createElement('a');
    link.className = 'fact-link';
    link.href = '#' + target.id;
    while (fact.firstChild) link.appendChild(fact.firstChild);
    if (target.hint) {
      var hint = document.createElement('span');
      hint.className = 'fact-link__hint';
      hint.textContent = target.hint;
      link.appendChild(hint);
    }
    fact.appendChild(link);
  }

  var summary = document.querySelector('.listing-summary');
  if (summary && detailsId && !summary.querySelector('a') && /bed|bath/i.test(summary.textContent)) {
    var jump = document.createElement('a');
    jump.className = 'listing-summary__link';
    jump.href = '#' + detailsId;
    while (summary.firstChild) jump.appendChild(summary.firstChild);
    summary.appendChild(jump);
  }

  var bar = document.querySelector('.listing-bar');
  var mobileQuery = window.matchMedia('(max-width: 720px)');

  function consentBar() {
    return document.getElementById('jwConsent');
  }
  function consentFixedHeight() {
    var consent = consentBar();
    if (!consent) return 0;
    if (getComputedStyle(consent).position !== 'fixed') return 0;
    return consent.offsetHeight || 0;
  }
  function overlapsChrome(el, chromeTop) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    if (rect.height < 8) return false;
    return rect.bottom > chromeTop + 4 && rect.top < window.innerHeight - 4;
  }

  var lastKey = '';
  function syncBar() {
    var consentH = consentFixedHeight();
    var show = true;
    var barH = 0;
    if (bar) {
      barH = bar.offsetHeight || 64;
      var chromeTop = window.innerHeight - barH - consentH;
      var gallery = document.getElementById('gallery');
      var actions = document.querySelector('.stack-actions');
      if (mobileQuery.matches && gallery) {
        var g = gallery.getBoundingClientRect();
        if (g.bottom > 80 && g.top < window.innerHeight) show = false;
      } else if (overlapsChrome(gallery, chromeTop)) {
        show = false;
      }
      if (overlapsChrome(actions, chromeTop)) show = false;
    }
    var key = (mobileQuery.matches ? 'm' : 'd') + '|' + consentH + '|' + (show ? '1' : '0') + '|' + barH;
    if (key === lastKey) return;
    lastKey = key;
    if (bar) {
      bar.style.bottom = consentH ? consentH + 'px' : '0';
      bar.classList.toggle('is-above-consent', consentH > 0);
      bar.classList.toggle('is-shown', show);
      bar.classList.toggle('is-parked', !show);
      if (show) {
        bar.removeAttribute('aria-hidden');
        bar.removeAttribute('inert');
      } else {
        bar.setAttribute('aria-hidden', 'true');
        bar.setAttribute('inert', '');
      }
    }
    try { window.dispatchEvent(new CustomEvent('jw:chrome')); } catch (e) {}
  }

  var scheduled = false;
  function requestSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      syncBar();
    });
  }

  if (window.MutationObserver) {
    new MutationObserver(requestSync).observe(document.body, { childList: true });
  }
  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync);
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', requestSync);
  requestSync();
  window.setTimeout(requestSync, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestSync);
})();
