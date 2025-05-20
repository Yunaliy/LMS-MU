import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendMail, { sendForgotMail } from '../middlewares/sendMail.js';
import TryCatch from '../middlewares/TryCatch.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Course from '../models/Course.js';
import { Progress } from '../models/Progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const register = TryCatch(async (req, res) => {
  const { email, name, password } = req.body;
  const image = req.file;

  let user = await User.findOne({ email });

  if (user)
    return res.status(400).json({
      success: false,
      message: 'User Already exists',
    });

  const hashPassword = await bcrypt.hash(password, 10);

  // Create relative path for the image
  const imagePath = image ? path.join('profiles', image.filename) : null;

  user = {
    name,
    email,
    password: hashPassword,
    image: imagePath,
  };

  const otp = Math.floor(Math.random() * 1000000);

  const activationToken = jwt.sign(
    {
      user,
      otp,
    },
    process.env.Activation_Secret,
    {
      expiresIn: '5m',
    }
  );

  const data = {
    name,
    otp,
  };

  await sendMail(email, 'E learning', data);

  res.status(200).json({
    success: true,
    message: 'Otp send to your mail',
    activationToken,
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { otp, activationToken } = req.body;

  const verify = jwt.verify(activationToken, process.env.Activation_Secret);

  if (!verify)
    return res.status(400).json({
      success: false,
      message: 'Otp Expired',
    });

  if (verify.otp !== otp)
    return res.status(400).json({
      success: false,
      message: 'Wrong Otp',
    });

  await User.create({
    name: verify.user.name,
    email: verify.user.email,
    password: verify.user.password,
    image: verify.user.image,
  });

  res.json({
    success: true,
    message: 'User Registered',
  });
});

export const loginUser = TryCatch(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No user found with this email',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15d',
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.name}`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        subscription: user.subscription || [],
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message,
    });
  }
});

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      subscription: user.subscription || [],
    },
  });
});

// controllers/userController.js
export const updateProfile = TryCatch(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;

  // Handle image upload if exists
  if (req.file) {
    // Delete old image if exists
    if (user.image) {
      const oldImagePath = path.join(__dirname, '../uploads', user.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    user.image = req.file.path.replace(/^.*uploads[\\/]/, '');
  }

  await user.save();

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      subscription: user.subscription || [],
    },
  });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email address',
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with this email address',
    });
  }

  try {
    // Generate token with 5 minutes expiration
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    const data = {
      email,
      token,
      name: user.name,
    };

    await sendForgotMail('Password Reset Request', data);

    // Store token expiration time
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email. Please try again later.',
    });
  }
});

export const resetPassword = TryCatch(async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
    });
  }
});

export const getUserDetails = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select('-password')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's course progress and details
  const userWithCourses = {
    ...user,
    subscription: await Promise.all((user.subscription || []).map(async (courseId) => {
      try {
        // Find the course in the database
        const course = await Course.findById(courseId).select('title').lean();
        
        // Get progress for this course
        const progress = await Progress.findOne({
          userId: userId,
          courseId: courseId
        }).lean();

        return {
          _id: courseId,
          title: course?.title || 'Course not found',
          progress: progress?.progress || 0,
          completed: progress?.completed || false,
          enrolledDate: progress?.createdAt || null
        };
      } catch (error) {
        console.error(`Error fetching details for course ${courseId}:`, error);
        return {
          _id: courseId,
          title: 'Error fetching course',
          progress: 0,
          completed: false,
          enrolledDate: null
        };
      }
    }))
  };

  res.status(200).json({
    success: true,
    user: userWithCourses
  });
});

export const updateUserRole = TryCatch(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified'
    });
  }

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role} successfully`
  });
});

export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('-password')
    .lean();

  res.status(200).json({
    success: true,
    users
  });
});

export const deleteUser = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Delete user's profile image if exists
  if (user.image) {
    const imagePath = path.join(__dirname, '../uploads', user.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Delete user's progress records
  await Progress.deleteMany({ user: userId });

  // Delete the user
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});
