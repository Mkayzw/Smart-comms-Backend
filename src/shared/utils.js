const axios = require('axios');

// Service registry - simple mapping for school project
const services = {
  'auth-service': 'http://localhost:3001',
  'course-service': 'http://localhost:3003',
  'notification-service': 'http://localhost:3004',
  'schedule-service': 'http://localhost:3005',
  'venue-service': 'http://localhost:3006'
};

// Get service URL
const getServiceUrl = (serviceName) => {
  return services[serviceName];
};

// Make authenticated request to another service
const serviceRequest = async (serviceName, endpoint, options = {}) => {
  const url = `${getServiceUrl(serviceName)}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Service': 'microservice'
    },
    ...options
  };

  try {
    const response = await axios(url, defaultOptions);
    return response.data;
  } catch (error) {
    console.error(`Error calling ${serviceName}${endpoint}:`, error.message);
    throw error;
  }
};

// Validate JWT token (shared function)
const validateToken = async (token) => {
  try {
    const response = await serviceRequest('auth-service', '/validate', {
      method: 'POST',
      data: { token }
    });
    return response.data.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Simple event bus for school project (in-memory)
class SimpleEventBus {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to an event
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Publish an event
  async publish(event, data) {
    if (!this.listeners[event]) return;
    
    // Execute all listeners
    const promises = this.listeners[event].map(callback => {
      try {
        return callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        return null;
      }
    });
    
    await Promise.all(promises);
  }
}

// Create singleton instance
const eventBus = new SimpleEventBus();

module.exports = {
  getServiceUrl,
  serviceRequest,
  validateToken,
  eventBus
};


