import fetch from 'node-fetch';

// ✅ Vercel Serverless Function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GOOGLE_API_KEY;
  const PLACE_ID = "ChIJr-Xe6gXLWTkR_HMq1UxmLzE";

  if (!API_KEY) {
    return res.status(500).json({
      error: "Missing API Key",
      details: "GOOGLE_API_KEY not set in Vercel Environment Variables"
    });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${PLACE_ID}` +
      `&fields=name,rating,user_ratings_total,reviews` +
      `&language=en` +
      `&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result) {
      return res.status(502).json({
        error: "No result from Google",
        google_status: data.status,
        raw: data
      });
    }

    // ✅ Frontend ke saath match karta format
    return res.status(200).json({
      result: {
        reviews: data.result.reviews || [],
        rating: data.result.rating || 4.9,
        total: data.result.user_ratings_total || 0,
      },
      cachedAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}