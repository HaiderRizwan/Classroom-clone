const Comment = require('../models/comment.model');
const Classroom = require('../models/classroom.model');

// @desc    Create a new comment
// @route   POST /api/comments/classroom/:classroomId
// @access  Private
const createComment = async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        const classroomId = req.params.classroomId;

        // Validate required content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                message: 'Comment content is required'
            });
        }

        // Verify classroom exists and user has access
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const isTeacher = classroom.teacher.toString() === req.user._id.toString();
        const isStudent = classroom.students.some(student => 
            student.toString() === req.user._id.toString()
        );

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to comment in this classroom' });
        }

        const commentData = {
            classroom: classroomId,
            user: req.user._id,
            content
        };

        // If this is a reply to another comment
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
            commentData.parentComment = parentCommentId;
        }

        const comment = await Comment.create(commentData);

        // If this is a reply, add it to the parent comment's replies
        if (parentCommentId) {
            await Comment.findByIdAndUpdate(parentCommentId, {
                $push: { replies: comment._id }
            });
        }

        await comment.populate('user', 'name email');
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating comment' });
    }
};

// @desc    Get all comments for a classroom
// @route   GET /api/comments/classroom/:classroomId
// @access  Private
const getClassroomComments = async (req, res) => {
    try {
        const classroomId = req.params.classroomId;

        // Verify classroom exists and user has access
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const isTeacher = classroom.teacher.toString() === req.user._id.toString();
        const isStudent = classroom.students.some(student => 
            student.toString() === req.user._id.toString()
        );

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to view comments in this classroom' });
        }

        // Get only top-level comments (no parent comment)
        const comments = await Comment.find({
            classroom: classroomId,
            parentComment: null
        })
        .populate('user', 'name email')
        .populate({
            path: 'replies',
            populate: {
                path: 'user',
                select: 'name email'
            }
        })
        .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching comments' });
    }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        const commentId = req.params.id;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                message: 'Comment content is required'
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify user owns the comment
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this comment' });
        }

        comment.content = content;
        await comment.save();

        await comment.populate('user', 'name email');
        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating comment' });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const classroom = await Classroom.findById(comment.classroom);
        const isTeacher = classroom.teacher.toString() === req.user._id.toString();
        const isCommentOwner = comment.user.toString() === req.user._id.toString();

        // Only comment owner or classroom teacher can delete the comment
        if (!isTeacher && !isCommentOwner) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // If this is a parent comment, delete all replies
        if (comment.replies.length > 0) {
            await Comment.deleteMany({ _id: { $in: comment.replies } });
        }

        // If this is a reply, remove it from parent's replies array
        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $pull: { replies: comment._id }
            });
        }

        await comment.remove();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting comment' });
    }
};

module.exports = {
    createComment,
    getClassroomComments,
    updateComment,
    deleteComment
};