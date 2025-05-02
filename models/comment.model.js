const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true
    },
    announcement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Announcement'
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add validation to ensure either announcement or assignment is set
commentSchema.pre('save', function(next) {
    if (!this.announcement && !this.assignment) {
        next(new Error('Comment must be associated with either an announcement or assignment'));
    }
    this.updatedAt = Date.now();
    next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;