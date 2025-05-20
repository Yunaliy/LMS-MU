import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure base uploads directory exists
const baseUploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(baseUploadDir, { recursive: true });

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
      uploadPath = path.join(__dirname, '..', 'uploads', 'lectures'); // Changed from 'profiles' to 'lectures' to match the existing code
    } else {
      uploadPath = path.join(__dirname, '..', 'uploads', 'others');
    }
    
    // Ensure the directory exists
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Upload directory created/verified:', uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + path.extname(file.originalname);
      console.log('Generated filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    try {
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
        // For course images
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Please upload an image file'), false);
        }
      } else {
        cb(new Error('Unknown field name'), false);
      }
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(error);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB file size limit
  }
});
