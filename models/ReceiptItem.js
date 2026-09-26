const { DataTypes, Model } = require('sequelize');

class ReceiptItem extends Model {}

ReceiptItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    receiptId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'receipts',
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
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Quantity must be a valid decimal number.' },
        min: { args: ['0.001'], msg: 'Quantity must be greater than zero.' },
      },
      get() {
        const raw = this.getDataValue('quantity');
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
    modelName: 'ReceiptItem',
    tableName: 'receipt_items',
    indexes: [
      { fields: ['receipt_id'] },
      { fields: ['product_id'] },
    ],
  },
);

module.exports = ReceiptItem;
