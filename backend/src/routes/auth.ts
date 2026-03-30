import { Router } from 'express';
import { google } from 'googleapis';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

const getOAuth2Client = () => new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Get Google Auth URL (Login Only - No Calendar scopes)
router.get('/google/url', (req, res) => {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'online', // Only need identity for login
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        state: 'login' // Identifier for callback route
    });
    res.json({ url });
});

// Get Google Auth Sync URL (Requests Calendar Permission)
router.get('/google/sync-url', (req, res) => {
    const { guestToken } = req.query; // Existing session token
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial to get refresh token for background sync
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/calendar'
        ],
        prompt: 'consent', // Forces consent screen to ensure refresh_token is yielded
        include_granted_scopes: true,
        state: guestToken ? `sync_${guestToken}` : 'sync'
    });
    res.json({ url });
});

// Google Callback
router.get('/google/callback', async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email || !userInfo.data.id) {
            return res.status(400).send('Google Auth failed');
        }

        let user = null;
        let isSyncFlow = false;

        // Check if this was a sync attempt initiated from the dashboard
        if (state && state.startsWith('sync_')) {
            isSyncFlow = true;
            const tokenStr = state.split('sync_')[1];
            try {
                const decoded: any = jwt.verify(tokenStr, process.env.JWT_SECRET || 'secret');
                user = await User.findById(decoded.userId);
            } catch (err) {
                console.error('Invalid token during sync callback');
            }
        }

        // Find or create the Google User
        if (!user) {
            user = await User.findOne({ googleId: userInfo.data.id });
        }

        // If they still don't exist, create a new user entirely
        if (!user) {
            user = new User({ email: userInfo.data.email, googleId: userInfo.data.id, name: userInfo.data.name });
        } else {
            // Ensure googleId is set if they somehow had another type
            if (!user.googleId || user.googleId.startsWith('local_') || user.googleId.startsWith('guest_')) {
                user.googleId = userInfo.data.id;
            }
            // Update name from Google in case it changed
            if (userInfo.data.name) user.name = userInfo.data.name;
        }

        // Update tokens
        user.tokens = user.tokens || {};
        user.tokens.accessToken = tokens.access_token || user.tokens.accessToken;
        if (tokens.refresh_token) {
            user.tokens.refreshToken = tokens.refresh_token;
        }
        user.tokens.expiryDate = tokens.expiry_date || user.tokens.expiryDate;

        // If this was a sync flow, or if they just supplied a refresh token, we consider calendar linked
        if (isSyncFlow || tokens.refresh_token) {
            user.calendarLinked = true;
        }

        await user.save();

        // Generate JWT for frontend session
        const sessionToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        // Redirect to frontend
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${sessionToken}`);
    } catch (error) {
        console.error('Error during Google Auth callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
});

export default router;
