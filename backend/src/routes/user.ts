import { Router } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to protect routes
export const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.userId);
        if (!user) throw new Error('User not found');
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get current user profile
router.get('/profile', authMiddleware, async (req: any, res) => {
    res.json({ user: req.user });
});

// Update user profile (Department, Year, Section, etc)
router.put('/profile', authMiddleware, async (req: any, res) => {
    const { department, degree, specialization, year, semester, section } = req.body;
    try {
        const user = req.user;
        if (department) user.profile.department = department;
        if (degree) user.profile.degree = degree;
        if (specialization) user.profile.specialization = specialization;
        if (year) user.profile.year = year;
        if (semester) user.profile.semester = semester;
        if (section) user.profile.section = section;

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

export default router;
