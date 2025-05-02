const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createClassroom,
  getMyClassrooms,
  joinClassroom,
  getClassroomById,
  getTeacherForClassroom,
  getStudentsForClassroom,
  getClassroomStats,
  getClassroomAssignments,
  createAssignment,
  submitAssignment,
  getClassroomMembers,
  inviteToClassroom
} = require('../controllers/classroom.controller');
const Classroom = require('../models/classroom.model'); // Updated to match the suggested code change
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'assignments');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Sanitize filename to remove special characters
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `assignment-${Date.now()}-${sanitizedName}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only documents, images, and archives are allowed.'));
    }
});

// Create a new classroom
router.post('/', protect, createClassroom);

// Join a classroom
router.post('/join', protect, joinClassroom);

// Get user's classrooms (teaching and enrolled)
router.get('/my', protect, getMyClassrooms);

// Get all classrooms
router.get('/', protect, async (req, res) => {
    try {
        const classrooms = await Classroom.find();
        res.status(200).json(classrooms);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ message: 'Server error while fetching classrooms' });
    }
});

// Get specific classroom by ID
router.get('/:id', protect, getClassroomById);

// Get the teacher for a specific classroom
router.get('/:id/teacher', protect, getTeacherForClassroom);

// Get all students for a specific classroom
router.get('/:id/students', protect, getStudentsForClassroom);

// Get classroom statistics (student and assignment counts)
router.get('/:id/stats', protect, getClassroomStats);

// Assignment routes
// Get all assignments for a classroom
router.get('/:id/assignments', protect, getClassroomAssignments);

// Create a new assignment
router.post('/:id/assignments', protect, upload.array('files'), createAssignment);

// Submit an assignment
router.post('/:id/assignments/:assignmentId/submit', protect, upload.array('files'), submitAssignment);

// Get all members (teachers and students) for a specific classroom
router.get('/:id/members', protect, getClassroomMembers);

// Invite users to a classroom
router.post('/:id/invite', protect, inviteToClassroom);

module.exports = router;