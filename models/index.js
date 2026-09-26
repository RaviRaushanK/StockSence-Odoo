const { sequelize } = require('../config/database');
const Category = require('./Category');
const Location = require('./Location');
const Product = require('./Product');
const User = require('./User');
const Warehouse = require('./Warehouse');

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

module.exports = {
  Category,
  Location,
  Product,
  User,
  Warehouse,
  sequelize,
};

