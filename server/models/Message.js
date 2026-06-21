import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'emoji'], default: 'text' },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
