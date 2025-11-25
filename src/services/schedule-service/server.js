require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errorHandler');
const { validateRequired, validateDayOfWeek, validateTimeFormat } = require('../../utils/validator');
const { serviceRequest } = require('../../shared/utils');
const protect = require('../../middleware/auth');
const authorize = require('../../middleware/role');

const app = express();
const PORT = process.env.SCHEDULE_SERVICE_PORT || 3005;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[SCHEDULE SERVICE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Schedule Service is running',
    timestamp: new Date().toISOString()
  });
});

// Helper: Notify course students
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
      return [];
    }

    const studentIds = enrollments.map(e => e.studentId);

    // Send notifications via Notification Service
    
    for (const studentId of studentIds) {
      try {
        await serviceRequest('notification-service', '/', {
          method: 'POST',
          data: {
            userId: studentId,
            type,
            message,
            link
          }
        });
      } catch (error) {
        console.error(`Failed to notify student ${studentId}:`, error.message);
      }
    }

    return studentIds;
  } catch (error) {
    console.error('Error notifying course students:', error);
    return [];
  }
};

// @desc    Create schedule
// @route   POST /
// @access  Private (Lecturers/Admins)
const createSchedule = async (req, res, next) => {
  try {
    const { venueId, courseId, dayOfWeek, startTime, endTime, semester } = req.body;

    validateRequired(['venueId', 'courseId', 'dayOfWeek', 'startTime', 'endTime', 'semester'], req.body);

    if (!validateDayOfWeek(dayOfWeek)) {
      return next(new AppError('Invalid day of week', 400));
    }

    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return next(new AppError('Invalid time format. Use HH:MM', 400));
    }

    if (startTime >= endTime) {
      return next(new AppError('Start time must be before end time', 400));
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true
      }
    });

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    if (req.user.role === 'LECTURER' && course.lecturerId !== req.user.id) {
      return next(new AppError('You are not the lecturer for this course', 403));
    }

    // Check for conflicting schedules
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        venueId,
        dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingSchedule) {
      return next(new AppError('This time slot is already booked for this venue', 400));
    }

    const schedule = await prisma.schedule.create({
      data: {
        venueId,
        lecturerId: course.lecturerId,
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        semester
      },
      include: {
        venue: true,
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            department: true
          }
        }
      }
    });

    // Notify enrolled students about the new schedule
    await notifyCourseStudents({
      courseId,
      type: 'SCHEDULE_CREATED',
      message: `New schedule added for ${schedule.course.name} on ${dayOfWeek}`,
      link: `/courses/${courseId}`
    });

    

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schedules
// @route   GET /
// @access  Private
const getSchedules = async (req, res, next) => {
  try {
    const { venueId, lecturerId, dayOfWeek, semester, courseCode, courseId, page = 1, limit = 20 } = req.query;

    const where = {};

    if (venueId) where.venueId = venueId;
    if (lecturerId) where.lecturerId = lecturerId;
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    if (semester) where.semester = semester;
    if (courseId) where.courseId = courseId;
    if (courseCode) {
      where.course = {
        code: {
          contains: courseCode,
          mode: 'insensitive'
        }
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          venue: true,
          lecturer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffId: true,
              department: true
            }
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              department: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take
      }),
      prisma.schedule.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: schedules,
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

// @desc    Get user's schedule
// @route   GET /my-schedule
// @access  Private
const getMySchedule = async (req, res, next) => {
  try {
    let schedules = [];

    if (req.user.role === 'LECTURER') {
      schedules = await prisma.schedule.findMany({
        where: {
          lecturerId: req.user.id
        },
        include: {
          venue: true,
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              department: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
    } else if (req.user.role === 'STUDENT') {
      schedules = await prisma.schedule.findMany({
        where: {
          course: {
            enrollments: {
              some: { studentId: req.user.id }
            }
          }
        },
        include: {
          venue: true,
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              department: true
            }
          },
          lecturer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffId: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
    } else {
      schedules = await prisma.schedule.findMany({
        include: {
          venue: true,
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              department: true
            }
          },
          lecturer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffId: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
    }

    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule
// @route   PUT /:id
// @access  Private (Author/Admin)
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { venueId, courseId, dayOfWeek, startTime, endTime, semester } = req.body;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        venue: true,
        course: true
      }
    });

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && schedule.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to update this schedule', 403));
    }

    const updateData = {};

    if (venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: venueId } });
      if (!venue) {
        return next(new AppError('Venue not found', 404));
      }
      updateData.venueId = venueId;
    }

    if (semester) updateData.semester = semester;

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });

      if (!course) {
        return next(new AppError('Course not found', 404));
      }

      if (req.user.role !== 'ADMIN' && course.lecturerId !== req.user.id) {
        return next(new AppError('You are not the lecturer for this course', 403));
      }

      updateData.courseId = courseId;
      updateData.lecturerId = course.lecturerId;
    }

    if (dayOfWeek) {
      if (!validateDayOfWeek(dayOfWeek)) {
        return next(new AppError('Invalid day of week', 400));
      }
      updateData.dayOfWeek = dayOfWeek;
    }

    if (startTime) {
      if (!validateTimeFormat(startTime)) {
        return next(new AppError('Invalid start time format. Use HH:MM', 400));
      }
      updateData.startTime = startTime;
    }

    if (endTime) {
      if (!validateTimeFormat(endTime)) {
        return next(new AppError('Invalid end time format. Use HH:MM', 400));
      }
      updateData.endTime = endTime;
    }

    // Check for time conflicts if time or day changed
    if (venueId || dayOfWeek || startTime || endTime) {
      const checkVenueId = venueId || schedule.venueId;
      const checkDay = dayOfWeek || schedule.dayOfWeek;
      const checkStart = startTime || schedule.startTime;
      const checkEnd = endTime || schedule.endTime;

      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          venueId: checkVenueId,
          dayOfWeek: checkDay,
          OR: [
            {
              AND: [
                { startTime: { lte: checkStart } },
                { endTime: { gt: checkStart } }
              ]
            },
            {
              AND: [
                { startTime: { lt: checkEnd } },
                { endTime: { gte: checkEnd } }
              ]
            },
            {
              AND: [
                { startTime: { gte: checkStart } },
                { endTime: { lte: checkEnd } }
              ]
            }
          ]
        }
      });

      if (conflictingSchedule) {
        return next(new AppError('This time slot is already booked for this venue', 400));
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        venue: true,
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            department: true
          }
        }
      }
    });

    // Notify about schedule change
    try {
      await serviceRequest('notification-service', '/', {
        method: 'POST',
        data: {
            type: 'SCHEDULE_UPDATE',
            message: `Schedule updated for ${updatedSchedule.course.name}`,
            link: `/schedules/${id}`,
            targetAudience: 'ALL' 
        }
      });
    } catch (err) {
      console.error('Failed to send schedule update notification', err);
    }

    await notifyCourseStudents({
      courseId: updatedSchedule.course.id,
      type: 'SCHEDULE_UPDATE',
      message: `Schedule updated for ${updatedSchedule.course.name}`,
      link: `/courses/${updatedSchedule.course.id}`
    });


    res.status(200).json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule
// @route   DELETE /:id
// @access  Private (Author/Admin)
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id }
    });

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && schedule.lecturerId !== req.user.id) {
      return next(new AppError('Not authorized to delete this schedule', 403));
    }

    await prisma.schedule.delete({
      where: { id }
    });

    await notifyCourseStudents({
      courseId: schedule.courseId,
      type: 'SCHEDULE_REMOVED',
      message: 'A schedule you were enrolled in has been removed',
      link: `/courses/${schedule.courseId}`
    });

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Routes - All require authentication
app.use(protect);

app.get('/my-schedule', getMySchedule);
app.post('/', authorize('LECTURER', 'ADMIN'), createSchedule);
app.get('/', getSchedules);
app.put('/:id', updateSchedule);
app.delete('/:id', deleteSchedule);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Schedule Service Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(' Schedule Service is running');
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;

