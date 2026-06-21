import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Trip from '../models/Trip.js';
import Expense from '../models/Expense.js';
import Note from '../models/Note.js';
import Message from '../models/Message.js';
import Media from '../models/Media.js';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { broadcastToTrip } from '../services/notification.js';

const router = express.Router();

// Generate a random 6-character alphanumeric join ID
const generateJoinId = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// Get all trips for the current user
router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const trips = await Trip.find({ 'members.user': req.dbUser._id })
      .populate('members.user', 'name avatar currentStatus customStatuses clerkId')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new trip
router.post('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { title, description, startDate } = req.body;
    
    const newTrip = await Trip.create({
      title,
      description,
      startDate,
      joinId: generateJoinId(),
      members: [{
        user: req.dbUser._id,
        role: 'admin',
        activeStatus: true
      }]
    });

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Join a trip via joinId
router.post('/join', requireAuth, syncUser, async (req, res) => {
  try {
    const { joinId } = req.body;
    
    if (!joinId) return res.status(400).json({ error: 'Join ID is required' });

    const trip = await Trip.findOne({ joinId: joinId.toUpperCase() });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Check if already a member
    const isMember = trip.members.some(m => m.user.toString() === req.dbUser._id.toString());
    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this trip' });
    }

    trip.members.push({
      user: req.dbUser._id,
      role: 'member',
      activeStatus: true
    });

    await trip.save();
    
    // We will later add an email / socket notification here

    res.json(trip);
  } catch (error) {
    console.error('Error joining trip:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get single trip details
router.get('/:id', requireAuth, syncUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('members.user', 'name email avatar currentStatus customStatuses clerkId')
      .populate('checkpoints');
      
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Check if user is a member
    const isMember = trip.members.some(m => m.user._id.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Finalize Trip & Generate Global Summary
router.post('/:id/finalize', requireAuth, syncUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('members.user', 'name')
      .populate('checkpoints');
    
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const isMember = trip.members.find(m => m.user._id.toString() === req.dbUser._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });
    
    // Calculate basic expense metrics
    const expenses = await Expense.find({ tripId: trip._id }).populate('paidBy', 'name');
    let totalSpent = 0;
    expenses.forEach(e => totalSpent += e.amount);

    // Filter to only visited checkpoints
    const visitedCheckpoints = trip.checkpoints.filter(cp => cp.visitedBy && cp.visitedBy.length > 0);
    const placesStr = visitedCheckpoints.map(cp => cp.name).join(', ') || 'No places added.';
    const membersStr = trip.members.map(m => m.user.name).join(', ');

    // Fetch Notes
    const notes = await Note.find({ tripId: trip._id }).populate('author', 'name');
    const notesStr = notes.map(n => `[${n.author.name}]: ${n.content}`).join('\n') || 'No notes.';

    // Fetch Messages (last 50 texts for vibe)
    const messages = await Message.find({ tripId: trip._id, type: 'text' })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    messages.reverse(); // chronological
    const chatStr = messages.map(m => `[${m.sender.name}]: ${m.content}`).join('\n') || 'No chat messages.';

    // Fetch Media (limit to 2 images as requested)
    const media = await Media.find({ tripId: trip._id }).limit(2);

    const prompt = `Write a fun, celebratory Markdown summary for our completed trip "${trip.title}". 
We visited these places: ${placesStr}. 
Trip members were: ${membersStr}.
Total money spent on this trip: ${totalSpent} INR.

Here are some notes we took during the trip:
${notesStr}

Here are snippets from our group chat:
${chatStr}

Use all this context (and the attached images if any) to make it highly engaging! Summarize the vibe, incorporate inside jokes from the chat or notes, describe our journey through the visited places, and write a small congratulatory closing! Output in rich Markdown format with emojis.`;

    const contents = [prompt];

    // Fetch up to 2 images and attach them for Gemini Vision
    for (const m of media) {
      try {
        const response = await fetch(m.url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let mimeType = 'image/jpeg';
          if (m.format === 'png') mimeType = 'image/png';
          else if (m.format === 'webp') mimeType = 'image/webp';
          
          contents.push({
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch image for Gemini:', m.url, err);
      }
    }

    let summaryText = '';
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(contents);
      summaryText = result.response.text();
    } catch (aiError) {
      console.warn("Gemini AI failed, attempting Groq fallback...", aiError.message);
      
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey || groqKey === 'YOUR_GROQ_KEY_HERE') {
        throw new Error("Gemini AI failed and GROQ_API_KEY is not configured for fallback.");
      }
      
      const groq = new Groq({ apiKey: groqKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
      });
      summaryText = chatCompletion.choices[0]?.message?.content || "AI Summary unavailable.";
    }
    
    trip.aiSummary = summaryText;
    trip.status = 'completed';
    await trip.save();

    await broadcastToTrip(trip._id, `🎉 ${trip.title} has been finalized! The AI summary is ready.`, 'success');
    
    res.json(trip);
  } catch (error) {
    console.error('Error finalizing trip:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// WhatsApp-style AI Chat Agent
router.post('/:id/ai-chat', requireAuth, syncUser, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey === 'YOUR_GROQ_KEY_HERE') {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    // Filter to only user and assistant roles and prepare payload
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Inject system prompt to guide the AI
    formattedMessages.unshift({
      role: 'system',
      content: "You are a helpful and friendly AI Trip Assistant. Answer questions concisely, using emojis and a conversational tone similar to a WhatsApp chat."
    });

    const groq = new Groq({ apiKey: groqKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: 'llama-3.1-8b-instant',
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    res.json({ reply });
  } catch (error) {
    console.error('Error in AI Chat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
