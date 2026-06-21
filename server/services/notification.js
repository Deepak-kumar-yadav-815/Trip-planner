import Notification from '../models/Notification.js';
import Trip from '../models/Trip.js';
import { getIo } from '../socket.js'; // Need to export io from socket.js

export const createNotification = async (userId, message, type = 'info', tripId = null) => {
  try {
    const notification = await Notification.create({  // will create the notification.
      userId,
      tripId,
      message,
      type
    });
    
    // Emit to specific user if they are connected
    const io = getIo();
    if (io) {
      // We will emit to a dedicated user room: `user_${userId}`
      console.log(`[Notification Service] Emitting notification to room: user_${userId}`);
      io.to(`user_${userId}`).emit('receive_notification', notification);
    } else {
      console.log(`[Notification Service] IO instance not found!`);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const broadcastToTrip = async (tripId, message, type = 'info', excludeUserId = null) => {
  try {
    const trip = await Trip.findById(tripId).populate('members.user');  // find the user by trip id.
    if (!trip) return;

    for (const m of trip.members) {
      const uId = m.user._id.toString();
      if (uId !== excludeUserId?.toString()) {
        console.log(`[Notification Service] Creating notification for member: ${uId}`);
        await createNotification(uId, message, type, tripId);
      } else {
        console.log(`[Notification Service] Skipping excluded member: ${uId}`);
      }
    }
  } catch (error) {
    // catch the error.
    console.error('Error broadcasting notification to trip:', error);
  }
};
