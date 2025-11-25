require('dotenv').config();
const { Expo } = require('expo-server-sdk');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const { eventBus } = require('../../shared/utils');
const protect = require('../../middleware/auth');
const socketEmitter = require('../../shared/socketEmitter');

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
const expo = new Expo();

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
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    socket.userId = user.id;
    socket.userRole = user.role;
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
    const { unreadOnly, limit = 50 } = req.query;
    const userId = req.user.id;
    
    const where = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    const take = parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.notification.count({ where })
    ]);
    
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
      }
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
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link: link || null
      }
    });
    
    // Send real-time notification via Socket.IO
    io.to(`user:${userId}`).emit('notification', notification);
    
    // Emit notification creation event
    socketEmitter.emit('notification.created', { ...notification, userId });

    // Send push notification if token exists
    if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
        const messages = [{
            to: user.pushToken,
            sound: 'default',
            body: message,
            data: { withSome: 'data' }, // You can add extra data here
        }];
        try {
            await expo.sendPushNotificationsAsync(messages);
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
    
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
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return next(new AppError('Notification not found or you are not authorized', 404));
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    
    res.status(200).json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /read/all
// @access  Private
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await prisma.notification.updateMany({
      where: {
        userId,
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
app.use(protect);

app.get('/', getNotifications);
app.post('/', createNotification);
app.put('/:id/read', markNotificationAsRead);
app.put('/read/all', markAllNotificationsAsRead);

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
    
    // Emit notification creation event
    socketEmitter.emit('notification.created', {
      userId: data.lecturerId,
      type: 'COURSE_CREATED',
      message: `Your course "${data.courseName}" has been created successfully`,
      link: `/courses/${data.courseId}`
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
    
    // Emit notification creation event
    socketEmitter.emit('notification.created', {
      userId: data.studentId,
      type: 'COURSE_ENROLLED',
      message: `You have successfully enrolled in "${data.courseName}"`,
      link: `/courses/${data.courseId}`
    });
  } catch (error) {
    console.error('Error handling course.enrolled event:', error);
  }
});

// Only listen if we are running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
      console.log('\n=================================');
      console.log(' Notification Service is running');
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Socket.IO: Enabled`);
      console.log('=================================\n');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Export app for Vercel to use (Socket.IO disabled on Vercel)
module.exports = app;


