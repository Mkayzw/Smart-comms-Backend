const prisma = require('../config/db');
const { AppError } = require('../utils/errorHandler');
const { validateRequired, validateDayOfWeek, validateTimeFormat } = require('../utils/validator');
const { createNotification, notifyCourseStudents } = require('../services/notificationService');

// @desc    Create schedule
// @route   POST /api/schedules
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
    const studentIds = await notifyCourseStudents({
      courseId,
      type: 'SCHEDULE_CREATED',
      message: `New schedule added for ${schedule.course.name} on ${dayOfWeek}`,
      link: `/courses/${courseId}`
    });

    if (global.socketAPI) {
      if (Array.isArray(studentIds)) {
        studentIds.forEach((studentId) => {
          global.socketAPI.sendNotification(studentId, {
            type: 'SCHEDULE_CREATED',
            schedule
          });
        });
      }
      global.socketAPI.broadcastScheduleUpdate(schedule);
    }

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schedules
// @route   GET /api/schedules
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
// @route   GET /api/schedules/my-schedule
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
// @route   PUT /api/schedules/:id
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
    await createNotification({
      type: 'SCHEDULE_UPDATE',
      message: `Schedule updated for ${updatedSchedule.course.name}`,
      link: `/schedules/${id}`,
      targetAudience: 'ALL'
    });

    const updatedStudentIds = await notifyCourseStudents({
      courseId: updatedSchedule.course.id,
      type: 'SCHEDULE_UPDATE',
      message: `Schedule updated for ${updatedSchedule.course.name}`,
      link: `/courses/${updatedSchedule.course.id}`
    });

    if (global.socketAPI) {
      if (Array.isArray(updatedStudentIds)) {
        updatedStudentIds.forEach((studentId) => {
          global.socketAPI.sendNotification(studentId, {
            type: 'SCHEDULE_UPDATE',
            schedule: updatedSchedule
          });
        });
      }
      global.socketAPI.broadcastScheduleUpdate(updatedSchedule);
    }

    res.status(200).json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
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

    const deletedStudentIds = await notifyCourseStudents({
      courseId: schedule.courseId,
      type: 'SCHEDULE_REMOVED',
      message: 'A schedule you were enrolled in has been removed',
      link: `/courses/${schedule.courseId}`
    });

    if (global.socketAPI) {
      if (Array.isArray(deletedStudentIds)) {
        deletedStudentIds.forEach((studentId) => {
          global.socketAPI.sendNotification(studentId, {
            type: 'SCHEDULE_REMOVED',
            scheduleId: id,
            courseId: schedule.courseId
          });
        });
      }
      global.socketAPI.broadcastScheduleUpdate({
        event: 'deleted',
        scheduleId: id,
        courseId: schedule.courseId,
        lecturerId: schedule.lecturerId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getMySchedule,
  updateSchedule,
  deleteSchedule
};

