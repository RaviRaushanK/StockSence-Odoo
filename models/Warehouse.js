const { DataTypes, Model } = require('sequelize');

class Warehouse extends Model {}

Warehouse.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Warehouse name is required.' },
        len: { args: [2, 120], msg: 'Warehouse name must be between 2 and 120 characters.' },
      },
      set(val) {
        this.setDataValue('name', typeof val === 'string' ? val.trim() : val);
      },
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { msg: 'A warehouse with this code already exists.' },
      validate: {
        notEmpty: { msg: 'Warehouse code is required.' },
        len: { args: [2, 30], msg: 'Warehouse code must be between 2 and 30 characters.' },
      },
      set(val) {
        this.setDataValue(
          'code',
          typeof val === 'string' ? val.trim().toUpperCase() : val,
        );
      },
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue('address', typeof val === 'string' ? val.trim() || null : null);
      },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      set(val) {
        this.setDataValue('description', typeof val === 'string' ? val.trim() || null : null);
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
    modelName: 'Warehouse',
    tableName: 'warehouses',
    indexes: [{ unique: true, fields: ['code'] }, { fields: ['is_active'] }],
  },
);

module.exports = Warehouse;
