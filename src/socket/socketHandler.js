const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Store connected users
const connectedUsers = new Map();

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(` User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user.id})`);
    
    // Store user connection
    connectedUsers.set(socket.user.id, socket.id);

    // Join user to their role-based room
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user.id}`);

    // Join course based rooms for targeted broadcasts
    try {
      let courseIds = [];

      if (socket.user.role === 'STUDENT') {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: socket.user.id },
          select: { courseId: true }
        });

        courseIds = enrollments.map((enrollment) => enrollment.courseId);
      } else if (socket.user.role === 'LECTURER') {
        const courses = await prisma.course.findMany({
          where: { lecturerId: socket.user.id },
          select: { id: true }
        });

        courseIds = courses.map((course) => course.id);
      }

      courseIds.forEach((courseId) => {
        socket.join(`course:${courseId}`);
      });
    } catch (error) {
      console.error('Socket course room join error:', error);
    }

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to notification system',
      user: socket.user
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(` User disconnected: ${socket.user.firstName} ${socket.user.lastName}`);
      connectedUsers.delete(socket.user.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return {
    // Emit notification to specific user
    emitToUser: (userId, event, data) => {
      io.to(`user:${userId}`).emit(event, data);
    },

    // Emit to users with specific role
    emitToRole: (role, event, data) => {
      io.to(`role:${role}`).emit(event, data);
    },

    // Emit to all connected users
    emitToAll: (event, data) => {
      io.emit(event, data);
    },

    // Broadcast new announcement
    broadcastAnnouncement: (announcement) => {
      const { targetAudience } = announcement;
      
      if (targetAudience === 'ALL') {
        io.emit('new-announcement', announcement);
      } else if (targetAudience === 'STUDENTS') {
        io.to('role:STUDENT').emit('new-announcement', announcement);
      } else if (targetAudience === 'LECTURERS') {
        io.to('role:LECTURER').emit('new-announcement', announcement);
      }
    },

    // Broadcast venue change
    broadcastVenueChange: (venue) => {
      io.emit('venue-change', venue);
    },

    // Emit to students enrolled in a specific course
    emitToCourse: (courseId, event, data) => {
      if (!courseId) return;
      io.to(`course:${courseId}`).emit(event, data);
    },

    // Broadcast schedule update to relevant course and stakeholders
    broadcastScheduleUpdate: (payload) => {
      if (!payload) {
        return;
      }

      const courseId = payload.course?.id || payload.courseId;

      if (courseId) {
        io.to(`course:${courseId}`).emit('schedule-update', payload);
      }

      // Notify lecturer tied to the schedule if present
      const lecturerId = payload.lecturer?.id || payload.lecturerId;
      if (lecturerId) {
        io.to(`user:${lecturerId}`).emit('schedule-update', payload);
      }

      // Optionally keep admins informed
      io.to('role:ADMIN').emit('schedule-update', payload);
    },

    // Send personal notification
    sendNotification: (userId, notification) => {
      io.to(`user:${userId}`).emit('notification', notification);
    },

    // Get connected users count
    getConnectedUsersCount: () => {
      return connectedUsers.size;
    },

    // Check if user is online
    isUserOnline: (userId) => {
      return connectedUsers.has(userId);
    }
  };
};

module.exports = socketHandler;

