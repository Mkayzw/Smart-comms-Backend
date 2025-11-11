const prisma = require('../config/db');
const { AppError } = require('../utils/errorHandler');
const { validateRequired, validateVenueStatus } = require('../utils/validator');
const { createNotification } = require('../services/notificationService');

// @desc    Create venue
// @route   POST /api/venues
// @access  Private/Admin
const createVenue = async (req, res, next) => {
  try {
    const { name, building, capacity, facilities = [], status = 'AVAILABLE' } = req.body;

    validateRequired(['name', 'building', 'capacity'], req.body);

    if (!validateVenueStatus(status)) {
      return next(new AppError('Invalid venue status', 400));
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        building,
        capacity: parseInt(capacity),
        facilities,
        status
      }
    });

    res.status(201).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all venues
// @route   GET /api/venues
// @access  Private
const getVenues = async (req, res, next) => {
  try {
    const { status, building, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (building) {
      where.building = building;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } }
      ];
    }

    const venues = await prisma.venue.findMany({
      where,
      include: {
        _count: {
          select: { schedules: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: venues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single venue
// @route   GET /api/venues/:id
// @access  Private
const getVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
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
        }
      }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update venue
// @route   PUT /api/venues/:id
// @access  Private/Admin
const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, building, capacity, facilities, status } = req.body;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            lecturer: true
          }
        }
      }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (building) updateData.building = building;
    if (capacity) updateData.capacity = parseInt(capacity);
    if (facilities) updateData.facilities = facilities;
    if (status) {
      if (!validateVenueStatus(status)) {
        return next(new AppError('Invalid venue status', 400));
      }
      updateData.status = status;

      // Notify affected lecturers if status changed
      if (status !== venue.status && venue.schedules.length > 0) {
        const lecturerIds = [...new Set(venue.schedules.map(s => s.lecturerId))];
        
        for (const lecturerId of lecturerIds) {
          await createNotification({
            userId: lecturerId,
            type: 'VENUE_STATUS_CHANGE',
            message: `Venue ${venue.name} status changed to ${status}`,
            link: `/venues/${id}`
          });
        }
      }
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      data: updatedVenue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete venue
// @route   DELETE /api/venues/:id
// @access  Private/Admin
const deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return next(new AppError('Venue not found', 404));
    }

    await prisma.venue.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check venue availability
// @route   GET /api/venues/available
// @access  Private
const checkAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.query;

    if (!dayOfWeek || !startTime || !endTime) {
      return next(new AppError('dayOfWeek, startTime, and endTime are required', 400));
    }

    // Get all venues
    const venues = await prisma.venue.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        schedules: {
          where: {
            dayOfWeek
          }
        }
      }
    });

    // Filter venues without conflicting schedules
    const availableVenues = venues.filter(venue => {
      return !venue.schedules.some(schedule => {
        // Check for time overlap
        return (
          (startTime >= schedule.startTime && startTime < schedule.endTime) ||
          (endTime > schedule.startTime && endTime <= schedule.endTime) ||
          (startTime <= schedule.startTime && endTime >= schedule.endTime)
        );
      });
    });

    res.status(200).json({
      success: true,
      data: availableVenues
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVenue,
  getVenues,
  getVenue,
  updateVenue,
  deleteVenue,
  checkAvailability
};

