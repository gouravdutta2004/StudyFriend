export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Dynamic Network API Proxy
    // ------------------------------------
    if (url.pathname.startsWith('/api/')) {
      // TODO: Replace this default port with your live backend production URL when deploying your backend
      // Example: 'https://studybuddy-backend.onrender.com' + url.pathname + url.search
      return fetch(new Request('http://localhost:5001' + url.pathname + url.search, request));
    }

    // 2. Native SPA Resolving Node
    // ------------------------------------
    try {
      // Try resolving static resource payload cleanly
      let response = await env.ASSETS.fetch(request);
      
      // If asset missing completely (e.g., refreshing a nested /arcade or /dashboard URL), fallback to base html!
      if (response.status === 404) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
      }
      return response;
    } catch (e) {
      return new Response('Edge Edge Resolution Error: ' + e.message, { status: 500 });
    }
  }
};
