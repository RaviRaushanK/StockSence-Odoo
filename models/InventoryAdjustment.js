const { DataTypes, Model } = require('sequelize');

const ADJUSTMENT_STATUSES = Object.freeze(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']);

class InventoryAdjustment extends Model {}

InventoryAdjustment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    adjustmentNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Adjustment number is required.' },
      },
    },
    warehouseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Warehouse is required.' },
      },
    },
    locationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Location is required.' },
      },
    },
    status: {
      type: DataTypes.ENUM(...ADJUSTMENT_STATUSES),
      allowNull: false,
      defaultValue: 'DRAFT',
      validate: {
        isIn: {
          args: [ADJUSTMENT_STATUSES],
          msg: `Status must be one of: ${ADJUSTMENT_STATUSES.join(', ')}.`,
        },
      },
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Reason is required.' },
        len: { args: [2, 255], msg: 'Reason must be between 2 and 255 characters.' },
      },
      set(val) {
        this.setDataValue('reason', typeof val === 'string' ? val.trim() : val);
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(val) {
        this.setDataValue('notes', typeof val === 'string' ? val.trim() || null : null);
      },
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    validatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'InventoryAdjustment',
    tableName: 'inventory_adjustments',
    indexes: [
      { unique: true, fields: ['adjustment_number'] },
      { fields: ['warehouse_id'] },
      { fields: ['location_id'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['created_at'] },
    ],
  },
);

module.exports = {
  ADJUSTMENT_STATUSES,
  InventoryAdjustment,
};
