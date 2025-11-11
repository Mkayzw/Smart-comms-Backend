const express = require('express');
const {
  createVenue,
  getVenues,
  getVenue,
  updateVenue,
  deleteVenue,
  checkAvailability
} = require('../controllers/venueController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/available', checkAvailability);
router.post('/', authorize('ADMIN'), createVenue);
router.get('/', getVenues);
router.get('/:id', getVenue);
router.put('/:id', authorize('ADMIN'), updateVenue);
router.delete('/:id', authorize('ADMIN'), deleteVenue);

module.exports = router;

