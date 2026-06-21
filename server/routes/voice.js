import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import { AccessToken } from 'livekit-server-sdk';
import Trip from '../models/Trip.js';

const router = express.Router({ mergeParams: true });

router.get('/token', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Validate trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const roomName = `trip-${tripId}`;
    const participantName = req.dbUser.name;

    // Create Access Token
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: req.dbUser._id.toString(),
      name: participantName,
    });
    
    // Grant permissions
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
