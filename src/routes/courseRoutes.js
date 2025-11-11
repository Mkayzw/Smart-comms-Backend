const express = require('express');
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  dropCourse,
  getCourseStudents,
  getMyCourses
} = require('../controllers/courseController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/', getCourses);
router.get('/my', getMyCourses);
router.post('/', authorize('LECTURER', 'ADMIN'), createCourse);
router.get('/:id', getCourse);
router.put('/:id', authorize('LECTURER', 'ADMIN'), updateCourse);
router.delete('/:id', authorize('LECTURER', 'ADMIN'), deleteCourse);

router.post('/:id/enroll', authorize('STUDENT'), enrollInCourse);
router.delete('/:id/enroll', authorize('STUDENT'), dropCourse);
router.get('/:id/students', authorize('LECTURER', 'ADMIN'), getCourseStudents);

module.exports = router;

