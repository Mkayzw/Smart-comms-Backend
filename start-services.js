// Suppress util._extend deprecation warning
process.noDeprecation = true;

const { spawn } = require('child_process');
const path = require('path');

// Define services with their paths and ports
const services = [
  {
    name: 'API Gateway',
    script: 'src/server.js',
    port: 3000,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Auth Service',
    script: 'src/services/auth-service/server.js',
    port: 3001,
    color: '\x1b[32m' // Green
  },
  {
    name: 'Course Service',
    script: 'src/services/course-service/server.js',
    port: 3003,
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Notification Service',
    script: 'src/services/notification-service/server.js',
    port: 3004,
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Schedule Service',
    script: 'src/services/schedule-service/server.js',
    port: 3005,
    color: '\x1b[31m' // Red
  },
  {
    name: 'Venue Service',
    script: 'src/services/venue-service/server.js',
    port: 3006,
    color: '\x1b[34m' // Blue
  },
  {
    name: 'Announcement Service',
    script: 'src/services/announcement-service/server.js',
    port: 3007,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'User Service',
    script: 'src/services/user-service/server.js',
    port: 3008,
    color: '\x1b[32m' // Green
  }
];

// Function to start a service
const startService = (service) => {
  const fullPath = path.join(__dirname, service.script);
  
  const child = spawn('node', ['--no-deprecation', fullPath], {
    env: { ...process.env, PORT: service.port },
    stdio: 'pipe'
  });
  
  child.stdout.on('data', (data) => {
    console.log(`${service.color}[${service.name}]${data.toString().trim()}`);
  });
  
  child.stderr.on('data', (data) => {
    console.error(`${service.color}[${service.name}] ERROR: ${data.toString().trim()}`);
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`${service.color}[${service.name}] Process exited with code ${code}`);
    } else {
      console.log(`${service.color}[${service.name}] Process exited successfully`);
    }
  });
  
  return child;
};

// Function to check if a port is in use
const checkPort = (port) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
};

// Main function to start all services
const startAllServices = async () => {
  console.log('\x1b[34mStarting Smart University Microservices...\x1b[0m');
  console.log('=====================================');
  
  // Check if ports are available
  for (const service of services) {
    const portInUse = await checkPort(service.port);
    if (portInUse) {
      console.error(`\x1b[31mPort ${service.port} is already in use. Please stop the service using this port.\x1b[0m`);
      process.exit(1);
    }
  }
  
  // Start all services
  const childProcesses = services.map(service => startService(service));
  
  console.log('\x1b[34mAll services started!\x1b[0m');
  console.log('=====================================');
  console.log('\x1b[34mAPI Gateway: http://localhost:3000\x1b[0m');
  console.log('\x1b[34mAuth Service: http://localhost:3001\x1b[0m');
  console.log('\x1b[34mCourse Service: http://localhost:3003\x1b[0m');
  console.log('\x1b[34mNotification Service: http://localhost:3004\x1b[0m');
  console.log('\x1b[34mSchedule Service: http://localhost:3005\x1b[0m');
  console.log('\x1b[34mVenue Service: http://localhost:3006\x1b[0m');
  console.log('\x1b[34mAnnouncement Service: http://localhost:3007\x1b[0m');
  console.log('\x1b[34mUser Service: http://localhost:3008\x1b[0m');
  console.log('=====================================');
  console.log('\x1b[34mPress Ctrl+C to stop all services\x1b[0m');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\x1b[34mShutting down all services...\x1b[0m');
    childProcesses.forEach(child => {
      child.kill('SIGINT');
    });
    process.exit(0);
  });
};

// Start all services
startAllServices().catch(error => {
  console.error('\x1b[31mFailed to start services:\x1b[0m', error);
  process.exit(1);
});


