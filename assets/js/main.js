/* jonathanwallace.ca — minimal site JS */
(function () {
  // Mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    // close menu when a link is tapped
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Current year in footers
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* Latest 3 YouTube uploads on the homepage.
   Reads /.netlify/functions/latest-videos (which fetches the channel RSS).
   Click a thumbnail to play the video inline. Falls back to a "Watch on
   YouTube" button if the function is unavailable (e.g. before deploy). */
(function () {
  var box = document.getElementById('latestVideos');
  if (!box) return;

  var channel = box.getAttribute('data-yt-channel') || '';
  var endpoint = '/.netlify/functions/latest-videos' + (channel ? ('?channel=' + encodeURIComponent(channel)) : '');

  function esc(t) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function node(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function card(v) {
    var thumb = v.thumbnail || ('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
    var art = node(
      '<article class="video">' +
        '<button class="video__thumb" style="background-image:url(\'' + thumb + '\');" aria-label="Play: ' + esc(v.title) + '">' +
          '<span class="video__play">&#9658;</span>' +
        '</button>' +
        '<div class="video__body"><h4>' + esc(v.title) + '</h4>' +
        '<div class="video__meta">YouTube &middot; ' + fmtDate(v.published) + '</div></div>' +
      '</article>'
    );
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

  function fallback() {
    box.innerHTML =
      '<div class="video" style="grid-column:1/-1;text-align:center;padding:28px;">' +
        '<p style="margin:0 0 14px;">See the latest Georgian Bay home tours on YouTube.</p>' +
        '<a class="btn btn--primary" href="https://youtube.com/@jonathanwallaceRE" target="_blank" rel="noopener">&#9658; Watch on YouTube</a>' +
      '</div>';
  }

  fetch(endpoint, { headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var vids = (data && data.videos) || [];
      if (!vids.length) return fallback();
      box.innerHTML = '';
      vids.slice(0, 3).forEach(function (v) { box.appendChild(card(v)); });
    })
    .catch(fallback);
})();
