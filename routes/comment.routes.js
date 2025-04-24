const express = require('express');
const router = express.Router();
const {
    createComment,
    getClassroomComments,
    updateComment,
    deleteComment
} = require('../controllers/comment.controller');
const protect = require('../middlewares/auth.middleware');
const { isTeacherOrStudent } = require('../middlewares/role.middleware');

// All routes are protected
router.use(protect);

// Routes accessible by both teachers and students
router.post('/classroom/:classroomId', isTeacherOrStudent, createComment);
router.get('/classroom/:classroomId', isTeacherOrStudent, getClassroomComments);
router.put('/:id', isTeacherOrStudent, updateComment);
router.delete('/:id', isTeacherOrStudent, deleteComment);

module.exports = router;