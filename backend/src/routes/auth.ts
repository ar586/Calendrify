import { Router } from 'express';
import { google } from 'googleapis';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();

const getOAuth2Client = () => new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Register with Email/Password
router.post('/register', async (req, res) => {
    try {
        const { email, password, degree, department, semester, section, specialization } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            googleId: `local_${crypto.randomUUID()}`,
            profile: { degree, department, semester, section, specialization }
        });
        await user.save();

        const sessionToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({ token: sessionToken, user });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Login with Email/Password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        } else if (!user.password && user.googleId) {
            return res.status(400).json({ error: 'Please use Google Login for this account' });
        }

        const sessionToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({ token: sessionToken, user });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Google Auth URL
router.get('/google/url', (req, res) => {
    const { guestToken } = req.query;
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial: get refresh token
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/calendar'
        ],
        prompt: 'consent', // Forces consent screen to always grant refresh_token
        state: guestToken as string || 'default_state'
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

        // If a guestToken was passed in state, try to find and upgrade that user!
        if (state && state !== 'default_state') {
            try {
                const decoded: any = jwt.verify(state, process.env.JWT_SECRET || 'secret');
                user = await User.findById(decoded.userId);
            } catch (err) {
                console.error('Invalid guest token during callback loop');
            }
        }

        // If we found a guest/local user, update them. Otherwise find or create normally.
        if (user && (user.googleId.startsWith('guest_') || user.googleId.startsWith('local_'))) {
            // Check if this google account already exists differently
            const existingGoogleUser = await User.findOne({ googleId: userInfo.data.id });
            if (existingGoogleUser) {
                // If it exists, we technically should merge them. For simplicity, we just use the existing one.
                // Or we migrate the UserEventMappings. For MVP, just update the guest user properties.
                // Wait, if existingGoogleUser exists, Mongoose unique constraint will fail when we set googleId
                // Let's just use the existing account and orphan the guest session
                user = existingGoogleUser;
            } else {
                user.googleId = userInfo.data.id;
            }
        } else {
            user = await User.findOne({ googleId: userInfo.data.id });
            if (!user) {
                user = new User({ email: userInfo.data.email, googleId: userInfo.data.id });
            }
        }

        // Update tokens
        user.tokens = user.tokens || {};
        user.tokens.accessToken = tokens.access_token || user.tokens.accessToken;
        if (tokens.refresh_token) {
            user.tokens.refreshToken = tokens.refresh_token;
        }
        user.tokens.expiryDate = tokens.expiry_date || user.tokens.expiryDate;

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
