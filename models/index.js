const { sequelize } = require('../config/database');
const Category = require('./Category');
const Location = require('./Location');
const Product = require('./Product');
const StockBalance = require('./StockBalance');
const { StockMovement, MOVEMENT_TYPES, REFERENCE_TYPES } = require('./StockMovement');
const User = require('./User');
const Warehouse = require('./Warehouse');
const PasswordResetToken = require('./PasswordResetToken');
const { Receipt, RECEIPT_STATUSES } = require('./Receipt');
const ReceiptItem = require('./ReceiptItem');
const { Delivery, DELIVERY_STATUSES } = require('./Delivery');
const DeliveryItem = require('./DeliveryItem');
const { InternalTransfer, TRANSFER_STATUSES } = require('./InternalTransfer');
const TransferItem = require('./TransferItem');
const { InventoryAdjustment, ADJUSTMENT_STATUSES } = require('./InventoryAdjustment');
const AdjustmentItem = require('./AdjustmentItem');

Category.hasMany(Product, {
  foreignKey: { name: 'categoryId', allowNull: false },
  as: 'products',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Product.belongsTo(Category, {
  foreignKey: { name: 'categoryId', allowNull: false },
  as: 'category',
});

Warehouse.hasMany(Location, {
  foreignKey: { name: 'warehouseId', allowNull: false },
  as: 'locations',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Location.belongsTo(Warehouse, {
  foreignKey: { name: 'warehouseId', allowNull: false },
  as: 'warehouse',
});

Product.hasMany(StockBalance, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'stockBalances',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

StockBalance.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
});

Location.hasMany(StockBalance, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'stockBalances',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

StockBalance.belongsTo(Location, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'location',
});

Product.hasMany(StockMovement, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'movements',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

StockMovement.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
});

Location.hasMany(StockMovement, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'movements',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

StockMovement.belongsTo(Location, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'location',
});

User.hasMany(StockMovement, {
  foreignKey: { name: 'performedBy', allowNull: false },
  as: 'stockMovements',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

StockMovement.belongsTo(User, {
  foreignKey: { name: 'performedBy', allowNull: false },
  as: 'user',
 });

Receipt.belongsTo(Warehouse, {
  foreignKey: { name: 'warehouseId', allowNull: false },
  as: 'warehouse',
 });

Receipt.belongsTo(Location, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'location',
 });

Receipt.belongsTo(User, {
  foreignKey: { name: 'createdBy', allowNull: false },
  as: 'creator',
 });

Receipt.belongsTo(User, {
  foreignKey: { name: 'validatedBy', allowNull: true },
  as: 'validator',
 });

Receipt.hasMany(ReceiptItem, {
  foreignKey: { name: 'receiptId', allowNull: false },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
 });

ReceiptItem.belongsTo(Receipt, {
  foreignKey: { name: 'receiptId', allowNull: false },
  as: 'receipt',
 });

ReceiptItem.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
 });

Delivery.belongsTo(Warehouse, {
  foreignKey: { name: 'warehouseId', allowNull: false },
  as: 'warehouse',
 });

Delivery.belongsTo(Location, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'location',
 });

Delivery.belongsTo(User, {
  foreignKey: { name: 'createdBy', allowNull: false },
  as: 'creator',
 });

Delivery.belongsTo(User, {
  foreignKey: { name: 'validatedBy', allowNull: true },
  as: 'validator',
 });

Delivery.hasMany(DeliveryItem, {
  foreignKey: { name: 'deliveryId', allowNull: false },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
 });

DeliveryItem.belongsTo(Delivery, {
  foreignKey: { name: 'deliveryId', allowNull: false },
  as: 'delivery',
 });

DeliveryItem.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
 });

InternalTransfer.belongsTo(Warehouse, {
  foreignKey: { name: 'sourceWarehouseId', allowNull: false },
  as: 'sourceWarehouse',
 });

InternalTransfer.belongsTo(Location, {
  foreignKey: { name: 'sourceLocationId', allowNull: false },
  as: 'sourceLocation',
 });

InternalTransfer.belongsTo(Warehouse, {
  foreignKey: { name: 'destinationWarehouseId', allowNull: false },
  as: 'destinationWarehouse',
 });

InternalTransfer.belongsTo(Location, {
  foreignKey: { name: 'destinationLocationId', allowNull: false },
  as: 'destinationLocation',
 });

InternalTransfer.belongsTo(User, {
  foreignKey: { name: 'createdBy', allowNull: false },
  as: 'creator',
 });

InternalTransfer.belongsTo(User, {
  foreignKey: { name: 'validatedBy', allowNull: true },
  as: 'validator',
 });

InternalTransfer.hasMany(TransferItem, {
  foreignKey: { name: 'transferId', allowNull: false },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
 });

TransferItem.belongsTo(InternalTransfer, {
  foreignKey: { name: 'transferId', allowNull: false },
  as: 'transfer',
 });

TransferItem.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
 });

InventoryAdjustment.belongsTo(Warehouse, {
  foreignKey: { name: 'warehouseId', allowNull: false },
  as: 'warehouse',
 });

InventoryAdjustment.belongsTo(Location, {
  foreignKey: { name: 'locationId', allowNull: false },
  as: 'location',
 });

InventoryAdjustment.belongsTo(User, {
  foreignKey: { name: 'createdBy', allowNull: false },
  as: 'creator',
 });

InventoryAdjustment.belongsTo(User, {
  foreignKey: { name: 'validatedBy', allowNull: true },
  as: 'validator',
 });

InventoryAdjustment.hasMany(AdjustmentItem, {
  foreignKey: { name: 'adjustmentId', allowNull: false },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
 });

AdjustmentItem.belongsTo(InventoryAdjustment, {
  foreignKey: { name: 'adjustmentId', allowNull: false },
  as: 'adjustment',
 });

AdjustmentItem.belongsTo(Product, {
  foreignKey: { name: 'productId', allowNull: false },
  as: 'product',
 });

module.exports = {
  ADJUSTMENT_STATUSES,
  AdjustmentItem,
  Category,
  DELIVERY_STATUSES,
  Delivery,
  DeliveryItem,
  InternalTransfer,
  InventoryAdjustment,
  Location,
  MOVEMENT_TYPES,
  PasswordResetToken,
  Product,
  RECEIPT_STATUSES,
  REFERENCE_TYPES,
  Receipt,
  ReceiptItem,
  StockBalance,
  StockMovement,
  TRANSFER_STATUSES,
  TransferItem,
  User,
  Warehouse,
  sequelize,
};


