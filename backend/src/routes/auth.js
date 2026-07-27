const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, signToken } = require('../utils/auth');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const loginSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(4),
}).refine((d) => d.phone || d.email, { message: 'Phone or email required' });

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = data.phone
    ? await prisma.user.findUnique({ where: { phone: data.phone }, include: { clinic: true } })
    : await prisma.user.findFirst({ where: { email: data.email }, include: { clinic: true } });
  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (!user.isActive) throw new AppError('Account is inactive', 403);

  const token = signToken({ userId: user.id, role: user.role, clinicId: user.clinicId });
  try {
    await prisma.activityLog.create({
      data: {
        clinicId: user.clinicId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: 'User logged in',
        ipAddress: req.ip,
      },
    });
  } catch (_) { /* ignore */ }

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinic: user.clinic,
    },
  });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role,
      clinicId: req.user.clinicId,
      clinic: req.user.clinic,
    },
  });
}));

router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters');
  }
  const ok = await comparePassword(currentPassword, req.user.passwordHash);
  if (!ok) throw new AppError('Current password is incorrect', 400);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  res.json({ success: true, message: 'Password updated' });
}));

module.exports = router;
