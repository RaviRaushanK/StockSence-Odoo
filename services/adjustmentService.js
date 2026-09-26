const { Op, Transaction } = require('sequelize');
const models = require('../models');
const inventoryService = require('./inventoryService');
const ApiError = require('../utils/ApiError');
const { generateDocumentNumber } = require('../utils/documentNumber');
const h = require('./operationHelpers');

const { AdjustmentItem, InventoryAdjustment, Location, Product, StockBalance, User, Warehouse, sequelize } = models;
const STATUSES = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

async function readBalance(productId, locationId, t) {
  const b = await StockBalance.findOne({ where: { productId, locationId }, transaction: t });
  return b ? Number(b.quantity) : 0;
}

async function validateAdjItems(items, locationId, t) {
  if (!items || items.length === 0) throw ApiError.badRequest('At least one item is required.');
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (Number.isNaN(item.productId)) throw ApiError.badRequest('Each item must select a product.');
    if (seen.has(item.productId)) throw ApiError.badRequest('Duplicate products are not allowed.');
    seen.add(item.productId);
    const product = await inventoryService.validateProduct(item.productId, t || null);
    const phys = Number(item.rawPhysical);
    if (item.rawPhysical === '' || item.rawPhysical === null || item.rawPhysical === undefined || Number.isNaN(phys) || !Number.isFinite(phys)) {
      throw ApiError.badRequest(`Physical quantity for "${product.name}" must be a valid number.`);
    }
    if (phys < 0) throw ApiError.badRequest(`Physical quantity for "${product.name}" cannot be negative.`);
    const recorded = Math.round((await readBalance(product.id, locationId, t || null)) * 1000) / 1000;
    const physical = Math.round(phys * 1000) / 1000;
    const diff = Math.round((physical - recorded) * 1000) / 1000;
    out.push({
      productId: product.id, recordedQuantity: recorded.toFixed(3), physicalQuantity: physical.toFixed(3),
      difference: diff.toFixed(3), unitOfMeasure: item.unitOfMeasure || product.unitOfMeasure || null,
    });
  }
  return out;
}

async function list(opts = {}) {
  const search = typeof opts.search === 'string' ? opts.search.trim() : '';
  const status = opts.status ? String(opts.status).toUpperCase() : '';
  const where = {};
  if (search) {
    where[Op.or] = [
      { adjustmentNumber: { [Op.like]: `%${search}%` } },
      { reason: { [Op.like]: `%${search}%` } },
    ];
  }
  if (STATUSES.includes(status)) where.status = status;
  const page = Math.max(1, parseInt(opts.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(opts.limit, 10) || 15));
  const result = await InventoryAdjustment.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: AdjustmentItem, as: 'items', attributes: ['id'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.ceil(result.count / limit) || 1;
  return {
    adjustments: result.rows.map((r) => {
      const p = r.get({ plain: true });
      p.itemCount = Array.isArray(p.items) ? p.items.length : 0;
      return p;
    }),
    pagination: { page, limit, total: result.count, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    filters: { search, status },
  };
}


async function getById(id, t = null) {
  const r = await InventoryAdjustment.findByPk(id, {
    include: [
      { model: Warehouse, as: 'warehouse' },
      { model: Location, as: 'location' },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'validator', attributes: ['id', 'fullName', 'email'] },
      { model: AdjustmentItem, as: 'items', include: [{ model: Product, as: 'product' }] },
    ],
    transaction: t,
  });
  if (!r) throw ApiError.notFound('Adjustment not found.');
  return r;
}

async function create(data, userId) {
  await inventoryService.validateUser(userId);
  const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
  if (!reason || reason.length < 2) throw ApiError.badRequest('Reason is required.');
  await h.validateWarehouseLocation(models, data.warehouseId, data.locationId, null);
  const locationId = parseInt(data.locationId, 10);
  const items = await validateAdjItems(h.normalizeAdjustmentItems(data), locationId, null);
  const notes = typeof data.notes === 'string' && data.notes.trim() ? data.notes.trim() : null;
  let lastErr = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      const rec = await InventoryAdjustment.create({
        adjustmentNumber: generateDocumentNumber('ADJ'),
        warehouseId: parseInt(data.warehouseId, 10),
        locationId,
        status: 'DRAFT',
        reason,
        notes,
        createdBy: userId,
      });
      await AdjustmentItem.bulkCreate(items.map((it) => ({ adjustmentId: rec.id, ...it })));
      return getById(rec.id);
    } catch (e) {
      if (e && e.name === 'SequelizeUniqueConstraintError') { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr;
}

async function validate(id, userId) {
  await inventoryService.validateUser(userId);
  return sequelize.transaction(async (t) => {
    const rec = await InventoryAdjustment.findByPk(id, { transaction: t, lock: Transaction.LOCK.UPDATE });
    if (!rec) throw ApiError.notFound('Adjustment not found.');
    h.assertValidatable(rec, 'Adjustment');
    const items = await AdjustmentItem.findAll({ where: { adjustmentId: rec.id }, transaction: t, lock: Transaction.LOCK.UPDATE });
    if (items.length === 0) throw ApiError.badRequest('Adjustment has no items to validate.');
    await h.validateWarehouseLocation(models, rec.warehouseId, rec.locationId, t);
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.productId)) throw ApiError.badRequest('Duplicate products are not allowed.');
      seen.add(it.productId);
      await inventoryService.validateProduct(it.productId, t);
      const phys = Number(it.physicalQuantity);
      if (!Number.isFinite(phys) || phys < 0) throw ApiError.badRequest('Adjustment contains an invalid physical quantity.');
      const recorded = Math.round((await readBalance(it.productId, rec.locationId, t)) * 1000) / 1000;
      const physical = Math.round(phys * 1000) / 1000;
      const diff = Math.round((physical - recorded) * 1000) / 1000;
      it.recordedQuantity = recorded.toFixed(3);
      it.physicalQuantity = physical.toFixed(3);
      it.difference = diff.toFixed(3);
      await it.save({ transaction: t });
    }
    for (const it of items) {
      await inventoryService.adjustStock({
        productId: it.productId,
        locationId: rec.locationId,
        physicalQuantity: Number(it.physicalQuantity),
        referenceType: 'ADJUSTMENT',
        referenceId: String(rec.id),
        reason: `Adjustment ${rec.adjustmentNumber}: ${rec.reason}`,
        performedBy: userId,
      }, t);
    }
    rec.status = 'DONE';
    rec.validatedBy = userId;
    rec.validatedAt = new Date();
    await rec.save({ transaction: t });
    return true;
  });
}

async function cancel(id) {
  const rec = await InventoryAdjustment.findByPk(id);
  if (!rec) throw ApiError.notFound('Adjustment not found.');
  h.assertCancellable(rec, 'Adjustment');
  rec.status = 'CANCELED';
  await rec.save();
  return rec;
}

module.exports = { cancel, create, getById, list, validate };
