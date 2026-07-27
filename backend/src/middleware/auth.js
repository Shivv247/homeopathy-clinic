const prisma = require('../utils/prisma');
const { verifyToken } = require('../utils/auth');
const { AppError } = require('../utils/errors');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  const decoded = verifyToken(header.slice(7));
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { clinic: true },
  });
  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive', 401));
  }
  req.user = user;
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission for this action', 403));
    }
    next();
  };
}

/** Clinical notes editable only by Doctor */
function doctorOnly(req, res, next) {
  if (req.user?.role !== 'DOCTOR') {
    return next(new AppError('Only doctors can modify clinical records', 403));
  }
  next();
}

async function logActivity(req, action, entityType, entityId, details) {
  try {
    if (!req.user) return;
    await prisma.activityLog.create({
      data: {
        clinicId: req.user.clinicId,
        userId: req.user.id,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress: req.ip,
      },
    });
  } catch (e) {
    console.error('Activity log failed', e.message);
  }
}

module.exports = { authenticate, authorize, doctorOnly, logActivity };
