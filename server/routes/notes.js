import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Note from '../models/Note.js';
import Trip from '../models/Trip.js';
import { broadcastToTrip } from '../services/notification.js';

const router = express.Router({ mergeParams: true });

// Get all notes for a trip (with Redis caching)
router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { redisClient } = req;
    
    // Auth Check
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const redisKey = `trip:${tripId}:notes`;
    
    // Try to get from Redis Cache first
    if (redisClient) {
      const cachedNotes = await redisClient.get(redisKey);
      if (cachedNotes) {
        return res.json(JSON.parse(cachedNotes));
      }
    }

    // Cache Miss: Fetch from MongoDB
    const notes = await Note.find({ tripId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar clerkId');
      
    // Save to Redis (Expire in 1 hour just to be safe, though we actively invalidate it)
    if (redisClient) {
      await redisClient.setEx(redisKey, 3600, JSON.stringify(notes));
    }
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new note
router.post('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { content, color } = req.body;
    const { redisClient, io } = req;
    
    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Create in DB
    let newNote = await Note.create({
      tripId,
      author: req.dbUser._id,
      content,
      color: color || 'bg-card'
    });
    
    newNote = await newNote.populate('author', 'name avatar clerkId');

    // Invalidate Redis Cache
    if (redisClient) {
      await redisClient.del(`trip:${tripId}:notes`);
    }

    // Broadcast to room
    if (io) {
      io.to(tripId).emit('note_added', newNote);
    }
    
    // Create notifications for other members
    await broadcastToTrip(tripId, `${req.dbUser.name} added a new note`, 'info', req.dbUser._id);

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a note
router.put('/:noteId', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, noteId } = req.params;
    const { content, color } = req.body;
    const { redisClient, io } = req;
    
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    if (note.author.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own notes' });
    }

    if (content) note.content = content;
    if (color) note.color = color;
    
    await note.save();
    await note.populate('author', 'name avatar clerkId');

    // Invalidate Redis Cache
    if (redisClient) {
      await redisClient.del(`trip:${tripId}:notes`);
    }

    // Broadcast to room
    if (io) {
      io.to(tripId).emit('note_updated', note);
    }

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a note
router.delete('/:noteId', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, noteId } = req.params;
    const { redisClient, io } = req;
    
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    if (note.author.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own notes' });
    }

    await note.deleteOne();

    // Invalidate Redis Cache
    if (redisClient) {
      await redisClient.del(`trip:${tripId}:notes`);
    }

    // Broadcast to room
    if (io) {
      io.to(tripId).emit('note_deleted', noteId);
    }

    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
