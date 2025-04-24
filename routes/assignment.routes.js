const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getClassroomAssignments,
    submitAssignment,
    gradeSubmission
} = require('../controllers/assignment.controller');
const protect = require('../middlewares/auth.middleware');
const { isTeacher, isStudent, isTeacherOrStudent } = require('../middlewares/role.middleware');

// All routes are protected
router.use(protect);

// Routes that require teacher role
router.post('/classroom/:classroomId', isTeacher, createAssignment);
router.post('/:id/grade/:submissionId', isTeacher, gradeSubmission);

// Routes that require student role
router.post('/:id/submit', isStudent, submitAssignment);

// Routes accessible by both teachers and students
router.get('/classroom/:classroomId', isTeacherOrStudent, getClassroomAssignments);

module.exports = router;