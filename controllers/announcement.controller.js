const Announcement = require('../models/announcement.model');
const Classroom    = require('../models/classroom.model');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { classroomId }    = req.params;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Verify classroom & teacher
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Build files metadata (if uploaded)
    let filesData = [];
    if (req.files && req.files.length > 0) {
      filesData = req.files.map(file => ({
        name: file.filename,
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
    } else if (req.file) {
      // Handle single file upload
      filesData = [{
        name: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      }];
    }

    const announcement = await Announcement.create({
      title,
      content,
      classroom: classroomId,
      createdBy: req.user._id,
      files: filesData
    });

    await announcement.populate('createdBy', 'name email');

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getClassroomAnnouncements = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    const isTeacher = classroom.teacher.toString() === req.user._id.toString();
    const isStudent = classroom.students?.some(s => s.toString() === req.user._id.toString());
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const announcements = await Announcement.find({ classroom: classroomId })
      .populate('createdBy', 'name email')
      .populate('classroom', 'name subject')
      .sort({ createdAt: -1 });

    res.json({ success: true, announcements });
  } catch (err) {
    console.error('Fetch announcements error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    if (announcement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, content } = req.body;
    if (title)   announcement.title   = title;
    if (content) announcement.content = content;
    await announcement.save();
    await announcement.populate(['createdBy', 'classroom']);

    res.json({ success: true, announcement });
  } catch (err) {
    console.error('Update announcement error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    if (announcement.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await announcement.remove();
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
