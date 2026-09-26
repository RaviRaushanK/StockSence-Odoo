const { Op, Transaction } = require('sequelize');

const {
  Location,
  MOVEMENT_TYPES,
  Product,
  REFERENCE_TYPES,
  StockBalance,
  StockMovement,
  User,
  Warehouse,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');

const PRECISION_FACTOR = 1000;

const parsePositiveDecimal = (value, fieldName = 'Quantity') => {
  if (value === undefined || value === null || value === '') {
    throw ApiError.badRequest(`${fieldName} is required.`);
  }

  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    throw ApiError.badRequest(`${fieldName} must be a valid number.`);
  }

  if (num <= 0) {
    throw ApiError.badRequest(`${fieldName} must be greater than zero.`);
  }

  return Math.round(num * PRECISION_FACTOR) / PRECISION_FACTOR;
};

const toDecimalString = (num) => (Math.round(num * PRECISION_FACTOR) / PRECISION_FACTOR).toFixed(3);

const inventoryService = {
  MOVEMENT_TYPES,
  REFERENCE_TYPES,

  async validateProduct(productId, transaction = null) {
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }
    if (!product.isActive) {
      throw ApiError.badRequest(`Product "${product.name}" is inactive.`);
    }
    return product;
  },

  async validateLocation(locationId, transaction = null) {
    const location = await Location.findByPk(locationId, {
      include: [{ model: Warehouse, as: 'warehouse' }],
      transaction,
    });
    if (!location) {
      throw ApiError.notFound('Location not found.');
    }
    if (!location.isActive) {
      throw ApiError.badRequest(`Location "${location.name}" is inactive.`);
    }
    if (!location.warehouse || !location.warehouse.isActive) {
      throw ApiError.badRequest(`Warehouse for location "${location.name}" is inactive or invalid.`);
    }
    return location;
  },

  async validateUser(userId, transaction = null) {
    if (!userId) {
      throw ApiError.unauthorized('Authenticated user is required.');
    }
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive.');
    }
    return user;
  },

  async getOrCreateBalance(productId, locationId, transaction) {
    let balance = await StockBalance.findOne({
      where: { productId, locationId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (!balance) {
      balance = await StockBalance.create(
        {
          productId,
          locationId,
          quantity: '0.000',
        },
        { transaction },
      );
    }

    return balance;
  },
  async increaseStock({
    productId,
    locationId,
    quantity,
    movementType = 'RECEIPT',
    referenceType = null,
    referenceId = null,
    reason = null,
    performedBy,
  }, externalTransaction = null) {
    const qty = parsePositiveDecimal(quantity, 'Quantity');
    const validMovementTypes = ['RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN'];
    if (!validMovementTypes.includes(movementType)) {
      throw ApiError.badRequest(`Invalid movement type for stock increase: ${movementType}`);
    }

    const run = async (t) => {
      await this.validateProduct(productId, t);
      await this.validateLocation(locationId, t);
      await this.validateUser(performedBy, t);

      const balance = await this.getOrCreateBalance(productId, locationId, t);
      const beforeNum = Math.round(Number(balance.quantity) * PRECISION_FACTOR) / PRECISION_FACTOR;
      const afterNum = Math.round((beforeNum + qty) * PRECISION_FACTOR) / PRECISION_FACTOR;

      balance.quantity = toDecimalString(afterNum);
      await balance.save({ transaction: t });

      const movement = await StockMovement.create(
        {
          productId,
          locationId,
          movementType,
          quantity: toDecimalString(qty),
          quantityBefore: toDecimalString(beforeNum),
          quantityAfter: toDecimalString(afterNum),
          referenceType,
          referenceId,
          reason,
          performedBy,
        },
        { transaction: t },
      );

      return { balance, movement };
    };

    if (externalTransaction) {
      return run(externalTransaction);
    }
    return sequelize.transaction(run);
  },

  async decreaseStock({
    productId,
    locationId,
    quantity,
    movementType = 'DELIVERY',
    referenceType = null,
    referenceId = null,
    reason = null,
    performedBy,
  }, externalTransaction = null) {
    const qty = parsePositiveDecimal(quantity, 'Quantity');
    const validMovementTypes = ['DELIVERY', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'];
    if (!validMovementTypes.includes(movementType)) {
      throw ApiError.badRequest(`Invalid movement type for stock decrease: ${movementType}`);
    }

    const run = async (t) => {
      await this.validateProduct(productId, t);
      await this.validateLocation(locationId, t);
      await this.validateUser(performedBy, t);

      const balance = await this.getOrCreateBalance(productId, locationId, t);
      const beforeNum = Math.round(Number(balance.quantity) * PRECISION_FACTOR) / PRECISION_FACTOR;

      if (beforeNum < qty) {
        throw ApiError.badRequest(
          `Insufficient stock. Available: ${toDecimalString(beforeNum)}, Requested: ${toDecimalString(qty)}.`,
          'INSUFFICIENT_STOCK',
        );
      }

      const afterNum = Math.round((beforeNum - qty) * PRECISION_FACTOR) / PRECISION_FACTOR;
      balance.quantity = toDecimalString(afterNum);
      await balance.save({ transaction: t });

      const movement = await StockMovement.create(
        {
          productId,
          locationId,
          movementType,
          quantity: toDecimalString(qty),
          quantityBefore: toDecimalString(beforeNum),
          quantityAfter: toDecimalString(afterNum),
          referenceType,
          referenceId,
          reason,
          performedBy,
        },
        { transaction: t },
      );

      return { balance, movement };
    };

    if (externalTransaction) {
      return run(externalTransaction);
    }
    return sequelize.transaction(run);
  },

  async transferStock({
    productId,
    sourceLocationId,
    destinationLocationId,
    quantity,
    referenceType = 'TRANSFER',
    referenceId = null,
    reason = null,
    performedBy,
  }, externalTransaction = null) {
    const qty = parsePositiveDecimal(quantity, 'Quantity');

    if (Number(sourceLocationId) === Number(destinationLocationId)) {
      throw ApiError.badRequest('Source and destination locations cannot be identical.');
    }

    const run = async (t) => {
      await this.validateProduct(productId, t);
      await this.validateLocation(sourceLocationId, t);
      await this.validateLocation(destinationLocationId, t);
      await this.validateUser(performedBy, t);

      const firstLocId = Math.min(Number(sourceLocationId), Number(destinationLocationId));
      const secondLocId = Math.max(Number(sourceLocationId), Number(destinationLocationId));

      const balance1 = await this.getOrCreateBalance(productId, firstLocId, t);
      const balance2 = await this.getOrCreateBalance(productId, secondLocId, t);

      const sourceBalance = Number(sourceLocationId) === firstLocId ? balance1 : balance2;
      const destBalance = Number(destinationLocationId) === firstLocId ? balance1 : balance2;

      const sourceBefore = Math.round(Number(sourceBalance.quantity) * PRECISION_FACTOR) / PRECISION_FACTOR;
      if (sourceBefore < qty) {
        throw ApiError.badRequest(
          `Insufficient stock at source location. Available: ${toDecimalString(sourceBefore)}, Transfer: ${toDecimalString(qty)}.`,
          'INSUFFICIENT_STOCK',
        );
      }

      const destBefore = Math.round(Number(destBalance.quantity) * PRECISION_FACTOR) / PRECISION_FACTOR;
      const sourceAfter = Math.round((sourceBefore - qty) * PRECISION_FACTOR) / PRECISION_FACTOR;
      const destAfter = Math.round((destBefore + qty) * PRECISION_FACTOR) / PRECISION_FACTOR;

      sourceBalance.quantity = toDecimalString(sourceAfter);
      destBalance.quantity = toDecimalString(destAfter);

      await sourceBalance.save({ transaction: t });
      await destBalance.save({ transaction: t });

      const transferOutMovement = await StockMovement.create(
        {
          productId,
          locationId: sourceLocationId,
          movementType: 'TRANSFER_OUT',
          quantity: toDecimalString(qty),
          quantityBefore: toDecimalString(sourceBefore),
          quantityAfter: toDecimalString(sourceAfter),
          referenceType,
          referenceId,
          reason,
          performedBy,
        },
        { transaction: t },
      );

      const transferInMovement = await StockMovement.create(
        {
          productId,
          locationId: destinationLocationId,
          movementType: 'TRANSFER_IN',
          quantity: toDecimalString(qty),
          quantityBefore: toDecimalString(destBefore),
          quantityAfter: toDecimalString(destAfter),
          referenceType,
          referenceId,
          reason,
          performedBy,
        },
        { transaction: t },
      );

      return {
        sourceBalance,
        destBalance,
        movements: [transferOutMovement, transferInMovement],
      };
    };

    if (externalTransaction) {
      return run(externalTransaction);
    }
    return sequelize.transaction(run);
  },

  async adjustStock({
    productId,
    locationId,
    physicalQuantity,
    referenceType = 'ADJUSTMENT',
    referenceId = null,
    reason = null,
    performedBy,
  }, externalTransaction = null) {
    if (physicalQuantity === undefined || physicalQuantity === null || physicalQuantity === '') {
      throw ApiError.badRequest('Physical quantity is required.');
    }
    const targetQty = Number(physicalQuantity);
    if (Number.isNaN(targetQty) || !Number.isFinite(targetQty) || targetQty < 0) {
      throw ApiError.badRequest('Physical quantity must be a non-negative number.');
    }
    const normalizedTarget = Math.round(targetQty * PRECISION_FACTOR) / PRECISION_FACTOR;

    const run = async (t) => {
      await this.validateProduct(productId, t);
      await this.validateLocation(locationId, t);
      await this.validateUser(performedBy, t);

      const balance = await this.getOrCreateBalance(productId, locationId, t);
      const recordedQty = Math.round(Number(balance.quantity) * PRECISION_FACTOR) / PRECISION_FACTOR;
      const difference = Math.round((normalizedTarget - recordedQty) * PRECISION_FACTOR) / PRECISION_FACTOR;

      if (difference === 0) {
        return { balance, movement: null, difference: 0 };
      }

      const isIncrease = difference > 0;
      const deltaQty = Math.abs(difference);
      const movementType = isIncrease ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

      balance.quantity = toDecimalString(normalizedTarget);
      await balance.save({ transaction: t });

      const movement = await StockMovement.create(
        {
          productId,
          locationId,
          movementType,
          quantity: toDecimalString(deltaQty),
          quantityBefore: toDecimalString(recordedQty),
          quantityAfter: toDecimalString(normalizedTarget),
          referenceType,
          referenceId,
          reason,
          performedBy,
        },
        { transaction: t },
      );

      return { balance, movement, difference };
    };

    if (externalTransaction) {
      return run(externalTransaction);
    }
    return sequelize.transaction(run);
  },

  async getStockBalance(productId, locationId) {
    const balance = await StockBalance.findOne({
      where: { productId, locationId },
      include: [
        { model: Product, as: 'product' },
        {
          model: Location,
          as: 'location',
          include: [{ model: Warehouse, as: 'warehouse' }],
        },
      ],
    });

    if (!balance) {
      return {
        productId: Number(productId),
        locationId: Number(locationId),
        quantity: '0.000',
        product: null,
        location: null,
      };
    }

    return balance.get({ plain: true });
  },

  async getProductStock(productId) {
    const balances = await StockBalance.findAll({
      where: { productId },
      include: [
        {
          model: Location,
          as: 'location',
          include: [{ model: Warehouse, as: 'warehouse' }],
        },
      ],
    });

    let total = 0;
    const locations = balances.map((b) => {
      const plain = b.get({ plain: true });
      total += Number(plain.quantity);
      return plain;
    });

    return {
      productId: Number(productId),
      totalQuantity: toDecimalString(total),
      locations,
    };
  },

  async getLocationStock(locationId) {
    const balances = await StockBalance.findAll({
      where: { locationId },
      include: [{ model: Product, as: 'product' }],
    });

    return balances.map((b) => b.get({ plain: true }));
  },

  async getStockOverview({
    search = '',
    locationId = '',
    warehouseId = '',
    stockStatus = '',
    page = 1,
    limit = 15,
  } = {}) {
    const where = {};
    const productWhere = {};
    const locationWhere = {};

    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      productWhere[Op.or] = [
        { name: { [Op.like]: `%${trimmedSearch}%` } },
        { sku: { [Op.like]: `%${trimmedSearch}%` } },
      ];
    }

    if (locationId) {
      const parsedLoc = parseInt(locationId, 10);
      if (!Number.isNaN(parsedLoc)) where.locationId = parsedLoc;
    }

    if (warehouseId) {
      const parsedWh = parseInt(warehouseId, 10);
      if (!Number.isNaN(parsedWh)) locationWhere.warehouseId = parsedWh;
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await StockBalance.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          where: Object.keys(productWhere).length ? productWhere : undefined,
          required: true,
        },
        {
          model: Location,
          as: 'location',
          where: Object.keys(locationWhere).length ? locationWhere : undefined,
          required: true,
          include: [{ model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }],
        },
      ],
      order: [
        [{ model: Product, as: 'product' }, 'name', 'ASC'],
        [{ model: Location, as: 'location' }, 'name', 'ASC'],
      ],
      limit: pageLimit,
      offset,
    });

    const items = rows.map((r) => {
      const plain = r.get({ plain: true });
      const qty = Number(plain.quantity);
      const reorderLevel = Number(plain.product.reorderLevel || 0);

      let status = 'IN_STOCK';
      let statusLabel = 'In Stock';
      let tone = 'success';

      if (qty <= 0) {
        status = 'OUT_OF_STOCK';
        statusLabel = 'Out of Stock';
        tone = 'danger';
      } else if (reorderLevel > 0 && qty <= reorderLevel) {
        status = 'LOW_STOCK';
        statusLabel = 'Low Stock';
        tone = 'warning';
      }

      plain.status = status;
      plain.statusLabel = statusLabel;
      plain.statusTone = tone;
      return plain;
    });

    const filteredItems = stockStatus
      ? items.filter((item) => item.status === stockStatus.toUpperCase())
      : items;

    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      balances: filteredItems,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: count,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: {
        search: trimmedSearch,
        locationId: locationId ? String(locationId) : '',
        warehouseId: warehouseId ? String(warehouseId) : '',
        stockStatus: stockStatus ? stockStatus.toLowerCase() : '',
      },
    };
  },

  async getMovementHistory({
    productId = '',
    locationId = '',
    movementType = '',
    search = '',
    page = 1,
    limit = 15,
  } = {}) {
    const where = {};

    if (productId) {
      const parsedProd = parseInt(productId, 10);
      if (!Number.isNaN(parsedProd)) where.productId = parsedProd;
    }

    if (locationId) {
      const parsedLoc = parseInt(locationId, 10);
      if (!Number.isNaN(parsedLoc)) where.locationId = parsedLoc;
    }

    if (movementType) {
      const upperType = movementType.toUpperCase();
      if (MOVEMENT_TYPES.includes(upperType)) where.movementType = upperType;
    }

    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      where[Op.or] = [
        { referenceId: { [Op.like]: `%${trimmedSearch}%` } },
        { reason: { [Op.like]: `%${trimmedSearch}%` } },
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'unitOfMeasure'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'code'],
          include: [{ model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset,
    });

    const movements = rows.map((m) => m.get({ plain: true }));
    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      movements,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: count,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: {
        productId: productId ? String(productId) : '',
        locationId: locationId ? String(locationId) : '',
        movementType: movementType || '',
        search: trimmedSearch,
      },
    };
  },

};

module.exports = inventoryService;
