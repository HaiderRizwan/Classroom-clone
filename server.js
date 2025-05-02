require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const classroomRoutes = require('./routes/classroom.routes');
const authRoutes = require('./routes/auth.routes'); // Import auth routes
const announcementRoutes = require('./routes/announcement.routes'); // Import announcement routes
const assignmentRoutes = require('./routes/assignment.routes'); // <-- Import assignment routes
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes'); // Import comment routes
// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure CORS with explicit settings
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors(corsOptions)); // Use cors with options
app.use(express.urlencoded({ extended: true }));

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/classrooms', classroomRoutes);
app.use('/api/announcements', announcementRoutes); // Mount announcement routes
app.use('/api/assignments', assignmentRoutes); // <-- Mount assignment routes
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes); // Mount comment routes

// Add route for debugging
app.get('/api/debug', (req, res) => {
  res.json({ message: 'API server is running correctly!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;