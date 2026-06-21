import Message from './models/Message.js';
import Note from './models/Note.js';
import User from './models/User.js';

let ioInstance;

export const setupSocket = (io, redisClient) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join Personal Room for Notifications
    socket.on('join_user', async (clerkId) => {
      try {
        const dbUser = await User.findOne({ clerkId });
        if (dbUser) {
          socket.join(`user_${dbUser._id}`);
          console.log(`Socket ${socket.id} joined personal room user_${dbUser._id}`);
        }
      } catch (err) { console.error('Error in join_user', err); }
    });

    // Join Trip Room
    socket.on('join_trip', (tripId) => {
      socket.join(tripId);
      console.log(`Socket ${socket.id} joined trip ${tripId}`);
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      try {
        const { tripId, senderId, content, type } = data;
        
        // Lookup User in DB using Clerk ID
        const dbUser = await User.findOne({ clerkId: senderId });
        if (!dbUser) {
          console.error(`User with clerkId ${senderId} not found in DB`);
          return;
        }

        const messageData = {
          tripId,
          // Attach full sender info for the frontend to display instantly
          sender: {
            _id: dbUser._id,
            clerkId: dbUser.clerkId,
            name: dbUser.name,
            avatar: dbUser.avatar
          },
          content,
          type,
          timestamp: new Date().toISOString()
        };

        // 1. Save to Redis for blazing fast retrieval
        try {
          const redisKey = `trip:${tripId}:messages`;
          await redisClient.rPush(redisKey, JSON.stringify(messageData));
          
          // Keep only last 100 messages in cache
          await redisClient.lTrim(redisKey, -100, -1);
        } catch (redisErr) {
          console.error('Redis cache error:', redisErr.message);
        }

        // 2. Broadcast to room
        io.to(tripId).emit('receive_message', messageData);

        // 3. Persist to MongoDB asynchronously
        await Message.create({ 
          tripId, 
          sender: dbUser._id, // Use the MongoDB ObjectId here!
          content, 
          type 
        });
      } catch (err) {
        console.error('Error saving message to DB', err);
      }
    });

    // Handle real-time location updates
    socket.on('update_location', (data) => {
      const { tripId, userId, lat, lng } = data;
      socket.to(tripId).emit('member_location_update', { userId, lat, lng });
    });

    // Handle member status updates
    socket.on('update_status', (data) => {
      const { tripId, userId, status } = data;
      socket.to(tripId).emit('member_status_update', { userId, status });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export const getIo = () => ioInstance;
