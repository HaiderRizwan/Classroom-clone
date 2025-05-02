const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const multer = require('multer');
const path = require('path');

// Set up multer storage for profile photos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function(req, file, cb) {
        cb(null, `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: function(req, file, cb) {
        // Accept only images
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Auth routes (no auth required)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes (auth required)
router.get('/me', protect, userController.getCurrentUser);
router.get('/profile', protect, userController.getCurrentUser);
router.put('/profile', protect, upload.single('profilePhoto'), userController.updateUserProfile);
router.post('/batch', protect, userController.getUsersByIds);

// This should be last as it's a catch-all for IDs
router.get('/:id', protect, userController.getUserById);

module.exports = router; 