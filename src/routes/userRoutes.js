const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;

