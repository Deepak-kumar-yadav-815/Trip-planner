import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activeStatus: { type: Boolean, default: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  joinId: { type: String, required: true, unique: true }, // generated unique code (e.g. 6 chars)
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  members: [memberSchema],
  checkpoints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Checkpoint' }],
  aiSummary: { type: String },
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);
