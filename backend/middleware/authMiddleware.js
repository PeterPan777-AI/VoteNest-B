// Filename: backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Or your user model path e.g. ../models/userModel

const protect = async (req, res, next) => {
    let token;
    console.log('Protect middleware hit for URL:', req.originalUrl); // Log the URL

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log('Token received:', token ? 'Yes' : 'No');

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // --- MODIFIED LINE: Use decoded.userId ---
            const userIdFromToken = decoded.userId; 
            console.log('Token decoded. User ID from token (using decoded.userId):', userIdFromToken);

            if (!userIdFromToken) { // Check if userIdFromToken itself is undefined
                console.error('User ID (decoded.userId) is undefined in the token payload. Sending 401.');
                return res.status(401).json({ message: 'Not authorized, user identifier missing in token' });
            }

            // Get user from the token
            req.user = await User.findById(userIdFromToken).select('-password');

            if (!req.user) {
                console.error(`User not found in DB for ID: ${userIdFromToken}. Sending 401.`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            console.log(`User found: ${req.user._id}, Role: ${req.user.role}. Proceeding...`);
            next();
        } catch (error) {
            console.error('Authentication error in protect middleware:', error.message);
            console.error('Error stack:', error.stack); // Log the full error stack
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                res.status(401).json({ message: 'Not authorized, token failed or expired' });
            } else {
                res.status(401).json({ message: 'Not authorized, an unexpected error occurred' });
            }
        }
    } else {
        console.log('No token found in authorization header or not Bearer type.');
        res.status(401).json({ message: 'Not authorized, no token or invalid token format' });
    }
};

// Optional: Middleware to check for admin role
const isAdmin = (req, res, next) => {
    // Ensure req.user is populated by 'protect' middleware first
    if (!req.user) {
        console.warn("isAdmin middleware: req.user not populated. Ensure 'protect' runs before 'isAdmin'.");
        return res.status(401).json({ message: 'Not authorized, user context not available' });
    }
    if (req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, isAdmin };