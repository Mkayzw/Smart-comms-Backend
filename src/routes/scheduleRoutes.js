const express = require('express');
const {
  createSchedule,
  getSchedules,
  getMySchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/my-schedule', getMySchedule);
router.post('/', authorize('LECTURER', 'ADMIN'), createSchedule);
router.get('/', getSchedules);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;

