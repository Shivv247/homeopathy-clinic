const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { asyncHandler, AppError } = require('../utils/errors');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('DOCTOR', 'RECEPTIONIST'));

router.get('/', asyncHandler(async (req, res) => {
  const { lowStock } = req.query;
  let items = await prisma.inventoryItem.findMany({
    where: { clinicId: req.user.clinicId },
    include: { remedy: true },
    orderBy: { name: 'asc' },
  });
  if (lowStock === 'true') {
    items = items.filter((i) => i.quantity <= i.reorderLevel);
  }
  res.json({ success: true, items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    category: z.string(),
    potency: z.string().optional().nullable(),
    unit: z.string().optional(),
    quantity: z.number().optional(),
    reorderLevel: z.number().optional(),
    unitCost: z.number().optional().nullable(),
    remedyId: z.string().optional().nullable(),
  });
  const data = schema.parse(req.body);
  const item = await prisma.inventoryItem.create({
    data: {
      clinicId: req.user.clinicId,
      name: data.name,
      category: data.category,
      potency: data.potency,
      unit: data.unit || 'bottle',
      quantity: data.quantity || 0,
      reorderLevel: data.reorderLevel ?? 5,
      unitCost: data.unitCost,
      remedyId: data.remedyId,
    },
  });
  if (data.quantity > 0) {
    await prisma.stockLog.create({
      data: { inventoryItemId: item.id, type: 'PURCHASE', quantity: data.quantity, notes: 'Initial stock' },
    });
  }
  await logActivity(req, 'CREATE_INVENTORY', 'InventoryItem', item.id, null);
  res.status(201).json({ success: true, item });
}));

router.post('/:id/restock', asyncHandler(async (req, res) => {
  const { quantity, notes } = req.body;
  if (!quantity || quantity <= 0) throw new AppError('Quantity must be positive');
  const existing = await prisma.inventoryItem.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Item not found', 404);

  const item = await prisma.inventoryItem.update({
    where: { id: existing.id },
    data: { quantity: existing.quantity + quantity },
  });
  await prisma.stockLog.create({
    data: {
      inventoryItemId: item.id,
      type: 'PURCHASE',
      quantity,
      notes: notes || 'Restock',
    },
  });
  res.json({ success: true, item });
}));

router.get('/:id/logs', asyncHandler(async (req, res) => {
  const existing = await prisma.inventoryItem.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!existing) throw new AppError('Item not found', 404);
  const logs = await prisma.stockLog.findMany({
    where: { inventoryItemId: existing.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, logs });
}));

module.exports = router;
