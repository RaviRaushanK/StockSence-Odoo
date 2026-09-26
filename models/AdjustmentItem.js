const { DataTypes, Model } = require('sequelize');

class AdjustmentItem extends Model {}

AdjustmentItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    adjustmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'inventory_adjustments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    },
    recordedQuantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: '0.000',
      validate: {
        isDecimal: { msg: 'Recorded quantity must be a valid decimal number.' },
      },
      get() {
        const raw = this.getDataValue('recordedQuantity');
        return raw !== null && raw !== undefined ? parseFloat(raw).toFixed(3) : '0.000';
      },
    },
    physicalQuantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Physical quantity must be a valid decimal number.' },
        min: { args: ['0.000'], msg: 'Physical quantity cannot be negative.' },
      },
      get() {
        const raw = this.getDataValue('physicalQuantity');
        return raw !== null && raw !== undefined ? parseFloat(raw).toFixed(3) : '0.000';
      },
    },
    difference: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: '0.000',
      get() {
        const raw = this.getDataValue('difference');
        return raw !== null && raw !== undefined ? parseFloat(raw).toFixed(3) : '0.000';
      },
    },
    unitOfMeasure: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'AdjustmentItem',
    tableName: 'adjustment_items',
    indexes: [
      { fields: ['adjustment_id'] },
      { fields: ['product_id'] },
    ],
  },
);

module.exports = AdjustmentItem;
