const { AppError } = require('../utils/errorHandler');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require('../services/notificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { unread } = req.query;
    const unreadOnly = unread === 'true';

    const notifications = await getUserNotifications(req.user.id, unreadOnly);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await markAsRead(id);

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

