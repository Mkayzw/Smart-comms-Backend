require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const { validatePassword } = require('../../utils/validator');
const protect = require('../../middleware/auth');
const authorize = require('../../middleware/role');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3008;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[USER SERVICE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User Service is running',
    timestamp: new Date().toISOString()
  });
});

// @desc    Get all users
// @route   GET /
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (department) {
      where.department = department;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /:id
// @access  Private
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true,
        staffId: true,
        department: true,
        createdAt: true,
        _count: {
          select: {
            announcements: true,
            comments: true,
            schedules: true
          }
        }
      }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /:id
// @access  Private
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Only allow users to update their own profile (unless admin)
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return next(new AppError('Not authorized to update this user', 403));
    }

    // Build update data
    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (department) updateData.department = department;
    
    if (password) {
      if (!validatePassword(password)) {
        return next(new AppError('Password must be at least 8 characters', 400));
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update push token for current user
// @route   PUT /me/push-token
// @access  Private
const updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id;

    if (!pushToken) {
      return next(new AppError('Push token is required', 400));
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });

    res.status(200).json({
      success: true,
      message: 'Push token updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Routes
app.use(protect);

app.get('/', authorize('ADMIN'), getUsers);
app.put('/me/push-token', updatePushToken);
app.get('/:id', getUser);
app.put('/:id', authorize('ADMIN'), updateUser);
app.delete('/:id', authorize('ADMIN'), deleteUser);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('User Service Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' User Service is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;

