const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (exclude password)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          studentId: true,
          staffId: true,
          department: true,
          createdAt: true
        }
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Not authorized, invalid token', 401));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = protect;

