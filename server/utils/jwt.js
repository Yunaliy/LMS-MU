import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_CONFIG = {
  algorithm: 'HS256',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d'
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, JWT_CONFIG);
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    });
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    throw error;
  }
};