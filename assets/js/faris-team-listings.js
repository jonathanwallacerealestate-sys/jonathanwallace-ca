/* Faris Team listings on /listings/. Renders from assets/data/faris-team-listings.json
   using the same .listing-card markup as Jonathan's own cards. */
(function () {
  var root = document.getElementById('faris-team-listings');
  if (!root) return;

  var grid = root.querySelector('[data-faris-grid]');
  var status = root.querySelector('[data-faris-status]');
  if (!grid) return;

  function money(n) {
    var num = Number(n);
    if (!isFinite(num)) return String(n || '');
    return '$' + num.toLocaleString('en-CA');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function metaLine(item) {
    var parts = [];
    if (item.beds) parts.push(item.beds + ' bd');
    if (item.baths) parts.push(item.baths + ' ba');
    return parts.join(' · ');
  }

  function summary(item) {
    var bits = [];
    if (item.beds && item.baths) {
      bits.push(item.beds + ' bedrooms, ' + item.baths + ' bathrooms');
    } else if (item.type) {
      bits.push(item.type);
    }
    if (item.town) bits.push('in ' + item.town);
    bits.push('See the full listing on REALTOR.ca.');
    if (bits.length === 1) return bits[0];
    if (item.beds && item.baths) {
      return bits[0] + (item.town ? ' in ' + item.town : '') + '. See the full listing on REALTOR.ca.';
    }
    return (item.type || 'Listing') + (item.town ? ' in ' + item.town : '') + '. See the full listing on REALTOR.ca.';
  }

  function card(item) {
    var meta = metaLine(item);
    var place = item.town ? item.town + ', Ontario' : 'Ontario';
    var eyebrow = item.town || 'Georgian Bay';
    var alt = 'Photo of ' + (item.address || 'listing');
    var img = item.imageUrl
      ? '<img src="' + esc(item.imageUrl) + '" alt="' + esc(alt) + '" width="1600" height="1067" loading="lazy" decoding="async" onerror="this.removeAttribute(\'src\'); this.alt=\'Photo unavailable\';">'
      : '';
    return (
      '<a class="listing-card" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
        img +
        '<div class="listing-card__body">' +
          '<p class="eyebrow">' + esc(eyebrow) + '</p>' +
          '<h2>' + esc(item.address) + '</h2>' +
          '<p class="listing-card__place">' + esc(place) + '</p>' +
          '<p class="listing-card__price">' + esc(money(item.price)) + '</p>' +
          (meta ? '<p class="listing-card__meta">' + esc(meta) + '</p>' : '') +
          '<p>' + esc(summary(item)) + '</p>' +
          '<span class="btn btn--primary">View this home</span>' +
        '</div>' +
      '</a>'
    );
  }

  fetch('/assets/data/faris-team-listings.json', { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('Could not load Faris Team listings');
      return r.json();
    })
    .then(function (data) {
      var list = (data && data.listings) || [];
      if (!list.length) {
        if (status) status.textContent = 'No Faris Team listings to show right now.';
        return;
      }
      grid.innerHTML = list.map(card).join('');
      if (status) status.textContent = '';
    })
    .catch(function () {
      if (status) status.textContent = 'Team listings could not load. Refresh the page, or check back shortly.';
    });
})();
