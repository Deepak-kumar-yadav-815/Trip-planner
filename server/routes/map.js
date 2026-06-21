import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';

const router = express.Router();

// Fetch places from OpenTripMap
router.post('/places', requireAuth, syncUser, async (req, res) => {
  try {
    const { lat, lon, kinds, radius = 5000 } = req.body;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const API_KEY = process.env.OPEN_TRIP_MAP_KEY;
    const kindFilter = kinds && kinds.length > 0 ? kinds.join(',') : 'interesting_places';

    if (!API_KEY || API_KEY === 'YOUR_KEY_HERE') {
      console.warn("OPEN_TRIP_MAP_KEY is missing or invalid. Returning fallback mock data.");
      return res.json([
        { xid: 'mock1', name: 'Mock Tourist Attraction', kinds: 'tourist_facilities', lat: lat + 0.001, lon: lon + 0.001, rate: 5 },
        { xid: 'mock2', name: 'Mock Historical Site', kinds: 'cultural,historic', lat: lat - 0.001, lon: lon - 0.001, rate: 4 },
        { xid: 'mock3', name: 'Mock Cafe', kinds: 'foods,cafes', lat: lat + 0.002, lon: lon - 0.002, rate: 3 }
      ]);
    }

    // Call OpenTripMap API
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kindFilter}&rate=2&format=json&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenTripMap API failed with status ${response.status}`);
      throw new Error('Failed to fetch from OpenTripMap');
    }

    let data = await response.json();
    
    // Sort by rate descending and take top 10
    if (Array.isArray(data)) {
        data = data.sort((a, b) => b.rate - a.rate).slice(0, 10);
    }

    res.json(data);

  } catch (error) {
    console.error('Error in /api/map/places:', error);
    // Graceful fallback on error
    const { lat, lon } = req.body;
    res.json([
        { xid: 'err_mock1', name: 'Fallback Landmark (API Error)', kinds: 'tourist_facilities', lat: lat + 0.001, lon: lon + 0.001, rate: 5 },
    ]);
  }
});

export default router;
