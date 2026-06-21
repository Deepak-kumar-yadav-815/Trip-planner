import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import User from '../models/User.js';
import { broadcastToTrip } from '../services/notification.js';
import Trip from '../models/Trip.js';

const router = express.Router();

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { name, email, avatar } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let user = await User.findOne({ clerkId: userId });
    
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.avatar = avatar || user.avatar;
      await user.save();
    } else {
      user = await User.create({
        clerkId: userId,
        name: name || 'Traveler',
        email: email || 'no-email@provided.com',
        avatar
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in /users/sync:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update user status
router.put('/me/status', requireAuth, syncUser, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const user = req.dbUser;
    user.currentStatus = status;

    // Check if it's a preset. If not, add to custom statuses.
    const presets = ["need help", "fine", "on the way", "taking a break", "running late"];
    if (!presets.includes(status.toLowerCase()) && !user.customStatuses.includes(status)) {
      user.customStatuses.push(status);
    }

    await user.save();

    // If status is Need Help, broadcast notification to all trips this user is in
    if (status.toLowerCase() === 'need help') {
      const activeTrips = await Trip.find({ 'members.user': user._id });
      for (const trip of activeTrips) {
        await broadcastToTrip(trip._id, `🚨 ${user.name} needs help in trip "${trip.title}"!`, 'alert', user._id);
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Remove a custom status
router.delete('/me/custom-status', requireAuth, syncUser, async (req, res) => {
  try {
    const { status } = req.body; // sending payload in DELETE is allowed, or we can use URL params
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const user = req.dbUser;
    user.customStatuses = user.customStatuses.filter(s => s !== status);
    
    // If the deleted status was the active one, revert to default
    if (user.currentStatus === status) {
      user.currentStatus = 'Fine';
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error deleting custom status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
