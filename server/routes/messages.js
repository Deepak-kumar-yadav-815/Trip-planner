import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Trip from '../models/Trip.js';
import { createClient } from 'redis';

// Note: In production we'd reuse the redis client from index.js via app.get('redis') or a service export.
// For now we reconnect or use a simpler DB fallback. We'll fallback to DB since we might not have exported redis client.
const router = express.Router({ mergeParams: true });

router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Auth Check
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    // Fetch from MongoDB (in a real app, try Redis LRANGE first)
    // To keep it simple and robust, we fetch from DB and rely on socket for real-time appends
    const messages = await Message.find({ tripId }).sort({ createdAt: 1 }).limit(100).populate('sender', 'name avatar clerkId');
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
