const { AppError } = require('./errorHandler');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter and one number
  return password.length >= 8;
};

const validateRequired = (fields, body) => {
  const missing = [];
  fields.forEach(field => {
    if (!body[field]) {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
};

const validateRole = (role) => {
  const validRoles = ['STUDENT', 'LECTURER', 'ADMIN'];
  return validRoles.includes(role);
};

const validateTargetAudience = (audience) => {
  const validAudiences = ['ALL', 'STUDENTS', 'LECTURERS'];
  return validAudiences.includes(audience);
};

const validateVenueStatus = (status) => {
  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
  return validStatuses.includes(status);
};

const validateDayOfWeek = (day) => {
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  return validDays.includes(day);
};

const validateTimeFormat = (time) => {
  // Validate HH:MM format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole,
  validateTargetAudience,
  validateVenueStatus,
  validateDayOfWeek,
  validateTimeFormat
};

