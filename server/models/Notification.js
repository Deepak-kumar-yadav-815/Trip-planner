import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip',
    required: false
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['alert', 'info', 'success'], 
    default: 'info' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
