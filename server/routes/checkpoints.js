import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Checkpoint from '../models/Checkpoint.js';
import Trip from '../models/Trip.js';
import { broadcastToTrip } from '../services/notification.js';
import { generateCheckpointSummary } from '../services/ai.js';
import { GoogleGenAI } from '@google/genai';
import { getIo } from '../socket.js';

const router = express.Router({ mergeParams: true }); // to access :tripId from parent router

// We'll map this router in index.js to /api/trips/:tripId/checkpoints

// Add a checkpoint
router.post('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { name, type, rating, openHours, location, notes } = req.body;
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Validate user is part of trip
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const checkpoint = await Checkpoint.create({
      tripId,
      name,
      type,
      rating,
      openHours,
      location,
      notes: notes || '',
      visitedBy: []
    });

    trip.checkpoints.push(checkpoint._id);
    await trip.save();

    // Broadcast notification
    await broadcastToTrip(
      tripId, 
      `📍 ${req.dbUser.name} added a new checkpoint: ${name}`, 
      'info', 
      req.dbUser._id
    );

    // Emit real-time socket event
    const io = getIo();
    if (io) io.to(tripId).emit('checkpoint_added', checkpoint);

    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Error adding checkpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Mark checkpoint as visited for ALL members (per architecture: left button)
router.post('/:checkpointId/visit', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, checkpointId } = req.params;
    
    // In this simplified architecture, marking visited sets the user, or sets all? 
    // "mark checkpoint as visited for ALL members" - we can just add all members to visitedBy.
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint) return res.status(404).json({ error: 'Checkpoint not found' });

    // Mark for all members
    const allMemberIds = trip.members.map(m => m.user);
    checkpoint.visitedBy = allMemberIds;
    await checkpoint.save();

    // Emit real-time socket event
    const io = getIo();
    if (io) io.to(tripId).emit('checkpoint_updated', checkpoint);

    res.json(checkpoint);
  } catch (error) {
    console.error('Error marking checkpoint visited:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get AI Summary for checkpoint (Right button)
router.post('/:checkpointId/summary', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, checkpointId } = req.params;
    const checkpoint = await Checkpoint.findById(checkpointId);
    
    if (!checkpoint) return res.status(404).json({ error: 'Checkpoint not found' });

    // If summary already exists in DB, return it to save LLM calls
    if (checkpoint.aiSummary && checkpoint.aiSummary !== "Summary currently unavailable due to AI service issue.") {
      return res.json({ summary: checkpoint.aiSummary });
    }

    // Generate new summary
    const summary = await generateCheckpointSummary(checkpoint.name, checkpoint.type || 'Point of Interest');
    checkpoint.aiSummary = summary;
    await checkpoint.save();

    // Broadcast notification that summary is ready
    await broadcastToTrip(
      tripId,
      `✨ AI Summary generated for ${checkpoint.name}`,
      'success'
    );

    // Emit real-time socket event
    const io = getIo();
    if (io) io.to(tripId).emit('checkpoint_updated', checkpoint);

    res.json({ summary: checkpoint.aiSummary });
  } catch (error) {
    console.error('Error fetching AI summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Explore Places via AI
router.post('/explore', requireAuth, syncUser, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Return a JSON array of up to 5 places matching this search: "${query}". Each object must have "name", "lat", and "lng" (as numbers), and a short "description". Respond ONLY with valid JSON, without any markdown formatting like \`\`\`json.`;
    
    const interaction = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: prompt,
    });
    
    let rawText = interaction.output_text.trim();
    if (rawText.startsWith('\`\`\`json')) rawText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    if (rawText.startsWith('\`\`\`')) rawText = rawText.replace(/\`\`\`/g, '');
    
    const places = JSON.parse(rawText);
    res.json(places);
  } catch (error) {
    console.error('Error exploring places with AI:', error);
    res.status(500).json({ error: 'Failed to explore places' });
  }
});
// Delete Checkpoint
router.delete('/:checkpointId', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, checkpointId } = req.params;
    
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Validate user is part of trip
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    // Delete the actual checkpoint document
    await Checkpoint.findByIdAndDelete(checkpointId);

    // Remove the reference from the trip's checkpoints array
    trip.checkpoints = trip.checkpoints.filter(id => id.toString() !== checkpointId);
    await trip.save();

    // Emit real-time socket event
    const io = getIo();
    if (io) io.to(tripId).emit('checkpoint_removed', checkpointId);

    res.json({ message: 'Checkpoint removed successfully' });
  } catch (error) {
    console.error('Error removing checkpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Reorder Checkpoint
router.put('/:checkpointId/reorder', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, checkpointId } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const index = trip.checkpoints.findIndex(id => id.toString() === checkpointId);
    if (index === -1) return res.status(404).json({ error: 'Checkpoint not found in trip' });

    const newCheckpoints = [...trip.checkpoints];
    if (direction === 'up' && index > 0) {
      const temp = newCheckpoints[index - 1];
      newCheckpoints[index - 1] = newCheckpoints[index];
      newCheckpoints[index] = temp;
    } else if (direction === 'down' && index < newCheckpoints.length - 1) {
      const temp = newCheckpoints[index + 1];
      newCheckpoints[index + 1] = newCheckpoints[index];
      newCheckpoints[index] = temp;
    }

    trip.checkpoints = newCheckpoints;
    await trip.save();

    const io = getIo();
    // Since we reordered, the trip structure changed.
    // The client might need to fetch the full trip again, 
    // or we can emit a specific event that re-fetches the trip.
    // We'll emit trip_reordered and let the client re-fetch.
    if (io) io.to(tripId).emit('trip_updated');

    res.json({ message: 'Checkpoint reordered successfully' });
  } catch (error) {
    console.error('Error reordering checkpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
