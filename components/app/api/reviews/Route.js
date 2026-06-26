// app/api/reviews/route.js
// This runs SERVER-SIDE so your API key stays secret

export async function GET() {
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const PLACE_ID = process.env.GOOGLE_PLACE_ID;

  if (!API_KEY || !PLACE_ID) {
    return Response.json(
      { error: "Missing API key or Place ID in environment variables" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews&key=${API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour (ISR)
    );

    if (!res.ok) throw new Error("Failed to fetch from Google API");

    const data = await res.json();

    if (data.status !== "OK") {
      return Response.json(
        { error: data.error_message || data.status },
        { status: 400 }
      );
    }

    return Response.json({
      name: data.result.name,
      rating: data.result.rating,
      totalRatings: data.result.user_ratings_total,
      reviews: data.result.reviews || [],
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}