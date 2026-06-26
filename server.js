import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const GOOGLE_API_KEY = 'AIzaSyDGYS0VmWRJv35d9E6rcUhJE6JLnrLJ-Q0AIzaSyDGYS0VmWRJv35d9E6rcUhJE6JLnrLJ-Q0';
const PLACE_ID = 'ChIJr-Xe6gXLWTkR_HMq1UxmLzE';
app.get('/api/reviews', async (req, res) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: PLACE_ID,
          fields: 'name,rating,reviews',
          key: GOOGLE_API_KEY,
          language: 'en'
        }
      }
    );

    const data = response.data.result;

    res.json({
      businessName: data.name,
      overallRating: data.rating,
      reviews: data.reviews || []
    });

  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.listen(5000, () => console.log('✅ Server running on port 5000'));