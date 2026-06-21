import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import userRoutes from './routes/users.js';
import tripRoutes from './routes/trips.js';
import checkpointRoutes from './routes/checkpoints.js';
import messageRoutes from './routes/messages.js';
import expenseRoutes from './routes/expenses.js';
import mediaRoutes from './routes/media.js';
import notificationRoutes from './routes/notifications.js';
import voiceRoutes from './routes/voice.js';
import notesRoutes from './routes/notes.js';
import mapRoutes from './routes/map.js';
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URI || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().then(() => console.log('Connected to Redis')).catch(console.error);

// Inject redis client to requests
app.use((req, res, next) => {
  req.redisClient = redisClient;
  req.io = io; // Also inject io for routes to broadcast
  next();
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trip-planner';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/trips/:tripId/checkpoints', checkpointRoutes);
app.use('/api/trips/:tripId/messages', messageRoutes);
app.use('/api/trips/:tripId/expenses', expenseRoutes);
app.use('/api/trips/:tripId/media', mediaRoutes);
app.use('/api/trips/:tripId/voice', voiceRoutes);
app.use('/api/trips/:tripId/notes', notesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/map', mapRoutes);

// Basic Route
app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});
app.get('/', (req, res) => {
  res.send('Realtime Trip Planner API is running');
});
// Socket.io connection setup
setupSocket(io, redisClient);
