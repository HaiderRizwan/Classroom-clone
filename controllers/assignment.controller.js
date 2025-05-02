const Assignment = require('../models/assignment.model');
const Classroom = require('../models/classroom.model');

// @desc    Create a new assignment
// @route   POST /api/assignments/classroom/:classroomId
// @access  Private/Teacher
const createAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, points } = req.body;
        const classroomId = req.params.classroomId;

        // Validate required fields
        if (!title || !dueDate || !points) {
            return res.status(400).json({
                message: 'Please provide title, due date, and points for the assignment'
            });
        }

        // Validate points is a positive number
        if (points < 0) {
            return res.status(400).json({
                message: 'Points must be a positive number'
            });
        }

        // Validate due date is in the future
        if (new Date(dueDate) < new Date()) {
            return res.status(400).json({
                message: 'Due date must be in the future'
            });
        }

        // Verify classroom exists and user is the teacher
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to create assignments in this classroom' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            dueDate,
            points,
            classroom: classroomId,
            createdBy: req.user._id
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating assignment' });
    }
};

// @desc    Get assignments for a classroom
// @route   GET /api/assignments/classroom/:classroomId
// @access  Private
const getClassroomAssignments = async (req, res) => {
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
            return res.status(403).json({ message: 'Not authorized to view assignments in this classroom' });
        }

        const assignments = await Assignment.find({ classroom: classroomId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching assignments' });
    }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        console.log('Attempting to submit assignment:', assignmentId);
        console.log('User ID:', req.user._id);
        
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            console.log('No files uploaded');
            return res.status(400).json({ message: 'Please upload at least one file' });
        }

        console.log('Files received:', req.files.map(f => f.originalname));

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            console.log('Assignment not found:', assignmentId);
            return res.status(404).json({ message: 'Assignment not found' });
        }

        console.log('Assignment found:', assignment._id);
        console.log('Classroom ID:', assignment.classroom);

        // Check if assignment is past due date
        if (new Date() > new Date(assignment.dueDate)) {
            console.log('Assignment past due date');
            return res.status(400).json({ message: 'Assignment submission period has ended' });
        }

        // Ensure student belongs to the classroom
        const classroom = await Classroom.findById(assignment.classroom);
        if (!classroom) {
            console.log('Classroom not found:', assignment.classroom);
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        console.log('Classroom found:', classroom._id);
        console.log('Classroom students:', classroom.students);
        
        const isStudent = classroom.students.some(
            studentId => studentId.toString() === req.user._id.toString()
        );
        
        console.log('Is student authorized:', isStudent);
        
        if (!isStudent) {
            return res.status(403).json({ message: 'Not authorized to submit to this assignment' });
        }

        // Check if student has already submitted
        const existingSubmission = assignment.submissions.find(
            submission => submission.student.toString() === req.user._id.toString()
        );

        console.log('Existing submission:', existingSubmission);

        // Process file uploads
        const fileUrls = req.files.map(file => file.path);
        console.log('File URLs:', fileUrls);

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.fileUrls = fileUrls;
            existingSubmission.submittedAt = Date.now();
            console.log('Updated existing submission');
        } else {
            // Create new submission
            assignment.submissions.push({
                student: req.user._id,
                fileUrls: fileUrls,
                submittedAt: Date.now()
            });
            console.log('Created new submission');
        }

        await assignment.save();
        console.log('Assignment saved successfully');
        
        res.status(200).json({ 
            success: true, 
            message: 'Assignment submitted successfully',
            submission: existingSubmission || assignment.submissions[assignment.submissions.length - 1]
        });
    } catch (error) {
        console.error('Error in submitAssignment:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Server error while submitting assignment',
            error: error.message 
        });
    }
};

// @desc    Grade an assignment submission
// @route   POST /api/assignments/:id/grade/:submissionId
// @access  Private/Teacher
const gradeSubmission = async (req, res) => {
    try {
        const { grade, feedback } = req.body;
        const { id, submissionId } = req.params;

        // Validate grade
        if (grade === undefined || grade < 0 || grade > 100) {
            return res.status(400).json({
                message: 'Please provide a valid grade between 0 and 100'
            });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify user is the teacher of the classroom
        const classroom = await Classroom.findById(assignment.classroom);
        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to grade submissions' });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.grade = grade;
        submission.feedback = feedback;

        await assignment.save();

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while grading submission' });
    }
};

module.exports = {
    createAssignment,
    getClassroomAssignments,
    submitAssignment,
    gradeSubmission
};