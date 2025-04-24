const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Classroom name is required'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate a unique classroom code before saving
classroomSchema.pre('save', async function(next) {
    if (!this.isModified('code')) {
        const generateCode = () => {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
        };

        let code = generateCode();
        let isUnique = false;

        // Keep generating new code until we find a unique one
        while (!isUnique) {
            const existingClassroom = await this.constructor.findOne({ code });
            if (!existingClassroom) {
                isUnique = true;
                this.code = code;
            } else {
                code = generateCode();
            }
        }
    }
    next();
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;