const Classroom = require('../models/classroom.model');
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');

// @desc    Create a new classroom
// @route   POST /api/classrooms
// @access  Private
const createClassroom = async (req, res) => {
  try {
    const { name, subject, description } = req.body;

    if (!name || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and subject for the classroom'
      });
    }
    const generateUniqueCode = () => {
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    };

    const code = generateUniqueCode();
    const classroom = await Classroom.create({
      name,
      subject,
      description,
      code,
      teacher: req.user._id
    });

    await classroom.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating classroom'
    });
  }
};

// @desc    Get all classrooms for logged in user
// @route   GET /api/classrooms/my
// @access  Private
const getMyClassrooms = async (req, res) => {
  try {
    const teachingClassrooms = await Classroom.find({ teacher: req.user._id })
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    const enrolledClassrooms = await Classroom.find({ students: req.user._id })
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json({
      success: true,
      classrooms: {
        teaching: teachingClassrooms,
        enrolled: enrolledClassrooms
      }
    });
  } catch (error) {
    console.error('Get my classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms'
    });
  }
};

// @desc    Join a classroom using code
// @route   POST /api/classrooms/join
// @access  Private
const joinClassroom = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid classroom code'
      });
    }

    const classroom = await Classroom.findOne({ code: code.trim() })
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'No classroom found with the provided code'
      });
    }

    // Check if user is the teacher
    if (classroom.teacher._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own classroom as a student'
      });
    }

    // Check if user is already a student
    if (classroom.students.some(student => student._id.toString() === req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this classroom'
      });
    }

    // Add user to students array
    classroom.students.push(req.user._id);
    await classroom.save();
    await classroom.populate('students', 'name email');

    res.json({
      success: true,
      message: 'Successfully joined the classroom',
      classroom
    });
  } catch (error) {
    console.error('Join classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining classroom'
    });
  }
};

// @desc    Get classroom by ID
// @route   GET /api/classrooms/:id
// @access  Private
const getClassroomById = async (req, res) => {
  try {
    const shouldPopulate = req.query.populate === 'true';
    let query = Classroom.findById(req.params.id);
    
    if (shouldPopulate) {
      query = query
        .populate('teacher', 'name email')
        .populate('students', 'name email');
    }
    
    const classroom = await query;

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user has access to this classroom
    const isTeacher = classroom.teacher._id ? 
      classroom.teacher._id.toString() === req.user._id.toString() :
      classroom.teacher.toString() === req.user._id.toString();
      
    const isStudent = classroom.students.some(student => {
      const studentId = student._id ? student._id.toString() : student.toString();
      return studentId === req.user._id.toString();
    });

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }

    res.json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom'
    });
  }
};

// @desc    Get teacher for a classroom
// @route   GET /api/classrooms/:id/teacher
// @access  Private
const getTeacherForClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    // Check if user has access to this classroom
    const isTeacher = classroom.teacher.toString() === req.user._id.toString();
    const isStudent = classroom.students.some(student => student.toString() === req.user._id.toString());
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }
    
    // Fetch the teacher details
    const teacher = await User.findById(classroom.teacher, 'name email');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher'
    });
  }
};

// @desc    Get students for a classroom
// @route   GET /api/classrooms/:id/students
// @access  Private
const getStudentsForClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    // Check if user has access to this classroom
    const isTeacher = classroom.teacher.toString() === req.user._id.toString();
    const isStudent = classroom.students.some(student => student.toString() === req.user._id.toString());
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }
    
    // Fetch the student details
    const students = await User.find({ _id: { $in: classroom.students } }, 'name email');
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
};

// @desc    Get classroom statistics
// @route   GET /api/classrooms/:id/stats
// @access  Private
const getClassroomStats = async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    // Fetch the classroom to ensure the user has access
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    // Check if user has access to this classroom
    const teacherId = classroom.teacher._id ? classroom.teacher._id.toString() : classroom.teacher.toString();
    const isTeacher = teacherId === req.user._id.toString();
    
    const isStudent = classroom.students.some(student => {
      const studentId = student._id ? student._id.toString() : student.toString();
      return studentId === req.user._id.toString();
    });
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }
    
    // Get student count from the classroom model
    const studentsCount = classroom.students.length;
    
    // Get assignment count using the Assignment model
    const assignmentsCount = await Assignment.countDocuments({ classroom: classroomId });
    
    // Return the stats
    res.status(200).json({
      success: true,
      stats: {
        studentsCount,
        assignmentsCount
      }
    });
  } catch (error) {
    console.error('Error getting classroom stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom stats',
      error: error.message
    });
  }
};

// @desc    Get all assignments for a classroom
// @route   GET /api/classrooms/:id/assignments
// @access  Private
const getClassroomAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ classroom: req.params.id })
            .populate('submissions.student', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assignments'
        });
    }
};

// @desc    Create a new assignment
// @route   POST /api/classrooms/:id/assignments
// @access  Private (Teachers only)
const createAssignment = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        
        // Check if user is the teacher of this classroom
        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only teachers can create assignments'
            });
        }

        const { title, description, dueDate } = req.body;
        
        // Handle file uploads
        const fileUrls = req.files ? req.files.map(file => file.path) : [];

        const assignment = await Assignment.create({
            title,
            description,
            dueDate,
            fileUrls,
            classroom: req.params.id,
            teacher: req.user._id
        });

        res.status(201).json({
            success: true,
            assignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating assignment'
        });
    }
};

// @desc    Submit an assignment
// @route   POST /api/classrooms/:id/assignments/:assignmentId/submit
// @access  Private (Students only)
const submitAssignment = async (req, res) => {
    try {
        console.log('Starting assignment submission...');
        console.log('Files received:', req.files);
        
        // First, get the assignment and populate the teacher field
        const assignment = await Assignment.findById(req.params.assignmentId);
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Get the classroom to verify access and get teacher info
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found'
            });
        }

        // Check if assignment belongs to the specified classroom
        if (assignment.classroom.toString() !== req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Assignment does not belong to this classroom'
            });
        }

        // Ensure the teacher field is set
        assignment.teacher = classroom.teacher;

        // Check if past due date
        if (new Date(assignment.dueDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Assignment is past due date'
            });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded'
            });
        }

        // Handle file uploads
        console.log('Processing file uploads...');
        const fileUrls = req.files.map(file => {
            console.log('Processing file:', file.originalname, 'Path:', file.path);
            return file.path.replace(/\\/g, '/'); // Normalize path separators
        });

        // Check if student has already submitted
        const existingSubmission = assignment.submissions.find(
            sub => sub.student.toString() === req.user._id.toString()
        );

        console.log('Existing submission:', existingSubmission);

        if (existingSubmission) {
            // Update existing submission
            console.log('Updating existing submission...');
            existingSubmission.fileUrls = fileUrls;
            existingSubmission.submittedAt = Date.now();
        } else {
            // Add new submission
            console.log('Creating new submission...');
            assignment.submissions.push({
                student: req.user._id,
                fileUrls,
                submittedAt: Date.now()
            });
        }

        console.log('Saving assignment...');
        await assignment.save();

        console.log('Assignment submitted successfully');
        res.json({
            success: true,
            message: 'Assignment submitted successfully',
            submission: existingSubmission || assignment.submissions[assignment.submissions.length - 1]
        });
    } catch (error) {
        console.error('Error submitting assignment:', error);
        console.error('Error stack:', error.stack);
        
        // Check for specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission data',
                details: error.message
            });
        }
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file upload. Please check your form data.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error while submitting assignment',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all members (teachers and students) for a classroom
// @route   GET /api/classrooms/:id/members
// @access  Private
const getClassroomMembers = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found'
            });
        }

        // Check if user has access to this classroom
        const isTeacher = classroom.teacher._id.toString() === req.user._id.toString();
        const isStudent = classroom.students.some(student => 
            student._id.toString() === req.user._id.toString()
        );

        if (!isTeacher && !isStudent) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this classroom'
            });
        }

        // Add stats data for UI display (in a real app, this would come from actual data)
        const addStatsToMember = (member) => ({
            ...member.toObject(),
            stats: {
                assignments: Math.floor(Math.random() * 10)
            }
        });

        // Format the response to include role information and match client expectations
        const teacherWithRole = {
            ...addStatsToMember(classroom.teacher),
            role: 'teacher',
            isTeacher: true
        };
        
        // Filter out the teacher from students array if somehow included
        const filteredStudents = classroom.students.filter(
            student => student._id.toString() !== classroom.teacher._id.toString()
        );
        
        const studentsWithRole = filteredStudents.map(student => ({
            ...addStatsToMember(student),
            role: 'student',
            isTeacher: false
        }));
        
        // Provide both the combined members array and separate arrays for teachers and students
        const members = [teacherWithRole, ...studentsWithRole];

        res.json({
            success: true,
            members,
            teachers: [teacherWithRole],
            students: studentsWithRole,
            currentUserRole: isTeacher ? 'teacher' : 'student'
        });
    } catch (error) {
        console.error('Get classroom members error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching classroom members'
        });
    }
};

// @desc    Invite users to a classroom
// @route   POST /api/classrooms/:id/invite
// @access  Private
const inviteToClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        
        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found'
            });
        }
        
        // Check if the user is the teacher (only teachers can invite)
        if (classroom.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the classroom teacher can send invitations'
            });
        }
        
        const { emails, role } = req.body;
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one valid email address'
            });
        }
        
        if (!role || !['teacher', 'student'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid role (teacher or student)'
            });
        }
        
        // For now, just handle existing users by email
        // In a real-world scenario, you would also send invitation emails
        const results = {
            success: [],
            notFound: [],
            alreadyMember: [],
            conflictRole: []
        };
        
        for (const email of emails) {
            try {
                // Find the user by email
                const user = await User.findOne({ email: email.trim() });
                
                if (!user) {
                    results.notFound.push(email);
                    continue;
                }
                
                // Check if the user is already a member
                if (role === 'teacher') {
                    // Cannot invite the current teacher again
                    if (classroom.teacher.toString() === user._id.toString()) {
                        results.alreadyMember.push(email);
                        continue;
                    }
                    
                    // Check if this user is already a student - can't be both
                    if (classroom.students.some(student => student.toString() === user._id.toString())) {
                        results.conflictRole.push(email);
                        continue;
                    }
                    
                    // For simplicity, only allow one teacher per classroom in this implementation
                    // In a real app, you might allow multiple teachers
                    results.conflictRole.push(email);
                    continue;
                } else {
                    // Student role
                    // Check if this user is the teacher - can't be both
                    if (classroom.teacher.toString() === user._id.toString()) {
                        results.conflictRole.push(email);
                        continue;
                    }
                    
                    // Check if already a student
                    if (classroom.students.some(student => student.toString() === user._id.toString())) {
                        results.alreadyMember.push(email);
                        continue;
                    }
                    
                    // Add the user as a student
                    classroom.students.push(user._id);
                    results.success.push(email);
                }
            } catch (error) {
                console.error(`Error processing invitation for ${email}:`, error);
                // Continue with the next email
            }
        }
        
        // Save the updated classroom
        await classroom.save();
        
        res.json({
            success: true,
            message: 'Invitations processed',
            results
        });
    } catch (error) {
        console.error('Invite to classroom error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing invitations'
        });
    }
};

module.exports = {
  createClassroom,
  getMyClassrooms,
  joinClassroom,
  getClassroomById,
  getTeacherForClassroom,
  getStudentsForClassroom,
  getClassroomStats,
  getClassroomAssignments,
  createAssignment,
  submitAssignment,
  getClassroomMembers,
  inviteToClassroom
};