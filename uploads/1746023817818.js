const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

// Secret key (Use environment variables for production)
const SECRET_KEY = 'shhhhh';

// Route to set token in cookie
app.get("/set-token", function (req, res) {
    const token = jwt.sign({ foo: 'bar' }, SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
    res.cookie('token', token, { httpOnly: true }); // httpOnly prevents client-side access
    res.send('Token set in cookie');
});

// Route to verify token
app.get("/verify-token", function (req, res) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('No token found');
    }

    jwt.verify(token, SECRET_KEY, function (err, decoded) {
        if (err) {
            return res.status(401).send('Invalid or expired token');
        }
        res.json(decoded);
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});




"http://localhost:3000/set-token"
"http://localhost:3000/verify-token"