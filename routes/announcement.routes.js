const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcement.model');
const { protect } = require('../middlewares/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middlewares/role.middleware');
const {
  getClassroomAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcement.controller');

const path    = require('path');                              // for building file paths
const upload  = require('../middlewares/upload.middleware');  // your multer setup

// Protect all routes
router.use(protect);

// Create a new announcement
router.post(
    '/classroom/:classroomId',
    isTeacher,
    upload.array('files'), // Backend expects 'files'
    async (req, res) => {
      try {
        const { title, content } = req.body;
        const { classroomId } = req.params;
  
        // Build file metadata if files were uploaded
        let fileMeta = [];
        if (req.files && req.files.length > 0) {
          fileMeta = req.files.map(file => ({
            name: file.filename,
            path: `uploads/${file.filename}`, // relative URL path
            mimetype: file.mimetype,
            size: file.size
          }));
        }
  
        // Prepare announcement data
        const data = {
          title,
          content,
          classroom: classroomId,
          createdBy: req.user._id,
          files: fileMeta  // Save multiple files metadata
        };
  
        const announcement = new Announcement(data);
        await announcement.save();
  
        res.status(201).json({ success: true, announcement });
      } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ success: false, message: 'Server error while creating announcement' });
      }
    }
);

// Routes that require teacher role
router.put('/:id', isTeacher, updateAnnouncement);
router.delete('/:id', isTeacher, deleteAnnouncement);

// Routes accessible by both teachers and students
router.get('/classroom/:classroomId', isTeacherOrStudent, getClassroomAnnouncements);

module.exports = router;



router.get('/test', (req, res) => {
  res.send('Assignment route is working');
});
