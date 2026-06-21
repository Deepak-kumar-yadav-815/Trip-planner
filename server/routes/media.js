import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Media from '../models/Media.js';
import Trip from '../models/Trip.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router({ mergeParams: true });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trip-planner',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Setup multer with file filtering
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG images are allowed'), false);
    }
  }
});

// Helper to check membership
const verifyMember = async (tripId, userId) => {
  const trip = await Trip.findById(tripId).populate('members.user');
  if (!trip) return null;
  const isMember = trip.members.some(m => m.user._id.toString() === userId.toString() || m.user.clerkId === userId.toString());
  return isMember ? trip : null;
};

// GET all media for a trip
router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    const media = await Media.find({ tripId }).populate('uploadedBy', 'name avatar').sort({ createdAt: -1 });
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST upload media
router.post('/', requireAuth, syncUser, upload.single('file'), async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided or invalid format.' });
    }

    const format = req.file.mimetype.split('/')[1];

    const media = await Media.create({
      tripId,
      uploadedBy: req.dbUser._id,
      url: req.file.path, // Cloudinary URL
      format: format
    });

    // Populate uploadedBy so frontend can render it immediately
    await media.populate('uploadedBy', 'name avatar');

    res.status(201).json(media);
  } catch (error) {
    console.error('Error uploading media:', error);
    if (error.message.includes('Only JPG')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE media
router.delete('/:mediaId', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, mediaId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    const media = await Media.findById(mediaId);
    if (!media || media.tripId.toString() !== tripId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Attempt to delete from cloudinary using public_id
    try {
      const publicId = media.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`trip-planner/${publicId}`);
    } catch (cErr) {
      console.log('Failed to delete from Cloudinary, removing from DB anyway', cErr);
    }

    await Media.findByIdAndDelete(mediaId);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
