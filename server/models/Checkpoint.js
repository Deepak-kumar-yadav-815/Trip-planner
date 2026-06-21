import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: true },
  type: { type: String }, // e.g., restaurant, museum
  rating: { type: Number },
  openHours: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  visitedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // to track who visited
  aiSummary: { type: String },
}, { timestamps: true });

export default mongoose.model('Checkpoint', checkpointSchema);
