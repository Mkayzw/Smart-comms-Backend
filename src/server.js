require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const prisma = require('./config/db');
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const socketHandler = require('./socket/socketHandler');
const swaggerDocument = require('./config/swagger.json');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const commentRoutes = require('./routes/commentRoutes');
const venueRoutes = require('./routes/venueRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow frontend origin
    credentials: true
  }
});

// Initialize socket handler and export for use in controllers
const socketAPI = socketHandler(io);
global.socketAPI = socketAPI;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    connectedUsers: socketAPI.getConnectedUsersCount()
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart University Communication and Venue Notification System API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' Server is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`Socket.io: Enabled`);
  console.log('=================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

module.exports = { app, server, io };

