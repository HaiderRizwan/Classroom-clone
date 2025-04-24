const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getClassroomAssignments,
    submitAssignment,
    gradeSubmission
} = require('../controllers/assignment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isTeacher, isStudent, isTeacherOrStudent } = require('../middlewares/role.middleware');

// Routes that require teacher role
router.post('/classroom/:classroomId', protect, isTeacher, createAssignment);
router.post('/:id/grade/:submissionId', protect, isTeacher, gradeSubmission);

// Routes that require student role
router.post('/:id/submit', protect, isStudent, submitAssignment);

// Routes accessible by both teachers and students
router.get('/classroom/:classroomId', protect, isTeacherOrStudent, getClassroomAssignments);

module.exports = router;