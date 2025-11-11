const prisma = require('../config/db');
const { AppError } = require('../utils/errorHandler');
const { validateRequired } = require('../utils/validator');
const { createNotification } = require('../services/notificationService');

const courseInclude = {
  lecturer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      staffId: true,
      department: true
    }
  },
  _count: {
    select: {
      enrollments: true,
      schedules: true
    }
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Lecturers/Admins)
const createCourse = async (req, res, next) => {
  try {
    const { code, name, description, department, credits, lecturerId } = req.body;

    validateRequired(['code', 'name'], req.body);

    let courseLecturerId = req.user.id;

    if (req.user.role === 'ADMIN') {
      if (lecturerId) {
        const lecturer = await prisma.user.findFirst({
          where: { id: lecturerId, role: { in: ['LECTURER', 'ADMIN'] } }
        });

        if (!lecturer) {
          return next(new AppError('Provided lecturer does not exist', 400));
        }

        courseLecturerId = lecturerId;
      }
    } else if (req.user.role !== 'LECTURER') {
      return next(new AppError('Only lecturers or admins can create courses', 403));
    }

    if (credits !== undefined && (Number.isNaN(Number(credits)) || Number(credits) < 0)) {
      return next(new AppError('Credits must be a positive number', 400));
    }

    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return next(new AppError('A course with this code already exists', 400));
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description: description || null,
        department: department || null,
        credits: credits !== undefined ? Number(credits) : null,
        lecturerId: courseLecturerId
      },
      include: courseInclude
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res, next) => {
  try {
    const { department, lecturerId, search, page = 1, limit = 10 } = req.query;

    const where = {};

    if (department) {
      where.department = department;
    }

    if (lecturerId) {
      where.lecturerId = lecturerId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: courseInclude,
        orderBy: { name: 'asc' },
        skip,
        take
      }),
      prisma.course.count({ where })
    ]);

    // Determine enrollment status for students
    let enrollmentMap = new Map();
    if (req.user.role === 'STUDENT' && courses.length > 0) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: req.user.id,
          courseId: { in: courses.map((course) => course.id) }
        },
        select: {
          courseId: true
        }
      });

      enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment.courseId, true]));
    }

    const enrichedCourses = courses.map((course) => ({
      ...course,
      isEnrolled: enrollmentMap.get(course.id) || false
    }));

    res.status(200).json({
      success: true,
      data: enrichedCourses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit) || 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        ...courseInclude,
        schedules: {
          include: {
            venue: true
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    let isEnrolled = false;
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: id,
            studentId: req.user.id
          }
        }
      });
      isEnrolled = Boolean(enrollment);
    }

    res.status(200).json({
      success: true,
      data: {
        ...course,
        isEnrolled
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course Lecturer/Admin)
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, department, credits, lecturerId } = req.body;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    if (req.user.role !== 'ADMIN' && course.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to update this course', 403));
    }

    const updateData = {};

    if (code) {
      updateData.code = code;
    }

    if (name) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (department !== undefined) {
      updateData.department = department || null;
    }

    if (credits !== undefined) {
      if (Number.isNaN(Number(credits)) || Number(credits) < 0) {
        return next(new AppError('Credits must be a positive number', 400));
      }
      updateData.credits = Number(credits);
    }

    if (lecturerId && req.user.role === 'ADMIN') {
      const lecturer = await prisma.user.findFirst({
        where: { id: lecturerId, role: { in: ['LECTURER', 'ADMIN'] } }
      });

      if (!lecturer) {
        return next(new AppError('Provided lecturer does not exist', 400));
      }

      updateData.lecturerId = lecturerId;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: courseInclude
    });

    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course Lecturer/Admin)
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    if (req.user.role !== 'ADMIN' && course.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to delete this course', 403));
    }

    await prisma.course.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in a course (student)
// @route   POST /api/courses/:id/enroll
// @access  Private (Students)
const enrollInCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lecturer: true
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    if (req.user.role !== 'STUDENT') {
      return next(new AppError('Only students can enroll in courses', 403));
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: id,
          studentId: req.user.id
        }
      }
    });

    if (existingEnrollment) {
      return next(new AppError('You are already enrolled in this course', 400));
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: id,
        studentId: req.user.id
      },
      include: {
        course: true
      }
    });

    // Notify lecturer about new enrollment
    await createNotification({
      userId: course.lecturerId,
      type: 'NEW_ENROLLMENT',
      message: `${req.user.firstName} ${req.user.lastName} enrolled in ${course.name}`,
      link: `/courses/${course.id}`
    });

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Drop a course (student)
// @route   DELETE /api/courses/:id/enroll
// @access  Private (Students)
const dropCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'STUDENT') {
      return next(new AppError('Only students can drop courses', 403));
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: id,
          studentId: req.user.id
        }
      }
    });

    if (!enrollment) {
      return next(new AppError('You are not enrolled in this course', 400));
    }

    await prisma.enrollment.delete({
      where: { id: enrollment.id }
    });

    res.status(200).json({
      success: true,
      message: 'You have been unenrolled from the course'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students enrolled in a course
// @route   GET /api/courses/:id/students
// @access  Private (Course Lecturer/Admin)
const getCourseStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    if (req.user.role !== 'ADMIN' && course.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to view this course roster', 403));
    }

    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId: id },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
              department: true
            }
          }
        },
        orderBy: {
          student: {
            lastName: 'asc'
          }
        },
        skip,
        take
      }),
      prisma.enrollment.count({ where: { courseId: id } })
    ]);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit) || 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses relevant to the current user
// @route   GET /api/courses/my
// @access  Private
const getMyCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    if (req.user.role === 'STUDENT') {
      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where: { studentId: req.user.id },
          include: {
            course: {
              include: courseInclude
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take
        }),
        prisma.enrollment.count({ where: { studentId: req.user.id } })
      ]);

      res.status(200).json({
        success: true,
        data: enrollments.map((enrollment) => ({
          enrollmentId: enrollment.id,
          enrolledAt: enrollment.createdAt,
          course: {
            ...enrollment.course,
            isEnrolled: true
          }
        })),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit) || 1)
        }
      });
      return;
    }

    if (req.user.role === 'LECTURER' || req.user.role === 'ADMIN') {
      const where = {
        lecturerId: req.user.role === 'ADMIN' ? undefined : req.user.id
      };

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          include: courseInclude,
          orderBy: { name: 'asc' },
          skip,
          take
        }),
        prisma.course.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: courses,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit) || 1)
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  dropCourse,
  getCourseStudents,
  getMyCourses
};

