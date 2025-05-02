const mongoose = require('mongoose');
const crypto = require('crypto');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    trim: true,
    maxLength: [100, 'Classroom name cannot exceed 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxLength: [50, 'Subject name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  code: {
    type: String,
    unique: true,
    required: true
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
  announcements: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique classroom code before saving
classroomSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  const generateCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  };

  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const existingClassroom = await this.constructor.findOne({ code });
      if (!existingClassroom) {
        this.code = code;
        return next();
      }
      code = generateCode();
      attempts++;
    } catch (error) {
      return next(error);
    }
  }

  return next(new Error('Failed to generate unique classroom code'));
});

module.exports = mongoose.model('Classroom', classroomSchema);