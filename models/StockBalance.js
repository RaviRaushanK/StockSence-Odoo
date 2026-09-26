const { DataTypes, Model } = require('sequelize');

class StockBalance extends Model {}

StockBalance.init(
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
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: '0.000',
      validate: {
        min: {
          args: [0],
          msg: 'Stock quantity cannot be negative.',
        },
      },
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'StockBalance',
    tableName: 'stock_balances',
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'location_id'],
        name: 'stock_balances_product_location_unique',
      },
      { fields: ['location_id'] },
      { fields: ['product_id'] },
    ],
  },
);

module.exports = StockBalance;
