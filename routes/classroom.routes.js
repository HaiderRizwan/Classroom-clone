const express = require('express');
const router = express.Router();
const {
    createClassroom,
    getMyClassrooms,
    joinClassroom,
    getClassroomById
} = require('../controllers/classroom.controller');
const protect = require('../middlewares/auth.middleware');
const { isTeacher, isStudent, isTeacherOrStudent } = require('../middlewares/role.middleware');

// All routes are protected
router.use(protect);

// Routes that require teacher role
router.post('/', isTeacher, createClassroom);

// Routes that require student role
router.post('/join', isStudent, joinClassroom);

// Routes accessible by both teachers and students
router.get('/my', isTeacherOrStudent, getMyClassrooms);
router.get('/:id', isTeacherOrStudent, getClassroomById);

module.exports = router;