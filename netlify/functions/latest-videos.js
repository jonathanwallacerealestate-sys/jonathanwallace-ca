// netlify/functions/latest-videos.js
// Returns the channel's latest YouTube uploads as JSON.
// No API key needed — reads the public channel RSS feed.
// Endpoint: /.netlify/functions/latest-videos?channel=UC...&limit=3

const DEFAULT_CHANNEL = 'UCaSi1dk0eFsjSlgtN9q5i2A'; // @jonathanwallaceRE

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const channel = q.channel || DEFAULT_CHANNEL;
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 3, 1), 10);
  const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(channel);

  function decodeEntities(t) {
    return (t || '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
  }

  try {
    const res = await fetch(feedUrl, { headers: { 'User-Agent': 'jonathanwallace.ca/1.0 (+netlify-function)' } });
    if (!res.ok) throw new Error('Feed responded ' + res.status);
    const xml = await res.text();

    const videos = xml.split('<entry>').slice(1).map(function (entry) {
      function pick(re) { const m = entry.match(re); return m ? m[1] : ''; }
      const id = pick(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const title = decodeEntities(pick(/<title>([\s\S]*?)<\/title>/));
      const published = pick(/<published>([^<]+)<\/published>/);
      const thumb = pick(/<media:thumbnail[^>]*url="([^"]+)"/) ||
        (id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '');
      return { id: id, title: title, published: published, thumbnail: thumb, url: 'https://www.youtube.com/watch?v=' + id };
    }).filter(function (v) { return v.id; }).slice(0, limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ channel: channel, count: videos.length, videos: videos })
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Could not load videos', detail: String((err && err.message) || err) })
    };
  }
};
