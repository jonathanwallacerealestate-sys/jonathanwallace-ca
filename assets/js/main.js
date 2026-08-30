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

/* Lead beacon + interaction tracking. Mirrors every Netlify form submission to
   the Make.com Website Leads webhook (Make -> Follow Up Boss), tagging it by what
   the visitor actually did (which form, which guide, which page, buyer vs seller
   intent), and logs PDF/guide downloads for known leads. Netlify Forms stays the
   system of record; this adds real-time CRM delivery. Fire-and-forget: never
   blocks or breaks the normal form POST. */
(function () {
  var HOOK = 'https://hook.us2.make.com/tcs6ih6kkol4mpni1umeh2v59i2krlg9';
  /* Last visitor who identified themselves on THIS page (from a form submit).
     Lets us attribute a subsequent PDF download to a real person. */
  window.__jwLead = window.__jwLead || null;

  function cleanPath() {
    try {
      var p = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
      return p === '' ? '/home' : p;
    } catch (e) { return ''; }
  }
  function intentTag(hay) {
    if (/(seller|home-valuation|home_value|selling|\bsell\b)/i.test(hay)) return 'Intent: Seller';
    if (/(buyer|buying|\bbuy\b)/i.test(hay)) return 'Intent: Buyer';
    return '';
  }
  function send(obj) {
    var payload = JSON.stringify(obj);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(HOOK, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (e) {}
  }
  window.__jwSend = send;

  /* Vendor-intro conduit alert: SMS + email to Jonathan Wallace so he can make the
     introduction personally. Routes through the dedicated Vendor Intro Alert relay
     (never the raw Infobip or Outlook gateways directly: those accept an arbitrary
     destination and would let anyone reachable to this page send SMS/email through
     Jonathan Wallace's own accounts). The relay hardcodes the destinations; only the
     message CONTENT is client-composed, and it is JSON-escaped here before transport
     so a quote or apostrophe typed into the form can never break the relay's request
     body, the same class of fragility already documented for the Infobip proxy. */
  var VENDOR_ALERT_HOOK = 'https://hook.us2.make.com/k1kjmt1jxe3ntx5ab4m9rfc52tk124by';
  function jsonEscapeFragment(s) {
    return JSON.stringify(String(s == null ? '' : s)).slice(1, -1);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sendVendorIntroAlert(data, fullName) {
    try {
      var vendor = data.vendor || '';
      var smsText = (fullName + ' is looking for an intro to ' + vendor + '.' +
        (data.phone ? ' ' + data.phone : '') + (data.email ? ' ' + data.email : '')).trim();
      var subject = 'Vendor intro: ' + fullName + ' \u2192 ' + vendor;
      var body = '<p><strong>' + escapeHtml(fullName) + '</strong> would like an introduction to <strong>' +
        escapeHtml(vendor) + '</strong> (' + escapeHtml(data.trade || '') + ').</p>' +
        '<p>Email: ' + escapeHtml(data.email || '') + '<br>Phone: ' + escapeHtml(data.phone || '') +
        '<br>Community: ' + escapeHtml(data.community || '') + '<br>Timing: ' + escapeHtml(data.timeframe || '') +
        '<br>Prefers: ' + escapeHtml(data.visit || '') + '</p>' +
        '<p>What they said: ' + escapeHtml(data.message || '') + '</p>';
      var payload = JSON.stringify({
        sms_text_escaped: jsonEscapeFragment(smsText),
        email_subject_escaped: jsonEscapeFragment(subject),
        email_body_escaped: jsonEscapeFragment(body)
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(VENDOR_ALERT_HOOK, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(VENDOR_ALERT_HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (e) {}
  }

  /* Form submissions -> tagged lead event */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.hasAttribute('data-netlify')) return;
    if (form.getAttribute('data-beacon') === 'off') return; /* form sends its own beacon */
    try {
      var fd = new FormData(form);
      if (fd.get('bot-field')) return; /* honeypot tripped: skip */
      var data = {};
      fd.forEach(function (v, k) { if (k !== 'bot-field') data[k] = v; });
      var formName = form.getAttribute('name') || data['form-name'] || 'unknown';
      var name = ((data.first_name || '') + ' ' + (data.last_name || '')).trim();
      var tags = ['Website Lead', 'Website: ' + formName, 'Page: ' + cleanPath()];
      if (formName === 'newsletter') tags.push('Newsletter: Weekly');
      if (data.loc) tags.push('Poster: ' + data.loc);
      if (data.guide) tags.push('Guide: ' + data.guide);
      if (formName === 'vendor-intro') {
        /* Trades and preferred-vendor conduit. Per 02-playbooks/trusted-trades-bench-and-vendor-content.md
           section 7: Website:trades-intro, Trade, Community, Intent: Homeowner-Improvement, Visit.
           Intent: Seller is deliberately absent so these contacts enter the Past Client Service
           Program seasonal calendar, never buyer or seller nurture. */
        tags.push('Website:trades-intro');
        tags.push('Intent: Homeowner-Improvement');
        if (data.vendor) tags.push('Vendor: ' + data.vendor);
        if (data.trade) tags.push('Trade: ' + data.trade);
        if (data.community) tags.push('Community: ' + data.community);
        if (data.visit) tags.push('Visit: ' + data.visit);
        sendVendorIntroAlert(data, name || 'Someone');
      } else {
        var it = intentTag(formName + ' ' + (data.topic || '') + ' ' + (data.source_page || ''));
        if (it) tags.push(it);
      }
      if (data.email) window.__jwLead = { email: data.email, name: name };
      send({
        form_name: formName,
        email: data.email || '',
        name: name,
        site_url: 'https://jonathanwallace.ca',
        tags_json: JSON.stringify(tags),
        data: data
      });
    } catch (err) { /* never interfere with the real submission */ }
  }, true);

  /* PDF / guide downloads -> explicit "Downloaded" event for a known lead.
     Anonymous downloads are left to the Follow Up Boss Pixel, since a CRM event
     needs an email; without one it cannot attach to a person. */
  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var isDl = a.hasAttribute('download') || /\.pdf($|\?|#)/i.test(href);
      if (!isDl) return;
      var lead = window.__jwLead;
      if (!lead || !lead.email) return; /* unknown visitor: pixel handles it */
      var file = (href.split('/').pop() || 'file').split('?')[0].split('#')[0];
      var label = (a.textContent || file).replace(/\s+/g, ' ').trim().slice(0, 80);
      send({
        form_name: 'download',
        email: lead.email,
        name: lead.name || '',
        site_url: 'https://jonathanwallace.ca',
        tags_json: JSON.stringify(['Website Lead', 'Downloaded PDF', 'File: ' + file, 'Page: ' + cleanPath()]),
        data: { method: 'download', topic: 'PDF download: ' + label, file: file, label: label, email: lead.email, first_name: (lead.name || '').split(' ')[0] || '' }
      });
    } catch (err) {}
  }, true);
})();

/* Follow Up Boss Pixel + cookie-consent notice.
   The pixel does return-visit / page tracking for anonymous visitors. Per CASL
   and PIPEDA it sets a tracking cookie, so it never loads until the visitor
   accepts. A site-wide consent notice (Midnight Estate styling) is injected on
   every page from this one file. The choice is remembered so the notice shows
   once, not on every page. Storage is best-effort: if it is blocked, the choice
   holds for the current visit and the notice returns next time, which is safe.

   The pixel is the Follow Up Boss Widget Tracker (FUB Admin -> Integrations ->
   Pixel). It activates through the one FUB_PIXEL_CODE constant below. While the
   code is empty no pixel loads, but the consent notice still behaves normally.
   The site-wide lead beacon above is independent of this and is unaffected
   either way. */
(function () {
  var FUB_PIXEL_CODE = 'WT-APBFKUQQ'; /* Follow Up Boss Widget Tracker code */
  var GA4_MEASUREMENT_ID = 'G-VR80KZH0EX'; /* Google Analytics 4 */
  var STORE_KEY = 'jw_cookie_consent_v1';
  var pixelLoaded = false;
  var mem = null; /* in-memory fallback if storage is unavailable */

  function readConsent() {
    try { var v = localStorage.getItem(STORE_KEY); if (v) return v; } catch (e) {}
    return mem;
  }
  function saveConsent(v) {
    mem = v;
    try { localStorage.setItem(STORE_KEY, v); } catch (e) {}
  }

  function loadPixel() {
    if (pixelLoaded || !FUB_PIXEL_CODE) return;
    pixelLoaded = true;
    /* Official Follow Up Boss Widget Tracker bootstrap, run only after consent. */
    (function (w, i, d, g, e, t) {
      w['WidgetTrackerObject'] = g;
      (w[g] = w[g] || function () { (w[g].q = w[g].q || []).push(arguments); }), (w[g].ds = 1 * new Date());
      (e = 'script'), (t = d.createElement(e)), (e = d.getElementsByTagName(e)[0]);
      t.async = 1; t.src = i; e.parentNode.insertBefore(t, e);
    })(window, 'https://widgetbe.com/agent', document, 'widgetTracker');
    window.widgetTracker('create', FUB_PIXEL_CODE);
    window.widgetTracker('send', 'pageview');
  }

  /* Google Analytics 4. Same consent gate as the FUB Pixel. Enhanced
     Measurement (pageviews, scrolls, outbound clicks, file downloads) is
     enabled by default in the GA4 property, so no extra event code needed. */
  var ga4Loaded = false;
  function loadGA4() {
    if (ga4Loaded || !GA4_MEASUREMENT_ID) return;
    ga4Loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, { send_page_view: true });
  }

  function showBanner() {
    if (document.getElementById('jwConsent')) return;
    var bar = document.createElement('div');
    bar.id = 'jwConsent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;'
      + 'max-width:560px;margin:0 auto;background:#1B1B1B;color:#F7F3EC;'
      + 'border:1px solid rgba(201,169,106,.35);border-radius:14px;'
      + 'box-shadow:0 14px 40px rgba(0,0,0,.4);padding:18px 20px;'
      + 'font-family:\'Nunito Sans\',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
      + 'font-size:.9rem;line-height:1.5;opacity:0;transform:translateY(8px);'
      + 'transition:opacity .35s ease,transform .35s ease;';
    bar.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;">'
      + '<p style="margin:0;flex:1 1 260px;min-width:220px;">This site uses cookies to see what visitors find useful and to improve the experience. '
      + 'You can accept or decline. Read the <a href="/privacy.html" style="color:#C9A96A;text-decoration:underline;">privacy policy</a> for details.</p>'
      + '<div style="display:flex;gap:10px;flex:0 0 auto;">'
      + '<button type="button" id="jwConsentDecline" style="cursor:pointer;background:transparent;color:#F7F3EC;'
      + 'border:1px solid rgba(247,243,236,.4);border-radius:999px;padding:9px 18px;font:inherit;">Decline</button>'
      + '<button type="button" id="jwConsentAccept" style="cursor:pointer;background:#C9A96A;color:#1B1B1B;'
      + 'border:1px solid #C9A96A;border-radius:999px;padding:9px 18px;font:inherit;font-weight:600;">Accept</button>'
      + '</div></div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.style.opacity = '1'; bar.style.transform = 'translateY(0)'; });

    function close() {
      bar.style.opacity = '0';
      bar.style.transform = 'translateY(8px)';
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 350);
    }
    document.getElementById('jwConsentAccept').addEventListener('click', function () {
      saveConsent('granted'); loadPixel(); loadGA4();
      try { document.dispatchEvent(new CustomEvent('jw:consent:granted')); } catch (e) {}
      close();
    });
    document.getElementById('jwConsentDecline').addEventListener('click', function () {
      saveConsent('denied'); close();
    });
  }

  function start() {
    var choice = readConsent();
    if (choice === 'granted') {
      loadPixel(); loadGA4();
      try { document.dispatchEvent(new CustomEvent('jw:consent:granted')); } catch (e) {}
      return;
    }
    if (choice === 'denied') { return; }
    showBanner();
  }

  if (document.body) { start(); }
  else { document.addEventListener('DOMContentLoaded', start); }
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
  /* GSI makes a third-party connection to Google, so it respects the same
     cookie consent gate as the FUB Pixel and GA4. If consent is already
     granted, load immediately. If not yet decided, wait for the Accept
     event dispatched by the consent handler. If declined, never load. */
  function loadGSI() {
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.onload = init;
    document.head.appendChild(s);
  }
  var CONSENT_KEY = 'jw_cookie_consent_v1';
  var consent;
  try { consent = localStorage.getItem(CONSENT_KEY); } catch (e) {}
  if (consent === 'granted') {
    loadGSI();
  } else if (consent !== 'denied') {
    document.addEventListener('jw:consent:granted', function () { loadGSI(); }, { once: true });
  }
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
    /* Labelled aggregate. The page carries two independent ratings, RateMyAgent
       and Google. Each one states its own source and count so the two figures
       read as separate corroboration rather than as the page disagreeing with
       itself. Google returns one decimal, RateMyAgent two. */
    var agg = (d.rating && d.total)
      ? '<p class="lead" style="margin-top:6px;">Rated <strong>' + (Math.round(d.rating * 10) / 10).toFixed(1) + ' \u2605</strong> from <strong>' + d.total + ' Google reviews</strong>, separate from the RateMyAgent reviews above.</p>'
      : '';
    host.innerHTML = '<p class="eyebrow" style="margin-top:44px;">Fresh from Google</p>' + agg
      + '<div class="grid grid--3" style="margin-top:16px;text-align:left;">' + cards + '</div>' + mapsLink;
    host.style.display = '';
  }).catch(function(){});
})();
