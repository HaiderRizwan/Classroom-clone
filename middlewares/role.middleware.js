const Classroom = require('../models/classroom.model');
const Assignment = require('../models/assignment.model');

const isTeacher = async (req, res, next) => {
    try {
        let classroom;
        
        // If we have a classroomId parameter, use that directly
        if (req.params.classroomId) {
            classroom = await Classroom.findById(req.params.classroomId);
        } 
        // If we have an assignment ID, get the classroom through the assignment
        else if (req.params.id) {
            const assignment = await Assignment.findById(req.params.id);
            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }
            classroom = await Classroom.findById(assignment.classroom);
        }
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Must be the teacher of this classroom.' });
        }
        next();
    } catch (error) {
        console.error('Error in isTeacher middleware:', error);
        next(error);
    }
};

const isStudent = async (req, res, next) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        if (!classroom.students.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Must be a student in this classroom.' });
        }
        next();
    } catch (error) {
        next(error);
    }
};

const isTeacherOrStudent = async (req, res, next) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        const isTeacher = classroom.teacher.toString() === req.user._id.toString();
        const isStudent = classroom.students.includes(req.user._id);
        
        if (!isTeacher && !isStudent) {
            return res.status(403).json({ 
                message: 'Access denied. Must be either teacher or student in this classroom.' 
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { isTeacher, isStudent, isTeacherOrStudent };