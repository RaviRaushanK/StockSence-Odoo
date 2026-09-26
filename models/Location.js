const { DataTypes, Model } = require('sequelize');

class Location extends Model {}

Location.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Location name is required.' },
        len: { args: [2, 100], msg: 'Location name must be between 2 and 100 characters.' },
      },
      set(val) {
        this.setDataValue('name', typeof val === 'string' ? val.trim() : val);
      },
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Location code is required.' },
        len: { args: [2, 30], msg: 'Location code must be between 2 and 30 characters.' },
      },
      set(val) {
        this.setDataValue(
          'code',
          typeof val === 'string' ? val.trim().toUpperCase() : val,
        );
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
    modelName: 'Location',
    tableName: 'locations',
    indexes: [
      {
        unique: true,
        fields: ['warehouse_id', 'code'],
        name: 'locations_warehouse_code_unique',
      },
      { fields: ['warehouse_id'] },
      { fields: ['is_active'] },
    ],
  },
);

module.exports = Location;
