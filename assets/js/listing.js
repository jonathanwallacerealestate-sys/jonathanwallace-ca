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
  var capEl = document.getElementById('galleryCaption');
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
    if (capEl) capEl.textContent = photo.alt;
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

  /* Keep the sticky bar above the cookie notice while that notice is open. */
  var bar = document.querySelector('.listing-bar');
  function placeBar() {
    if (!bar) return;
    var consent = document.getElementById('jwConsent');
    if (consent) bar.style.bottom = (consent.offsetHeight + 24) + 'px';
    else bar.style.bottom = '0';
  }
  if (bar && window.MutationObserver) {
    new MutationObserver(placeBar).observe(document.body, { childList: true });
  }
  placeBar();
})();
