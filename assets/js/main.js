/* jonathanwallace.ca site JS */
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }
  document.querySelectorAll('#year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* Single-source stats. Fills any [data-stat="key"] from assets/data/stats.json.
   Inline values stay as fallback if the fetch fails. */
(function () {
  var nodes = document.querySelectorAll('[data-stat]');
  if (!nodes.length) return;
  fetch('assets/data/stats.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) {
      if (!s) return;
      nodes.forEach(function (el) {
        var key = el.getAttribute('data-stat');
        if (s[key] != null) el.textContent = s[key];
      });
    })
    .catch(function () {});
})();

/* Latest YouTube uploads. Resilient: cached last-good shows instantly, a hard
   timeout prevents a stuck spinner, and it always ends on real videos or a
   clean Watch on YouTube fallback. */
(function () {
  var box = document.getElementById('latestVideos');
  if (!box) return;
  var channel = box.getAttribute('data-yt-channel') || '';
  var endpoint = '/.netlify/functions/latest-videos' + (channel ? ('?channel=' + encodeURIComponent(channel)) : '');
  var CACHE_KEY = 'jw_latest_videos_v1';
  var settled = false;

  function esc(t) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function node(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function card(v) {
    var thumb = v.thumbnail || ('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
    var art = node('<article class="video"><button class="video__thumb" style="background-image:url(' + JSON.stringify(thumb) + ');" aria-label="Play: ' + esc(v.title) + '"><span class="video__play">&#9658;</span></button><div class="video__body"><h4>' + esc(v.title) + '</h4><div class="video__meta">YouTube &middot; ' + fmtDate(v.published) + '</div></div></article>');
    var btn = art.querySelector('.video__thumb');
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('title', v.title || 'YouTube video');
      f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0';
      btn.replaceWith(f);
    });
    return art;
  }
  function render(vids) { box.innerHTML = ''; vids.slice(0, 3).forEach(function (v) { box.appendChild(card(v)); }); }
  function fallback() {
    box.innerHTML = '<div class="video" style="grid-column:1/-1;text-align:center;padding:28px;"><p style="margin:0 0 14px;">See the latest Georgian Bay home tours on YouTube.</p><a class="btn btn--primary" href="https://youtube.com/@jonathanwallaceRE" target="_blank" rel="noopener">&#9658; Watch on YouTube</a></div>';
  }

  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && cached.videos && cached.videos.length) { render(cached.videos); settled = true; }
  } catch (e) {}

  var timer = setTimeout(function () { if (!settled) { settled = true; fallback(); } }, 6000);

  fetch(endpoint, { headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var vids = (data && data.videos) || [];
      clearTimeout(timer);
      if (vids.length) {
        render(vids); settled = true;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), videos: vids })); } catch (e) {}
      } else if (!settled) { settled = true; fallback(); }
    })
    .catch(function () { clearTimeout(timer); if (!settled) { settled = true; fallback(); } });
})();

/* Lead beacon: mirror every Netlify form submission to the Make.com
   Website Leads webhook (Make -> Follow Up Boss). Netlify Forms stays
   the system of record; this adds real-time CRM delivery. Fire-and-forget:
   never blocks or breaks the normal form POST. */
(function () {
  var HOOK = 'https://hook.us2.make.com/tcs6ih6kkol4mpni1umeh2v59i2krlg9';
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.hasAttribute('data-netlify')) return;
    try {
      var fd = new FormData(form);
      if (fd.get('bot-field')) return; /* honeypot tripped: skip */
      var data = {};
      fd.forEach(function (v, k) { if (k !== 'bot-field') data[k] = v; });
      var payload = JSON.stringify({
        form_name: form.getAttribute('name') || data['form-name'] || 'unknown',
        email: data.email || '',
        name: ((data.first_name || '') + ' ' + (data.last_name || '')).trim(),
        site_url: 'https://jonathanwallace.ca',
        data: data
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(HOOK, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (err) { /* never interfere with the real submission */ }
  }, true);
})();
