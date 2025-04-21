import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendMail, { sendForgotMail } from '../middlewares/sendMail.js';
import TryCatch from '../middlewares/TryCatch.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    const data = {
      email,
      token,
      name: user.name,
    };

    await sendForgotMail('Password Reset Request', data);

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
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    // Verify the token using JWT_SECRET instead of Forgot_Secret
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedData._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.resetPasswordExpire) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
    });
  }
});
