const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Not authorized, insufficient role permissions'
            });
        }

        next();
    };
};

module.exports = {
    isTeacher: checkRole(['teacher']),
    isStudent: checkRole(['student']),
    isTeacherOrStudent: checkRole(['teacher', 'student'])
};