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
    var art = node('<article class="video"><button class="video__thumb" style="background-image:url(\'' + esc(thumb) + '\');" aria-label="Play: ' + esc(v.title) + '"><span class="video__play">&#9658;</span></button><div class="video__body"><h4>' + esc(v.title) + '</h4><div class="video__meta">YouTube &middot; ' + fmtDate(v.published) + '</div></div></article>');
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
      var formName = form.getAttribute('name') || data['form-name'] || 'unknown';
      var tags = ['Website Lead', 'Website: ' + formName];
      if (formName === 'newsletter') tags.push('Newsletter: Weekly');
      if (data.loc) tags.push('Poster: ' + data.loc);
      if (data.guide) tags.push('Guide: ' + data.guide);
      var payload = JSON.stringify({
        form_name: formName,
        email: data.email || '',
        name: ((data.first_name || '') + ' ' + (data.last_name || '')).trim(),
        site_url: 'https://jonathanwallace.ca',
        tags_json: JSON.stringify(tags),
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

/* Google one-tap newsletter signup. Renders a "Sign up with Google" button
   next to every newsletter form (and in #googleSignupSlot on the newsletter
   page). One click sends the visitor's Google-verified name and email to the
   Make webhook (-> Follow Up Boss, tagged Newsletter: Weekly) and records the
   signup in Netlify Forms. The classic email form stays as the other option. */
(function () {
  var CLIENT_ID = '439239346088-n6pitcgg8uuin53uod0f79lfu7rqv6pp.apps.googleusercontent.com';
  var HOOK = 'https://hook.us2.make.com/tcs6ih6kkol4mpni1umeh2v59i2krlg9';

  // Contact page: a "Continue with Google" button that PREFILLS the contact form
  // (name + email) so the visitor only adds their message. Takes priority so the
  // one initialize below uses the contact callback and never collides.
  var contactSlot = document.getElementById('googleContactSlot');
  var contactForm = document.querySelector('form[name="contact"]');
  var CONTACT_MODE = !!(contactSlot && contactForm);

  var slots = [];
  if (CONTACT_MODE) {
    slots.push(contactSlot);
  } else {
    var slotEl = document.getElementById('googleSignupSlot');
    if (slotEl) slots.push(slotEl);
    var forms = document.querySelectorAll('form[name="newsletter"]');
    for (var i = 0; i < forms.length; i++) {
      if (slotEl && slotEl.getAttribute('data-form') === 'inline') break;
      var wrap = document.createElement('div');
      wrap.className = 'g-signup';
      wrap.style.cssText = 'margin-top:12px;';
      wrap.innerHTML = '<div style="font-size:.8rem;opacity:.75;margin-bottom:6px;">or one tap with Google:</div><div class="g-btn"></div><div style="font-size:.72rem;opacity:.6;margin-top:6px;">One tap signs you up for the weekly Georgian Bay email. Unsubscribe anytime.</div>';
      forms[i].parentNode.insertBefore(wrap, forms[i].nextSibling);
      slots.push(wrap.querySelector('.g-btn'));
    }
  }
  if (!slots.length) return;

  function loc() {
    try { return new URLSearchParams(location.search).get('loc') || ''; } catch (e) { return ''; }
  }
  function decodeJwt(t) {
    var p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(p).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  }
  function onCredential(resp) {
    var claims;
    try { claims = decodeJwt(resp.credential); } catch (e) { return; }
    if (!claims || !claims.email) return;
    var tags = ['Website Lead', 'Website: newsletter', 'Newsletter: Weekly', 'Signup: Google'];
    if (loc()) tags.push('Poster: ' + loc());
    var guideEl = document.querySelector('input[name="guide"]');
    if (guideEl && guideEl.value) tags.push('Guide: ' + guideEl.value);
    var data = {
      email: claims.email,
      first_name: claims.given_name || '',
      last_name: claims.family_name || '',
      casl_consent: 'yes (Google one-tap signup)',
      method: 'google',
      loc: loc(),
      guide: guideEl ? guideEl.value : ''
    };
    fetch(HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_name: 'newsletter', email: claims.email,
        name: claims.name || '', site_url: 'https://jonathanwallace.ca',
        tags_json: JSON.stringify(tags), data: data
      })
    }).catch(function () {});
    var record = new URLSearchParams();
    record.set('form-name', 'newsletter');
    record.set('email', claims.email);
    record.set('casl_consent', 'yes');
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: record.toString() }).catch(function () {});
    for (var j = 0; j < slots.length; j++) {
      var host = slots[j].closest ? (slots[j].closest('.g-signup') || slots[j]) : slots[j];
      host.innerHTML = '<div style="font-weight:600;">You are in, ' + (claims.given_name || 'neighbour') + '. Watch for Friday\'s issue.</div>';
    }
    try { document.dispatchEvent(new CustomEvent('jw:signup', { detail: claims })); } catch (e) {}
  }
  function onContact(resp) {
    var claims;
    try { claims = decodeJwt(resp.credential); } catch (e) { return; }
    if (!claims || !claims.email) return;
    function fill(name, val) {
      var el = contactForm.querySelector('[name="' + name + '"]');
      if (el && !el.value && val) el.value = val;
    }
    fill('first_name', claims.given_name || '');
    fill('last_name', claims.family_name || '');
    fill('email', claims.email);
    contactSlot.innerHTML = '<div style="font-weight:600;color:#1B1B1B;">Thanks, ' + (claims.given_name || 'there') + '. I filled in your name and email, just add your message below.</div>';
    var msg = contactForm.querySelector('[name="message"]');
    if (msg) { try { msg.focus(); } catch (e) {} }
  }
  function init() {
    if (!(window.google && google.accounts && google.accounts.id)) return;
    google.accounts.id.initialize({ client_id: CLIENT_ID, callback: CONTACT_MODE ? onContact : onCredential });
    for (var k = 0; k < slots.length; k++) {
      google.accounts.id.renderButton(slots[k], { theme: 'outline', size: 'large', text: CONTACT_MODE ? 'continue_with' : 'signup_with', shape: 'pill' });
    }
  }
  var s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true; s.defer = true; s.onload = init;
  document.head.appendChild(s);
})();


/* Live Google reviews (fetched server-side via the google-reviews Netlify function,
   so the API key never touches the browser). Renders a small "Fresh from Google" row
   into #googleReviews when reviews are available; stays hidden otherwise. */
(function () {
  var host = document.getElementById('googleReviews');
  if (!host) return;
  function esc(t){ var d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }
  function stars(n){ n=Math.round(n||5); var s=''; for(var i=0;i<5;i++) s+=(i<n?'\u2605':'\u2606'); return s; }
  fetch('/.netlify/functions/google-reviews').then(function(r){ return r.json(); }).then(function(d){
    if (!d || !d.reviews || !d.reviews.length) return;
    var cards = d.reviews.slice(0,3).map(function(rv){
      var t = rv.text.length > 260 ? rv.text.slice(0,257).replace(/\s+\S*$/,'') + '\u2026' : rv.text;
      var when = rv.relative_time ? ' \u00b7 ' + esc(rv.relative_time) : '';
      return '<blockquote style="background:#F7F3EC;border:1px solid #EAE4D8;border-radius:14px;padding:22px;margin:0;">'
        + '<div style="color:#C9A96A;letter-spacing:3px;font-size:.95rem;">' + stars(rv.rating) + '</div>'
        + '<p style="font-family:\'Playfair Display\',Georgia,serif;font-size:1.02rem;line-height:1.55;color:#1B1B1B;margin:10px 0 14px;">\u201c' + esc(t) + '\u201d</p>'
        + '<cite style="font-style:normal;font-size:.88rem;color:#8A8378;">' + esc(rv.author) + ' \u00b7 Google review' + when + '</cite>'
        + '</blockquote>';
    }).join('');
    var mapsLink = d.maps_url ? '<div style="margin-top:16px;"><a class="btn btn--ghost" href="' + esc(d.maps_url) + '" target="_blank" rel="noopener">See all Google reviews \u2192</a></div>' : '';
    host.innerHTML = '<p class="eyebrow" style="margin-top:44px;">Fresh from Google</p>'
      + '<div class="grid grid--3" style="margin-top:16px;text-align:left;">' + cards + '</div>' + mapsLink;
    host.style.display = '';
  }).catch(function(){});
})();
