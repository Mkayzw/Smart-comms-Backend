const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const protect = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);

module.exports = router;

