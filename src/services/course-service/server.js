require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const { validateRequired } = require('../../utils/validator');
const { serviceRequest } = require('../../shared/utils');
const protect = require('../../middleware/auth');
const authorize = require('../../middleware/role');

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3003;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[COURSE SERVICE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Course Service is running',
    timestamp: new Date().toISOString()
  });
});

// Define courseInclude at top level scope
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

// @desc    Get all courses
// @route   GET /
// @access  Public
const getCourses = async (req, res, next) => {
  try {
    const { department, lecturerId, search, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (department) {
      where.department = department;
    }
    
    if (lecturerId) {
      where.lecturerId = lecturerId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: courseInclude,
        skip,
        take,
        orderBy: { name: 'asc' }
      }),
      prisma.course.count({ where })
    ]);


    let enrollmentMap = new Map();
    if (req.user && req.user.role === 'STUDENT' && courses.length > 0) {
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
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /:id
// @access  Public
const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
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
        schedules: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                building: true
              }
            }
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    let isEnrolled = false;
    if (req.user && req.user.role === 'STUDENT') {
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

// @desc    Create course
// @route   POST /
// @access  Private (Lecturer/Admin)
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

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return next(new AppError('Course with this code already exists', 400));
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description: description || null,
        department: department || null,
        credits: credits ? parseInt(credits) : null,
        lecturerId: courseLecturerId
      },
      include: courseInclude
    });

    // Publish event for notification service
    try {
        await serviceRequest('notification-service', '/', {
            method: 'POST',
            data: {
                userId: course.lecturerId,
                type: 'COURSE_CREATED',
                message: `Your course "${course.name}" has been created successfully`,
                link: `/courses/${course.id}`
            }
        });
    } catch (err) {
        console.error('Failed to send course created notification', err);
    }

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /:id
// @access  Private (Lecturer/Admin)
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, department, credits, code, lecturerId } = req.body;

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
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (department) updateData.department = department;
    if (credits !== undefined) updateData.credits = credits ? parseInt(credits) : null;

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
// @route   DELETE /:id
// @access  Private (Admin)
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

// @desc    Enroll in course
// @route   POST /:id/enroll
// @access  Private (Student)
const enrollInCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    // In new setup, studentId comes from authenticated user, but keeping flexibility if needed
    const studentId = req.user.role === 'STUDENT' ? req.user.id : req.body.studentId;

    if (!studentId) {
         return next(new AppError('Student ID is required', 400));
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
          lecturer: true
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    if (req.user.role === 'STUDENT' && studentId !== req.user.id) {
         return next(new AppError('Cannot enroll other students', 403));
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: id,
          studentId
        }
      }
    });

    if (existingEnrollment) {
      return next(new AppError('Already enrolled in this course', 400));
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: id,
        studentId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Publish event for notification service
    try {
        await serviceRequest('notification-service', '/', {
            method: 'POST',
            data: {
                userId: course.lecturerId,
                type: 'NEW_ENROLLMENT',
                message: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled in ${course.name}`,
                link: `/courses/${course.id}`
            }
        });
        
        await serviceRequest('notification-service', '/', {
            method: 'POST',
            data: {
                userId: studentId,
                type: 'COURSE_ENROLLED',
                message: `You have successfully enrolled in "${course.name}"`,
                link: `/courses/${course.id}`
            }
        });
    } catch (err) {
        console.error('Failed to send enrollment notification', err);
    }

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Drop a course (student)
// @route   DELETE /:id/enroll
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
// @route   GET /:id/students
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

// @desc    Get all unique departments
// @route   GET /departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.course.findMany({
      where: {
        department: {
          not: null,
        },
      },
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    const departmentList = departments.map(d => d.department).sort();

    res.status(200).json({
      success: true,
      data: departmentList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses relevant to the current user
// @route   GET /my/all  (Changed from /my to /my/all to avoid conflicts
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

// Routes

app.use(protect);

app.get('/my', getMyCourses); 
app.get('/departments', getDepartments);
app.get('/', getCourses);
app.post('/', authorize('ADMIN'), createCourse);
app.get('/:id', getCourse);
app.put('/:id', authorize('ADMIN', 'LECTURER'), updateCourse);
app.delete('/:id', authorize('ADMIN'), deleteCourse);
app.post('/:id/enroll', authorize('STUDENT'), enrollInCourse);
app.delete('/:id/enroll', authorize('STUDENT'), dropCourse);
app.get('/:id/students', authorize('LECTURER', 'ADMIN'), getCourseStudents);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Course Service Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Only listen if we are running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log('\n=================================');
      console.log(' Course Service is running');
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=================================\n');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Export the app for Vercel to use
module.exports = app;
