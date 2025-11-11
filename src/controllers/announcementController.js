const prisma = require('../config/db');
const { AppError } = require('../utils/errorHandler');
const { validateRequired, validateTargetAudience } = require('../utils/validator');
const { createNotification } = require('../services/notificationService');

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Lecturers/Admins)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience = 'ALL', pinned = false } = req.body;

    validateRequired(['title', 'content'], req.body);

    if (!validateTargetAudience(targetAudience)) {
      return next(new AppError('Invalid target audience', 400));
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetAudience,
        pinned,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Create notifications for targeted users
    await createNotification({
      type: 'NEW_ANNOUNCEMENT',
      message: `New announcement: ${title}`,
      link: `/announcements/${announcement.id}`,
      targetAudience,
      excludeUserId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const { targetAudience, pinned, page = 1, limit = 10, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (targetAudience) {
      where.targetAudience = targetAudience;
    } else {
      // Show announcements relevant to user's role
      const audienceFilter = ['ALL'];
      if (req.user.role === 'STUDENT') {
        audienceFilter.push('STUDENTS');
      } else if (req.user.role === 'LECTURER') {
        audienceFilter.push('LECTURERS');
      }
      where.targetAudience = { in: audienceFilter };
    }

    if (pinned !== undefined) {
      where.pinned = pinned === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.announcement.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Author/Admin)
const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, pinned } = req.body;

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && announcement.authorId !== req.user.id) {
      return next(new AppError('Not authorized to update this announcement', 403));
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (targetAudience) {
      if (!validateTargetAudience(targetAudience)) {
        return next(new AppError('Invalid target audience', 400));
      }
      updateData.targetAudience = targetAudience;
    }
    if (pinned !== undefined) updateData.pinned = pinned;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Author/Admin)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && announcement.authorId !== req.user.id) {
      return next(new AppError('Not authorized to delete this announcement', 403));
    }

    await prisma.announcement.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    validateRequired(['content'], req.body);

    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        announcementId: id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Notify announcement author
    if (announcement.authorId !== req.user.id) {
      await createNotification({
        userId: announcement.authorId,
        type: 'NEW_COMMENT',
        message: `${req.user.firstName} ${req.user.lastName} commented on your announcement`,
        link: `/announcements/${id}`
      });
    }

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Author/Admin)
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && comment.userId !== req.user.id) {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    await prisma.comment.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment
};

