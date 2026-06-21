import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET all notifications for current user
router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.dbUser._id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT mark as read
router.put('/:id/read', requireAuth, syncUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.dbUser._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE clear all notifications for user
router.delete('/', requireAuth, syncUser, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.dbUser._id });
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
