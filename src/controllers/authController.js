const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { AppError } = require('../utils/errorHandler');
const {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole
} = require('../utils/validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, studentId, staffId, department } = req.body;

    // Validate required fields
    validateRequired(['email', 'password', 'firstName', 'lastName', 'role'], req.body);

    // Validate email format
    if (!validateEmail(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    // Validate role
    if (!validateRole(role)) {
      return next(new AppError('Invalid role. Must be STUDENT, LECTURER, or ADMIN', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Validate role-specific fields
    if (role === 'STUDENT' && !studentId) {
      return next(new AppError('Student ID is required for student role', 400));
    }

    if ((role === 'LECTURER' || role === 'ADMIN') && !staffId) {
      return next(new AppError('Staff ID is required for lecturer/admin role', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        studentId: role === 'STUDENT' ? studentId : null,
        staffId: role !== 'STUDENT' ? staffId : null,
        department: department || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    validateRequired(['email', 'password'], req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};

