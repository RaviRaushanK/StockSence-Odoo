const { DataTypes, Model } = require('sequelize');

const MOVEMENT_TYPES = Object.freeze([
  'RECEIPT',
  'DELIVERY',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
]);

const REFERENCE_TYPES = Object.freeze([
  'RECEIPT',
  'DELIVERY',
  'TRANSFER',
  'ADJUSTMENT',
  'MANUAL',
]);

class StockMovement extends Model {}

StockMovement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Product is required.' },
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
    movementType: {
      type: DataTypes.ENUM(...MOVEMENT_TYPES),
      allowNull: false,
      validate: {
        isIn: {
          args: [MOVEMENT_TYPES],
          msg: `Movement type must be one of: ${MOVEMENT_TYPES.join(', ')}.`,
        },
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0.001],
          msg: 'Quantity must be greater than zero.',
        },
      },
    },
    quantityBefore: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Quantity before must be zero or positive.',
        },
      },
    },
    quantityAfter: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Quantity after must be zero or positive.',
        },
      },
    },
    referenceType: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue(
          'referenceType',
          typeof val === 'string' ? val.trim().toUpperCase() || null : null,
        );
      },
    },
    referenceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue(
          'referenceId',
          typeof val === 'string' ? val.trim() || null : null,
        );
      },
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue(
          'reason',
          typeof val === 'string' ? val.trim() || null : null,
        );
      },
    },
    performedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'User is required.' },
      },
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    updatedAt: false,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['location_id'] },
      { fields: ['movement_type'] },
      { fields: ['reference_type', 'reference_id'] },
      { fields: ['performed_by'] },
      { fields: ['created_at'] },
    ],
  },
);

module.exports = {
  MOVEMENT_TYPES,
  REFERENCE_TYPES,
  StockMovement,
};
