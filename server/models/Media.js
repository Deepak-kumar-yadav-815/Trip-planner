import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true,
    enum: ['png', 'jpg', 'jpeg', 'webp'] // Add webp just in case Cloudinary optimizes it
  }
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
