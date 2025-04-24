const express = require('express');
const router = express.Router();
const {
    createClassroom,
    getMyClassrooms,
    joinClassroom,
    getClassroomById
} = require('../controllers/classroom.controller');
const { protect } = require('../middlewares/auth.middleware'); // Changed to import the named export

// All routes are protected
router.use(protect);

// Create classroom (anyone can create)
router.post('/', createClassroom);

// Join classroom
router.post('/join', joinClassroom);

// Get user's classrooms
router.get('/my', getMyClassrooms);

// Get specific classroom
router.get('/:id', getClassroomById);

module.exports = router;