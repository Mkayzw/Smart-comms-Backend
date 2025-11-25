require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole
} = require('../../utils/validator');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[AUTH SERVICE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth Service is running',
    timestamp: new Date().toISOString()
  });
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /register
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
        studentId,
        staffId,
        department
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
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
// @route   POST /login
// @access  Public
const login = async (req, res, next) => {
  try {
    console.log('[Auth Service] Login request received', req.body);
    const { email, password } = req.body;

    // Validate required fields
    console.log('[Auth Service] Validating fields...');
    validateRequired(['email', 'password'], req.body);

    // Check for user
    console.log('[Auth Service] Checking for user in DB...');
    const user = await prisma.user.findUnique({
      where: { email }
    });
    console.log('[Auth Service] User found:', user ? 'Yes' : 'No');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if password matches
    console.log('[Auth Service] Comparing passwords (sync)...');
    console.log(`[Auth Service] Input password type: ${typeof password}, DB password type: ${typeof user.password}`);
    
    // Use compareSync to avoid potential async hanging issues
    const isMatch = bcrypt.compareSync(password, user.password);
    console.log('[Auth Service] Password match result:', isMatch);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    console.log('[Auth Service] Generating token...');
    const token = generateToken(user.id);

    // Return user without password
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate JWT token (for inter-service calls)
// @route   POST /validate
// @access  Internal
const validateToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// @desc    Get current user profile from token
// @route   GET /me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        studentId: true,
        staffId: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    
    res.status(200).json({
      success: true,
      data: {
        id: '1',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
        department: 'Computer Science'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
app.post('/register', register);
app.post('/login', login);
app.post('/validate', validateToken);
app.get('/me', getMe);
app.get('/profile', getProfile);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Auth Service Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Only listen if we are running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log('\n=================================');
      console.log(' Auth Service is running');
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=================================\n');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Export the app for Vercel to use
module.exports = app;


