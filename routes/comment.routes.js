const express = require('express');
const router = express.Router();
const {
    createComment,
    getClassroomComments,
    updateComment,
    deleteComment
} = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isTeacherOrStudent } = require('../middlewares/role.middleware');

// Individual route protection instead of global
router.post('/classroom/:classroomId', protect, isTeacherOrStudent, createComment);
router.get('/classroom/:classroomId', protect, isTeacherOrStudent, getClassroomComments);
router.put('/:id', protect, isTeacherOrStudent, updateComment);
router.delete('/:id', protect, isTeacherOrStudent, deleteComment);

module.exports = router;