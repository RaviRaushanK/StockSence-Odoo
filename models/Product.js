const { DataTypes, Model } = require('sequelize');

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required.' },
        len: { args: [2, 160], msg: 'Product name must be between 2 and 160 characters.' },
      },
      set(val) {
        this.setDataValue('name', typeof val === 'string' ? val.trim() : val);
      },
    },
    sku: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: { msg: 'A product with this SKU already exists.' },
      validate: {
        notEmpty: { msg: 'SKU is required.' },
        len: { args: [2, 64], msg: 'SKU must be between 2 and 64 characters.' },
      },
      set(val) {
        this.setDataValue(
          'sku',
          typeof val === 'string' ? val.trim().toUpperCase() : val,
        );
      },
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Category is required.' },
      },
    },
    unitOfMeasure: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Unit of measure is required.' },
        len: { args: [1, 32], msg: 'Unit of measure must be between 1 and 32 characters.' },
      },
      set(val) {
        this.setDataValue('unitOfMeasure', typeof val === 'string' ? val.trim() : val);
      },
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue('description', typeof val === 'string' ? val.trim() || null : null);
      },
    },
    reorderLevel: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Reorder level must be greater than or equal to 0.' },
      },
    },
    reorderQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Reorder quantity must be greater than or equal to 0.' },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'Product',
    tableName: 'products',
    indexes: [
      { unique: true, fields: ['sku'] },
      { fields: ['category_id'] },
      { fields: ['is_active'] },
      { fields: ['name'] },
    ],
  },
);

module.exports = Product;
