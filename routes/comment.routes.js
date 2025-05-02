const express = require('express');
const router = express.Router();
const {
    createComment,
    getItemComments,
    updateComment,
    deleteComment
} = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isTeacherOrStudent } = require('../middlewares/role.middleware');

// Create a new comment
router.post('/classroom/:classroomId', protect, isTeacherOrStudent, createComment);

// Get comments for a specific item (announcement or assignment)
router.get('/classroom/:classroomId/:itemType/:itemId', protect, isTeacherOrStudent, getItemComments);

// Update a comment
router.put('/:id', protect, isTeacherOrStudent, updateComment);

// Delete a comment
router.delete('/:id', protect, isTeacherOrStudent, deleteComment);

module.exports = router;