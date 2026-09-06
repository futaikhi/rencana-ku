export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Try to serve the static file first (CSS, JS, images, etc.)
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status === 200) {
      // File found - return it with correct MIME type
      // Apply security headers
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "SAMEORIGIN");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return new Response(assetResponse.body, {
        status: 200,
        headers,
      });
    }

    // 2. SPA fallback: serve index.html for all non-static routes
    const indexRequest = new Request(new URL("/index.html", url.origin).toString());
    const indexResponse = await env.ASSETS.fetch(indexRequest);

    const headers = new Headers(indexResponse.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return new Response(indexResponse.body, {
      status: 200,
      headers,
    });
  },
};
