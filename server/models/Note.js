import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  color: { type: String, default: 'bg-card' },
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
