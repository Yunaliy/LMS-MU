import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the correct upload folder based on the route or file type
    let uploadPath;
    if (file.fieldname === 'file' && file.mimetype.startsWith('video/')) {
      uploadPath = path.join(__dirname, '..', 'uploads', 'lectures');
    } else if (file.fieldname === 'file' && !file.mimetype.startsWith('video/')) {
      uploadPath = path.join(__dirname, '..', 'uploads', 'others');
    } else if (file.fieldname === 'image') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
    } else {
      uploadPath = path.join(__dirname, '..', 'uploads', 'others');
    }
    
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file') {
      // For lecture files
      if (file.mimetype.startsWith('video/') || 
          file.mimetype === 'application/pdf' ||
          file.mimetype.includes('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    } else if (file.fieldname === 'image') {
      // For profile images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Please upload an image file'), false);
      }
    } else {
      cb(new Error('Unknown field name'), false);
    }
  }
});
