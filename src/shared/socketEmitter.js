const EventEmitter = require('events');
const socketEmitter = new EventEmitter();

// Export the singleton instance
module.exports = socketEmitter;