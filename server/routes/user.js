import express from 'express';
import {
  register,
  verifyUser,
  loginUser,
  myProfile,
  forgotPassword,
  resetPassword,
  updateProfile,
  getUserDetails,
  updateUserRole,
  getAllUsers,
  googleAuth,
  getGoogleClientId,
} from '../controllers/user.js';
import { isAuth, isAdmin } from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';
// import { addProgress, getYourProgress } from '../controllers/course.js';

const router = express.Router();

// User routes
router.post('/register', upload.single('image'), register);
router.post('/verify', verifyUser);
router.post('/login', loginUser);
router.get('/me', isAuth, myProfile);
router.put(
  '/user/update',
  isAuth,
  upload.single('image'),
  updateProfile
);
router.post('/forgot', forgotPassword);
router.post('/reset/:token', resetPassword);
router.post('/auth/google', googleAuth);

// Admin routes
router.get('/users', isAuth, isAdmin, getAllUsers);
router.get('/user/:userId/details', isAuth, isAdmin, getUserDetails);
router.put('/user/:userId/role', isAuth, isAdmin, updateUserRole);

// Progress routes
// router.post('/user/progress', isAuth, addProgress);
// router.get('/user/progress', isAuth, getYourProgress);

// Add this new route
router.get('/auth/google-client-id', getGoogleClientId);

export default router;
