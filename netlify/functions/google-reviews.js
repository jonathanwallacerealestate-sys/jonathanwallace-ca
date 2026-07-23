// netlify/functions/google-reviews.js
// Returns Jonathan Wallace's latest Google reviews as JSON, fetched server-side
// from the Google Places API so the API key never reaches the browser.
// Endpoint: /.netlify/functions/google-reviews
//
// Environment variables (set in Netlify → Site settings → Environment variables):
//   GOOGLE_PLACES_API_KEY   (required) — a Google Cloud key with "Places API" enabled
//   GOOGLE_PLACE_ID         (optional) — the Google Place ID for the business
//   GOOGLE_PLACE_QUERY      (optional) — fallback text search if no Place ID is set
//                                        default: "Jonathan Wallace Faris Team Real Estate Midland Ontario"
//
// If the key is not set yet, the function returns { configured:false, reviews:[] }
// with HTTP 200 so the site renders normally and simply hides the Google row.

const DEFAULT_QUERY = 'Jonathan Wallace Faris Team Real Estate Midland Ontario';

exports.handler = async function () {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    // Cache at Netlify's edge for 24h (serve stale while revalidating) so we hit
    // Google roughly once a day, keeping Places API cost negligible.
    'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    'Access-Control-Allow-Origin': '*'
  };

  if (!key) {
    return { statusCode: 200, headers, body: JSON.stringify({ configured: false, reviews: [] }) };
  }

  try {
    let placeId = process.env.GOOGLE_PLACE_ID;

    // Resolve a Place ID from a text query if one was not provided.
    if (!placeId) {
      const query = process.env.GOOGLE_PLACE_QUERY || DEFAULT_QUERY;
      const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
        + '?input=' + encodeURIComponent(query)
        + '&inputtype=textquery&fields=place_id&key=' + encodeURIComponent(key);
      const fr = await fetch(findUrl);
      const fj = await fr.json();
      if (fj && fj.candidates && fj.candidates[0]) placeId = fj.candidates[0].place_id;
      if (!placeId) throw new Error('Find Place ' + (fj && fj.status) + (fj && fj.error_message ? ': ' + fj.error_message : ''));
    }

    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
      + '?place_id=' + encodeURIComponent(placeId)
      + '&fields=name,rating,user_ratings_total,reviews,url'
      + '&reviews_sort=newest&language=en&key=' + encodeURIComponent(key);
    const res = await fetch(detailsUrl);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('Places API status ' + data.status + (data.error_message ? ': ' + data.error_message : ''));

    const r = data.result || {};
    const reviews = (r.reviews || []).map(function (rv) {
      return {
        author: rv.author_name || '',
        author_url: rv.author_url || '',
        photo: rv.profile_photo_url || '',
        rating: rv.rating || 5,
        text: (rv.text || '').trim(),
        relative_time: rv.relative_time_description || '',
        time: rv.time || 0
      };
    }).filter(function (rv) { return rv.text; });

    reviews.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: true,
        place_id: placeId,
        name: r.name || 'Jonathan Wallace',
        rating: r.rating || null,
        total: r.user_ratings_total || null,
        maps_url: r.url || '',
        reviews: reviews
      })
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ configured: true, error: String(err && err.message || err), reviews: [] }) };
  }
};
