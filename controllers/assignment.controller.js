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
        const { fileUrl } = req.body;
        const assignmentId = req.params.id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if assignment is past due date
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({ message: 'Assignment submission period has ended' });
        }

        // Check if student is in the classroom
        const classroom = await Classroom.findById(assignment.classroom);
        if (!classroom.students.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to submit to this assignment' });
        }

        // Check if student has already submitted
        const existingSubmission = assignment.submissions.find(
            submission => submission.student.toString() === req.user._id.toString()
        );

        if (existingSubmission) {
            return res.status(400).json({ message: 'You have already submitted this assignment' });
        }

        assignment.submissions.push({
            student: req.user._id,
            fileUrl
        });

        await assignment.save();

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while submitting assignment' });
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