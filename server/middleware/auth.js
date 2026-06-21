import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

// This middleware requires a valid Clerk token in the Authorization header.
export const requireAuth = ClerkExpressRequireAuth();

// Middleware to ensure the Clerk user exists in our MongoDB database
export const syncUser = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // We normally would extract the user's name/email from the token claims if passed, 
    // or fetch from Clerk API. But to keep it fast, the frontend will pass user details 
    // on initial login/sync, or we can just save the clerkId here and update details later.
    let user = await User.findOne({ clerkId: userId });
    
    // If not found, we create a placeholder. The frontend should ideally 
    // hit a /api/users/sync endpoint to populate full details on first login.
    if (!user) {
      user = await User.create({
        clerkId: userId, // we are assigning clerId to userId 
        name: 'New User',
        email: 'placeholder@email.com' // Should be updated by frontend
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error during user sync' });
  }
};
