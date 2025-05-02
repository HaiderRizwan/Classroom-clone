const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer')) {
            // Clean the token by removing any line breaks, carriage returns, and whitespace
            token = req.headers.authorization.split(' ')[1].replace(/[\s\r\n]+/g, '');
        }

        if (!token) {
            console.log('No token provided'); // Debugging log
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded); // Debugging log

            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                console.log('User not found'); // Debugging log
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            console.log('User found:', user); // Debugging log
            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification failed:', error); // Debugging log
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { protect };