const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the assignment']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description for the assignment']
    },
    dueDate: {
        type: Date,
        required: [true, 'Please provide a due date for the assignment']
    },
    fileUrls: [{
        type: String
    }],
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fileUrls: [{
            type: String
        }],
        submittedAt: {
            type: Date,
            default: Date.now
        },
        grade: {
            type: Number,
            min: 0,
            max: 100
        },
        feedback: {
            type: String
        }
    }],
    maxPoints: {
        type: Number,
        default: 100
    }
}, {
    timestamps: true
});

// Add index for faster queries
assignmentSchema.index({ classroom: 1, dueDate: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);