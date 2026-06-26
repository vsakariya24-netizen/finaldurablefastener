export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const SUPABASE_URL = "https://wterhjmgsgyqgbwviomo.supabase.co";

    // ✅ Handle CORS Preflight Requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, accept-profile, content-profile, x-supabase-api-version, x-upsert",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ✅ NEW: Handle DELETE requests for images
    if (url.pathname === "/api/delete" && request.method === "DELETE") {
      return handleDelete(request, env);
    }

    // ✅ Handle Image Uploads directly to R2
    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }

    // ✅ Serve Images Permanently From Cloudflare R2
    if (url.pathname.startsWith("/cdn/")) {
      return handleServeImage(request, env);
    }

    // ✅ Google Reviews Route
    if (url.pathname === "/api/reviews" && request.method === "GET") {
      return handleGoogleReviews(request, env);
    }

    // ✅ Standard Supabase Proxy
    return handleSupabaseProxy(request, env, SUPABASE_URL);
  },
};

// ============================================
// HANDLER: Upload Images to R2
// ============================================
async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filePath = formData.get('filePath');

    if (!file || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing file or filePath' }), 
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!env.BUCKET) {
      return new Response(
        JSON.stringify({ error: "R2 Bucket binding 'BUCKET' is missing." }), 
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Put file directly into the bound R2 Bucket
    await env.BUCKET.put(filePath, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // Construct and return your exact R2 public URL
    const publicUrl = `https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev/${filePath}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }), 
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}

// ============================================
// ✅ NEW HANDLER: Delete Images from R2
// ============================================
async function handleDelete(request, env) {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing file path parameter' }), 
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
    
    if (!env.BUCKET) {
      return new Response(
        JSON.stringify({ error: "R2 Bucket binding 'BUCKET' is missing." }), 
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
    
    // Decode the file path (in case it has special characters)
    const decodedPath = decodeURIComponent(filePath);
    
    // Check if file exists before deleting (optional)
    const object = await env.BUCKET.get(decodedPath);
    if (object === null) {
      return new Response(
        JSON.stringify({ error: 'File not found', path: decodedPath }), 
        { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
    
    // Delete the file from R2
    await env.BUCKET.delete(decodedPath);
    
    return new Response(
      JSON.stringify({ success: true, path: decodedPath, message: 'File deleted successfully' }), 
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}

// ============================================
// HANDLER: Serve Images from R2
// ============================================
async function handleServeImage(request, env) {
  if (!env.BUCKET) {
    return new Response(JSON.stringify({ error: "R2 Bucket binding 'BUCKET' is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const url = new URL(request.url);
  const filename = url.pathname.replace("/cdn/", "");
  
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const object = await env.BUCKET.get(filename);

    if (object === null) {
      return new Response("Image Not Found in R2", { 
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "R2 retrieval failed", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// ============================================
// HANDLER: Google Reviews
// ============================================
async function handleGoogleReviews(request, env) {
  const PLACE_ID = "ChIJr-Xe6gXLWTkR_HMq1UxmLzE";
  const CACHE_TTL = 60 * 60 * 24;

  const cache = caches.default;
  const cacheKey = new Request("https://internal-cache/google-reviews-v1");
  const cachedRes = await cache.match(cacheKey);

  if (cachedRes) {
    const cloned = new Response(cachedRes.body, cachedRes);
    cloned.headers.set("X-Cache", "HIT");
    cloned.headers.set("Access-Control-Allow-Origin", "*");
    return cloned;
  }

  try {
    const GOOGLE_API_KEY = env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing API key",
        details: "GOOGLE_API_KEY not set in Worker environment"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const googleUrl =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${PLACE_ID}` +
      `&fields=name,rating,user_ratings_total,reviews` +
      `&language=en` +
      `&key=${GOOGLE_API_KEY}`;

    const googleRes = await fetch(googleUrl);
    const raw = await googleRes.json();

    if (!raw.result) {
      return new Response(JSON.stringify({
        error: "No result from Google",
        google_status: raw.status,
        raw_response: raw
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const payload = {
      result: {
        reviews: raw.result.reviews || [],
        rating: raw.result.rating || 4.9,
        total: raw.result.user_ratings_total || 0,
      },
      cachedAt: new Date().toISOString(),
    };

    const response = new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
      },
    });

    await cache.put(cacheKey, response.clone());
    return response;

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Worker fetch failed",
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// ============================================
// HANDLER: Supabase Proxy
// ============================================
async function handleSupabaseProxy(request, env, SUPABASE_URL) {
  const newHeaders = new Headers(request.headers);
  newHeaders.delete("Host");
  newHeaders.set("Origin", SUPABASE_URL);
  newHeaders.set("Host", "wterhjmgsgyqgbwviomo.supabase.co");

  let body = null;
  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  
  if (hasBody) {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      body = await request.clone().arrayBuffer();
      if (body.byteLength === 0) body = null;
    }
  }

  const url = new URL(request.url);
  const modifiedRequest = new Request(
    SUPABASE_URL + url.pathname + url.search,
    { 
      method: request.method, 
      headers: newHeaders, 
      body: body, 
      redirect: "follow" 
    }
  );

  try {
    const response = await fetch(modifiedRequest);
    const newResponseHeaders = new Headers(response.headers);
    newResponseHeaders.set("Access-Control-Allow-Origin", "*");
    newResponseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    newResponseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info, accept-profile, content-profile, x-supabase-api-version, x-upsert");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newResponseHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}