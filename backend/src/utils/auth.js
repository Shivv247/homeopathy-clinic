const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('./errors');

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken };
