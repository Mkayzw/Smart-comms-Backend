require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const swaggerDocument = require('./config/swagger.json');
const socketHandler = require('./socket/socketHandler');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize socket handlers
const socketUtils = socketHandler(io);

// Make socket utilities available to services
app.use((req, res, next) => {
  req.socketUtils = socketUtils;
  next();
});

// Middleware
// Allow all origins for class project - no CORS restrictions
app.use(cors());
app.use(logger);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Simple proxy for auth service using http-proxy
const httpProxy = require('http-proxy');

const authProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3001',
  changeOrigin: true,
  preserveHostHdr: true,
  xfwd: true
});

// Proxy routes to services
// NOTE: Proxies must be defined BEFORE body parsers (express.json) to avoid stream consumption issues
app.use('/api/auth', authLimiter, (req, res) => {
  console.log('Received request for:', req.path, req.method);
  authProxy.web(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(500).json({
        success: false,
        error: 'Proxy error: ' + err.message
      });
    }
  });
});

const courseServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/courses': '' },
  logLevel: 'warn'
});

const notificationServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  logLevel: 'warn'
});

const scheduleServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/schedules': '' },
  logLevel: 'warn'
});

const venueServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/venues': '' },
  logLevel: 'warn'
});

const announcementServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3007',
  changeOrigin: true,
  pathRewrite: { '^/api/announcements': '' },
  logLevel: 'warn'
});

const userServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  logLevel: 'warn'
});

app.use('/api/courses', courseServiceProxy);
app.use('/api/notifications', notificationServiceProxy);
app.use('/api/schedules', scheduleServiceProxy);
app.use('/api/venues', venueServiceProxy);
app.use('/api/announcements', announcementServiceProxy);
app.use('/api/users', userServiceProxy);

// Body parsers - Only for routes handled by the gateway itself
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use('/api-docs/swagger.json', swaggerUi.setup(swaggerDocument)); // Removed incorrect line

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart University Communication and Venue Notification System API Gateway',
    version: '2.0.0',
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
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' API Gateway is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Docs: http://localhost:${PORT}/api-docs`);
  console.log(` Socket.IO: Enabled`);
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
  server.close(() => process.exit(0));
});

module.exports = { app, server };
