export default {
  async fetch(request, env) {
    // 1. YOUR ACTUAL SUPABASE URL (Replace 'your-project-id' with your real ID)
    const TARGET_HOST = "wterhjmgsgyqgbwviomo.supabase.co"; 
    const TARGET_URL = `https://${TARGET_HOST}`;

    const url = new URL(request.url);
    
    // 2. Prepare the new request to Supabase
    const proxyRequest = new Request(TARGET_URL + url.pathname + url.search, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: "follow",
    });

    // 3. Set the 'Host' header so Supabase recognizes the request
    proxyRequest.headers.set("Host", TARGET_HOST);

    // 4. Handle CORS (This stops your browser from blocking the connection)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      const response = await fetch(proxyRequest);
      
      // 5. Clone the response and add CORS headers for your website
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Access-Control-Allow-Origin", "*");
      newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      
      return newResponse;
    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  },
};