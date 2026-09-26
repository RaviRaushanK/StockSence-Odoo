const { Op, Transaction } = require('sequelize');
const models = require('../models');
const inventoryService = require('./inventoryService');
const ApiError = require('../utils/ApiError');
const { generateDocumentNumber } = require('../utils/documentNumber');
const h = require('./operationHelpers');

const { InternalTransfer, Location, Product, TransferItem, User, Warehouse, sequelize } = models;
const STATUSES = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

async function validateSides(srcW, srcL, dstW, dstL, t) {
  const src = await h.validateWarehouseLocation(models, srcW, srcL, t);
  const dst = await h.validateWarehouseLocation(models, dstW, dstL, t);
  if (String(src.location.id) === String(dst.location.id)) {
    throw ApiError.badRequest('Source and destination locations must be different.');
  }
  return { src, dst };
}

async function list(opts = {}) {
  const search = typeof opts.search === 'string' ? opts.search.trim() : '';
  const status = opts.status ? String(opts.status).toUpperCase() : '';
  const where = {};
  if (search) where.transferNumber = { [Op.like]: `%${search}%` };
  if (STATUSES.includes(status)) where.status = status;
  const page = Math.max(1, parseInt(opts.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(opts.limit, 10) || 15));
  const result = await InternalTransfer.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'sourceWarehouse', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'sourceLocation', attributes: ['id', 'name', 'code'] },
      { model: Warehouse, as: 'destinationWarehouse', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'code'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: TransferItem, as: 'items', attributes: ['id'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.ceil(result.count / limit) || 1;
  return {
    transfers: result.rows.map((r) => {
      const p = r.get({ plain: true });
      p.itemCount = Array.isArray(p.items) ? p.items.length : 0;
      return p;
    }),
    pagination: { page, limit, total: result.count, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    filters: { search, status },
  };
}

async function getById(id, t = null) {
  const r = await InternalTransfer.findByPk(id, {
    include: [
      { model: Warehouse, as: 'sourceWarehouse' },
      { model: Location, as: 'sourceLocation' },
      { model: Warehouse, as: 'destinationWarehouse' },
      { model: Location, as: 'destinationLocation' },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'validator', attributes: ['id', 'fullName', 'email'] },
      { model: TransferItem, as: 'items', include: [{ model: Product, as: 'product' }] },
    ],
    transaction: t,
  });
  if (!r) throw ApiError.notFound('Transfer not found.');
  return r;
}

async function create(data, userId) {
  await inventoryService.validateUser(userId);
  await validateSides(data.sourceWarehouseId, data.sourceLocationId, data.destinationWarehouseId, data.destinationLocationId, null);
  const items = await h.validatePositiveItems(h.normalizeItems(data), null);
  const notes = typeof data.notes === 'string' && data.notes.trim() ? data.notes.trim() : null;
  let lastErr = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      const rec = await InternalTransfer.create({
        transferNumber: generateDocumentNumber('TRF'),
        sourceWarehouseId: parseInt(data.sourceWarehouseId, 10),
        sourceLocationId: parseInt(data.sourceLocationId, 10),
        destinationWarehouseId: parseInt(data.destinationWarehouseId, 10),
        destinationLocationId: parseInt(data.destinationLocationId, 10),
        status: 'DRAFT',
        notes,
        createdBy: userId,
      });
      await TransferItem.bulkCreate(items.map((it) => ({ transferId: rec.id, ...it })));
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
    const rec = await InternalTransfer.findByPk(id, { transaction: t, lock: Transaction.LOCK.UPDATE });
    if (!rec) throw ApiError.notFound('Transfer not found.');
    h.assertValidatable(rec, 'Transfer');
    const items = await TransferItem.findAll({ where: { transferId: rec.id }, transaction: t, lock: Transaction.LOCK.UPDATE });
    if (items.length === 0) throw ApiError.badRequest('Transfer has no items to validate.');
    await validateSides(rec.sourceWarehouseId, rec.sourceLocationId, rec.destinationWarehouseId, rec.destinationLocationId, t);
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.productId)) throw ApiError.badRequest('Duplicate products are not allowed in the same transfer.');
      seen.add(it.productId);
      await inventoryService.validateProduct(it.productId, t);
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0) throw ApiError.badRequest('Transfer contains an invalid quantity.');
    }
    for (const it of items) {
      await inventoryService.transferStock({
        productId: it.productId,
        sourceLocationId: rec.sourceLocationId,
        destinationLocationId: rec.destinationLocationId,
        quantity: Number(it.quantity),
        referenceType: 'TRANSFER',
        referenceId: String(rec.id),
        reason: `Transfer ${rec.transferNumber}`,
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
  const rec = await InternalTransfer.findByPk(id);
  if (!rec) throw ApiError.notFound('Transfer not found.');
  h.assertCancellable(rec, 'Transfer');
  rec.status = 'CANCELED';
  await rec.save();
  return rec;
}

module.exports = { cancel, create, getById, list, validate };

