require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const { eventBus } = require('../../shared/utils');

const app = express();
const server = http.createServer(app);
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3004;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Prisma Client
const prisma = new PrismaClient();

// Store connected users
const connectedUsers = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[NOTIFICATION SERVICE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notification Service is running',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // In a real implementation, we would validate token with auth service
    // For simplicity in this school project, we'll just accept any token
    socket.userId = 'demo-user-id';
    socket.userRole = 'STUDENT';
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication error'));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Store user connection
  connectedUsers.set(socket.userId, socket.id);
  
  // Join user to their personal room
  socket.join(`user:${socket.userId}`);
  
  // Join role-based room
  socket.join(`role:${socket.userRole}`);
  
  // Send connection confirmation
  socket.emit('connected', {
    message: 'Connected to notification service',
    userId: socket.userId
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
  });
});

// @desc    Get user notifications
// @route   GET /
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { userId, unread } = req.query;
    
    // In a real implementation, we would extract userId from token
    const targetUserId = userId || 'demo-user-id';
    
    const where = { userId: targetUserId };
    
    if (unread === 'true') {
      where.read = false;
    }
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent
    });
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification
// @route   POST /
// @access  Private
const createNotification = async (req, res, next) => {
  try {
    const { userId, type, message, link } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link: link || null
      }
    });
    
    // Send real-time notification
    io.to(`user:${userId}`).emit('notification', notification);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /:id/read
// @access  Private
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /read-all
// @access  Private
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    // In a real implementation, we would extract userId from token
    const targetUserId = userId || 'demo-user-id';
    
    const result = await prisma.notification.updateMany({
      where: {
        userId: targetUserId,
        read: false
      },
      data: { read: true }
    });
    
    res.status(200).json({
      success: true,
      data: {
        count: result.count
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
app.get('/', getNotifications);
app.post('/', createNotification);
app.put('/:id/read', markNotificationAsRead);
app.put('/read-all', markAllNotificationsAsRead);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Notification Service Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Subscribe to events from other services
eventBus.subscribe('course.created', async (data) => {
  try {
    // Create notification for course creation
    await prisma.notification.create({
      data: {
        userId: data.lecturerId,
        type: 'COURSE_CREATED',
        message: `Your course "${data.courseName}" has been created successfully`,
        link: `/courses/${data.courseId}`
      }
    });
    
    // Send real-time notification
    io.to(`user:${data.lecturerId}`).emit('notification', {
      type: 'COURSE_CREATED',
      message: `Your course "${data.courseName}" has been created successfully`,
      link: `/courses/${data.courseId}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling course.created event:', error);
  }
});

eventBus.subscribe('course.enrolled', async (data) => {
  try {
    // Create notification for course enrollment
    await prisma.notification.create({
      data: {
        userId: data.studentId,
        type: 'COURSE_ENROLLED',
        message: `You have successfully enrolled in "${data.courseName}"`,
        link: `/courses/${data.courseId}`
      }
    });
    
    // Send real-time notification
    io.to(`user:${data.studentId}`).emit('notification', {
      type: 'COURSE_ENROLLED',
      message: `You have successfully enrolled in "${data.courseName}"`,
      link: `/courses/${data.courseId}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling course.enrolled event:', error);
  }
});

// Start server
server.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' Notification Service is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Socket.IO: Enabled`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app, server, io };


