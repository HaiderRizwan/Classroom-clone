const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    createAssignment,
    getClassroomAssignments,
    submitAssignment,
    gradeSubmission
} = require('../controllers/assignment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isTeacher, isStudent, isTeacherOrStudent } = require('../middlewares/role.middleware');
const Assignment = require('../models/assignment.model');
const Classroom = require('../models/classroom.model');

// Configure multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/assignments';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use timestamp to make filename unique
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${timestamp}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Debug middleware for logging requests
const logRequest = (req, res, next) => {
    console.log('Request:', {
        method: req.method,
        url: req.url,
        params: req.params,
        body: req.body,
        user: req.user?._id
    });
    next();
};

// Routes that require teacher role
router.post('/classroom/:classroomId', protect, isTeacher, upload.array('files'), (req, res, next) => {
    console.log('Creating assignment for classroom:', req.params.classroomId);
    console.log('Uploaded files:', req.files);
    createAssignment(req, res, next);
});

// Grade submission route with enhanced logging
router.post('/:id/grade/:submissionId', protect, logRequest, async (req, res, next) => {
    console.log('Pre-middleware - Grading request received:', {
        assignmentId: req.params.id,
        submissionId: req.params.submissionId,
        grade: req.body.grade,
        user: req.user?._id
    });

    try {
        // First verify the assignment exists
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            console.log('Assignment not found:', req.params.id);
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Get the classroom
        const classroom = await Classroom.findById(assignment.classroom);
        if (!classroom) {
            console.log('Classroom not found for assignment:', assignment.classroom);
            return res.status(404).json({ message: 'Classroom not found' });
        }

        console.log('Authorization check:', {
            classroomTeacher: classroom.teacher,
            requestingUser: req.user._id,
            isMatch: classroom.teacher.toString() === req.user._id.toString()
        });

        // Verify teacher status
        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Access denied. Must be the teacher of this classroom.',
                debug: {
                    classroomTeacher: classroom.teacher.toString(),
                    requestingUser: req.user._id.toString()
                }
            });
        }

        // If we get here, the user is authorized
        console.log('User authorized, proceeding with grading');
        await gradeSubmission(req, res, next);
    } catch (error) {
        console.error('Error in grade submission route:', error);
        console.error('Stack trace:', error.stack);
        next(error);
    }
});

// Routes that require student role
router.post('/:id/submit', protect, isStudent, upload.array('files'), (req, res, next) => {
    console.log('Submitting assignment:', req.params.id);
    console.log('Uploaded files:', req.files);
    submitAssignment(req, res, next);
});

// Routes accessible by both teachers and students
router.get('/classroom/:classroomId', protect, isTeacherOrStudent, (req, res, next) => {
    console.log('Getting assignments for classroom:', req.params.classroomId);
    getClassroomAssignments(req, res, next);
});

module.exports = router;