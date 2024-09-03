import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/upload_files")); // Resolve the path dynamically
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  },
});

export const upload = multer({ storage });
