const { Op, Transaction } = require('sequelize');
const models = require('../models');
const inventoryService = require('./inventoryService');
const ApiError = require('../utils/ApiError');
const { generateDocumentNumber } = require('../utils/documentNumber');
const h = require('./operationHelpers');

const { Delivery, DeliveryItem, Location, Product, User, Warehouse, sequelize } = models;
const STATUSES = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

async function list(opts = {}) {
  const search = typeof opts.search === 'string' ? opts.search.trim() : '';
  const status = opts.status ? String(opts.status).toUpperCase() : '';
  const where = {};
  if (search) {
    where[Op.or] = [
      { deliveryNumber: { [Op.like]: `%${search}%` } },
      { customerName: { [Op.like]: `%${search}%` } },
    ];
  }
  if (STATUSES.includes(status)) where.status = status;
  const page = Math.max(1, parseInt(opts.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(opts.limit, 10) || 15));
  const result = await Delivery.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: DeliveryItem, as: 'items', attributes: ['id'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.ceil(result.count / limit) || 1;
  return {
    deliveries: result.rows.map((r) => {
      const p = r.get({ plain: true });
      p.itemCount = Array.isArray(p.items) ? p.items.length : 0;
      return p;
    }),
    pagination: { page, limit, total: result.count, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    filters: { search, status },
  };
}

async function getById(id, t = null) {
  const r = await Delivery.findByPk(id, {
    include: [
      { model: Warehouse, as: 'warehouse' },
      { model: Location, as: 'location' },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'validator', attributes: ['id', 'fullName', 'email'] },
      { model: DeliveryItem, as: 'items', include: [{ model: Product, as: 'product' }] },
    ],
    transaction: t,
  });
  if (!r) throw ApiError.notFound('Delivery order not found.');
  return r;
}

async function create(data, userId) {
  await inventoryService.validateUser(userId);
  const customerName = typeof data.customerName === 'string' ? data.customerName.trim() : '';
  if (!customerName || customerName.length < 2) throw ApiError.badRequest('Customer name is required.');
  await h.validateWarehouseLocation(models, data.warehouseId, data.locationId, null);
  const items = await h.validatePositiveItems(h.normalizeItems(data), null);
  const notes = typeof data.notes === 'string' && data.notes.trim() ? data.notes.trim() : null;
  let lastErr = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      const rec = await Delivery.create({
        deliveryNumber: generateDocumentNumber('DEL'),
        customerName,
        warehouseId: parseInt(data.warehouseId, 10),
        locationId: parseInt(data.locationId, 10),
        status: 'DRAFT',
        notes,
        createdBy: userId,
      });
      await DeliveryItem.bulkCreate(items.map((it) => ({ deliveryId: rec.id, ...it })));
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
    const rec = await Delivery.findByPk(id, { transaction: t, lock: Transaction.LOCK.UPDATE });
    if (!rec) throw ApiError.notFound('Delivery order not found.');
    h.assertValidatable(rec, 'Delivery order');
    const items = await DeliveryItem.findAll({ where: { deliveryId: rec.id }, transaction: t, lock: Transaction.LOCK.UPDATE });
    if (items.length === 0) throw ApiError.badRequest('Delivery order has no items to validate.');
    await h.validateWarehouseLocation(models, rec.warehouseId, rec.locationId, t);
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.productId)) throw ApiError.badRequest('Duplicate products are not allowed in the same delivery.');
      seen.add(it.productId);
      await inventoryService.validateProduct(it.productId, t);
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0) throw ApiError.badRequest('Delivery contains an invalid quantity.');
    }
    for (const it of items) {
      await inventoryService.decreaseStock({
        productId: it.productId,
        locationId: rec.locationId,
        quantity: Number(it.quantity),
        movementType: 'DELIVERY',
        referenceType: 'DELIVERY',
        referenceId: String(rec.id),
        reason: `Delivery ${rec.deliveryNumber} to ${rec.customerName}`,
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
  const rec = await Delivery.findByPk(id);
  if (!rec) throw ApiError.notFound('Delivery order not found.');
  h.assertCancellable(rec, 'Delivery order');
  rec.status = 'CANCELED';
  await rec.save();
  return rec;
}

module.exports = { cancel, create, getById, list, validate };

