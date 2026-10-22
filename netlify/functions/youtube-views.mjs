const VIDEO_ID = "PV3rpHzCiDI";

const cacheHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Netlify-CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=300"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cacheHeaders });
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { Allow: "GET" } });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return json({ error: "not_configured" }, 503);

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
  endpoint.searchParams.set("part", "statistics");
  endpoint.searchParams.set("id", VIDEO_ID);
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return json({ error: "youtube_unavailable" }, 502);

    const payload = await response.json();
    const rawViews = payload.items?.[0]?.statistics?.viewCount;
    if (typeof rawViews !== "string" || !/^\d+$/.test(rawViews)) {
      return json({ error: "view_count_unavailable" }, 502);
    }

    return json({
      videoId: VIDEO_ID,
      views: Number(rawViews),
      fetchedAt: new Date().toISOString()
    });
  } catch {
    return json({ error: "youtube_unavailable" }, 502);
  }
}
