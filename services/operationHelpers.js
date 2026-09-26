const inventoryService = require('./inventoryService');
const ApiError = require('../utils/ApiError');

const CANCELLABLE = ['DRAFT', 'WAITING', 'READY'];
const VALIDATABLE = ['DRAFT', 'WAITING', 'READY'];

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [v];
}

function normalizeItems(body, qtyField = 'quantity') {
  const pids = toArray(body.productId);
  const qtys = toArray(body[qtyField]);
  const units = toArray(body.unitOfMeasure);
  const items = [];
  for (let i = 0; i < Math.max(pids.length, qtys.length); i += 1) {
    const pid = pids[i];
    const rawQty = qtys[i];
    const blankPid = pid === undefined || pid === null || String(pid).trim() === '';
    const blankQty = rawQty === undefined || rawQty === null || String(rawQty).trim() === '';
    if (blankPid && blankQty) continue;
    items.push({
      productId: blankPid ? NaN : parseInt(pid, 10),
      rawQty,
      unitOfMeasure: typeof units[i] === 'string' && units[i].trim() ? units[i].trim().slice(0, 30) : null,
    });
  }
  return items;
}

function normalizeAdjustmentItems(body) {
  const pids = toArray(body.productId);
  const phys = toArray(body.physicalQuantity);
  const units = toArray(body.unitOfMeasure);
  const items = [];
  for (let i = 0; i < Math.max(pids.length, phys.length); i += 1) {
    const pid = pids[i];
    const rawPhys = phys[i];
    const blankPid = pid === undefined || pid === null || String(pid).trim() === '';
    const blankPhys = rawPhys === undefined || rawPhys === null || String(rawPhys).trim() === '';
    if (blankPid && blankPhys) continue;
    items.push({
      productId: blankPid ? NaN : parseInt(pid, 10),
      rawPhysical: rawPhys,
      unitOfMeasure: typeof units[i] === 'string' && units[i].trim() ? units[i].trim().slice(0, 30) : null,
    });
  }
  return items;
}

async function validateWarehouseLocation(models, warehouseId, locationId, t) {
  const { Warehouse } = models;
  const wid = parseInt(warehouseId, 10);
  const lid = parseInt(locationId, 10);
  if (Number.isNaN(wid)) throw ApiError.badRequest('Warehouse is required.');
  if (Number.isNaN(lid)) throw ApiError.badRequest('Location is required.');
  const warehouse = await Warehouse.findByPk(wid, { transaction: t || null });
  if (!warehouse) throw ApiError.badRequest('Selected warehouse does not exist.');
  if (!warehouse.isActive) throw ApiError.badRequest(`Warehouse "${warehouse.name}" is inactive.`);
  const location = await inventoryService.validateLocation(lid, t || null);
  if (location.warehouseId !== warehouse.id) {
    throw ApiError.badRequest(`Location "${location.name}" does not belong to warehouse "${warehouse.name}".`);
  }
  return { warehouse, location };
}

async function validatePositiveItems(items, t) {
  if (!items || items.length === 0) throw ApiError.badRequest('At least one item is required.');
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (Number.isNaN(item.productId)) throw ApiError.badRequest('Each item must select a product.');
    if (seen.has(item.productId)) throw ApiError.badRequest('Duplicate products are not allowed in the same document.');
    seen.add(item.productId);
    const product = await inventoryService.validateProduct(item.productId, t || null);
    const qty = Number(item.rawQty);
    if (item.rawQty === '' || item.rawQty === undefined || item.rawQty === null || Number.isNaN(qty) || !Number.isFinite(qty)) {
      throw ApiError.badRequest(`Quantity for "${product.name}" must be a valid number.`);
    }
    if (qty <= 0) throw ApiError.badRequest(`Quantity for "${product.name}" must be greater than zero.`);
    out.push({ productId: product.id, quantity: Math.round(qty * 1000) / 1000, unitOfMeasure: item.unitOfMeasure || product.unitOfMeasure || null });
  }
  return out;
}

function assertValidatable(doc, label) {
  if (doc.status === 'DONE') throw ApiError.badRequest(`${label} has already been validated.`);
  if (doc.status === 'CANCELED') throw ApiError.badRequest(`Canceled ${label.toLowerCase()}s cannot be validated.`);
  if (!VALIDATABLE.includes(doc.status)) throw ApiError.badRequest(`${label} in status ${doc.status} cannot be validated.`);
}

function assertCancellable(doc, label) {
  if (doc.status === 'DONE') throw ApiError.badRequest(`Validated ${label.toLowerCase()}s cannot be canceled; they remain traceable.`);
  if (doc.status === 'CANCELED') throw ApiError.badRequest(`${label} is already canceled.`);
  if (!CANCELLABLE.includes(doc.status)) throw ApiError.badRequest(`${label} in status ${doc.status} cannot be canceled.`);
}

module.exports = { CANCELLABLE, VALIDATABLE, assertCancellable, assertValidatable, normalizeAdjustmentItems, normalizeItems, validatePositiveItems, validateWarehouseLocation };
