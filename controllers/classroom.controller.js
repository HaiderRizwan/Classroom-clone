const Classroom = require('../models/classroom.model');

// @desc    Create a new classroom
// @route   POST /api/classrooms
// @access  Private/Teacher
const createClassroom = async (req, res) => {
    try {
        const { name, subject, description } = req.body;

        // Validate required fields
        if (!name || !subject) {
            return res.status(400).json({ 
                message: 'Please provide both name and subject for the classroom'
            });
        }

        const classroom = await Classroom.create({
            name,
            subject,
            description: description || '', // Make description optional
            teacher: req.user._id
        });

        res.status(201).json(classroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating classroom' });
    }
};

// @desc    Get all classrooms for logged in user
// @route   GET /api/classrooms/my
// @access  Private
const getMyClassrooms = async (req, res) => {
    try {
        let classrooms;
        if (req.user.role === 'teacher') {
            classrooms = await Classroom.find({ teacher: req.user._id })
                .populate('teacher', 'name email')
                .populate('students', 'name email');
        } else {
            classrooms = await Classroom.find({ students: req.user._id })
                .populate('teacher', 'name email')
                .populate('students', 'name email');
        }

        res.json(classrooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching classrooms' });
    }
};

// @desc    Join a classroom using code
// @route   POST /api/classrooms/join
// @access  Private/Student
const joinClassroom = async (req, res) => {
    try {
        const { code } = req.body;

        const classroom = await Classroom.findOne({ code });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check if student is already in the classroom
        if (classroom.students.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already joined this classroom' });
        }

        classroom.students.push(req.user._id);
        await classroom.save();

        res.json(classroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while joining classroom' });
    }
};

// @desc    Get classroom by ID
// @route   GET /api/classrooms/:id
// @access  Private
const getClassroomById = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check if user has access to this classroom
        const isTeacher = classroom.teacher._id.toString() === req.user._id.toString();
        const isStudent = classroom.students.some(student => 
            student._id.toString() === req.user._id.toString()
        );

        if (!isTeacher && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to access this classroom' });
        }

        res.json(classroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching classroom' });
    }
};

module.exports = {
    createClassroom,
    getMyClassrooms,
    joinClassroom,
    getClassroomById
};