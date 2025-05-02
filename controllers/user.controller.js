const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// @desc    Get multiple users by their IDs
// @route   POST /api/users/batch
// @access  Private
const getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }
    
    const users = await User.find({ _id: { $in: ids } }, 'name email');
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users by IDs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    // req.user is populated from the auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        // Get the current user from the request object (added by auth middleware)
        const userId = req.user._id;
        
        // Get the updated fields from the request body
        const { name, email, phone, bio } = req.body;
        
        // Create an object with the fields to update
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        
        // If a profile photo was uploaded, add it to the update data
        if (req.file) {
            updateData.profilePhoto = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
        }
        
        // Update the user in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true } // Return the updated user and run validation
        ).select('-password'); // Don't return the password
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile',
            error: error.message
        });
    }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password // Password will be hashed in the model's pre-save middleware
        });

        if (user) {
            // Generate JWT token
            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(201).json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            });
        }
    } catch (error) {
        console.error('Register user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while registering user'
        });
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists and password matches
        if (user && (await bcrypt.compare(password, user.password))) {
            // Generate JWT token
            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while logging in'
        });
    }
};

module.exports = {
  getUserById,
  getUsersByIds,
  getCurrentUser,
  updateUserProfile,
  registerUser,
  loginUser
}; 