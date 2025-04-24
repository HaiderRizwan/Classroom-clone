const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware'); // Changed from middleware to middlewares
const { 
  registerUser, 
  loginUser, 
  getUserProfile 
} = require('../controllers/auth.controller');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getUserProfile);

module.exports = router;