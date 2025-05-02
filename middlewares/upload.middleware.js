const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/ exists on disk (optional safety check)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });  // Ensure parent dirs are created if needed
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Specify the directory where files should be stored
  },
  filename: (req, file, cb) => {
    // Generate a unique name: timestamp + original extension
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

module.exports = upload;
