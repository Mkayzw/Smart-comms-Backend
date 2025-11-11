const prisma = require('../config/db');

/**
 * Create notification(s) for user(s)
 * @param {Object} options - Notification options
 * @param {string} options.userId - Single user ID (for individual notification)
 * @param {string} options.type - Notification type
 * @param {string} options.message - Notification message
 * @param {string} options.link - Optional link
 * @param {string} options.targetAudience - Target audience (ALL, STUDENTS, LECTURERS) for bulk notifications
 * @param {string} options.excludeUserId - User ID to exclude from bulk notifications
 */
const createNotification = async (options) => {
  try {
    const { userId, type, message, link, targetAudience, excludeUserId } = options;

    // Individual notification
    if (userId) {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          link: link || null
        }
      });
    }

    // Bulk notifications based on target audience
    if (targetAudience) {
      const where = {};

      if (targetAudience === 'STUDENTS') {
        where.role = 'STUDENT';
      } else if (targetAudience === 'LECTURERS') {
        where.role = 'LECTURER';
      }
      // For 'ALL', no where clause needed

      if (excludeUserId) {
        where.id = { not: excludeUserId };
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true }
      });

      if (users.length > 0) {
        const notifications = users.map(user => ({
          userId: user.id,
          type,
          message,
          link: link || null
        }));

        return await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send a notification to all students enrolled in a course
 * @param {Object} options
 * @param {string} options.courseId - Course ID
 * @param {string} options.type - Notification type
 * @param {string} options.message - Notification message
 * @param {string} [options.link] - Optional link
 * @param {string[]} [options.excludeStudentIds] - Student IDs to exclude
 */
const notifyCourseStudents = async (options) => {
  try {
    const { courseId, type, message, link, excludeStudentIds = [] } = options;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        studentId: excludeStudentIds.length > 0 ? { notIn: excludeStudentIds } : undefined
      },
      select: {
        studentId: true
      }
    });

    if (enrollments.length === 0) {
      return null;
    }

    const notifications = enrollments.map((enrollment) => ({
      userId: enrollment.studentId,
      type,
      message,
      link: link || null
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    return enrollments.map((enrollment) => enrollment.studentId);
  } catch (error) {
    console.error('Error notifying course students:', error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Get only unread notifications
 */
const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    const where = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
const markAsRead = async (notificationId) => {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all user notifications as read
 * @param {string} userId - User ID
 */
const markAllAsRead = async (userId) => {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  notifyCourseStudents,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};

