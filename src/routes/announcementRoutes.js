const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment
} = require('../controllers/announcementController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', authorize('LECTURER', 'ADMIN'), createAnnouncement);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

router.post('/:id/comments', addComment);

module.exports = router;

