const { DataTypes, Model } = require('sequelize');

const DELIVERY_STATUSES = Object.freeze(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']);

class Delivery extends Model {}

Delivery.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    deliveryNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Delivery number is required.' },
      },
    },
    customerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Customer name is required.' },
        len: { args: [2, 120], msg: 'Customer name must be between 2 and 120 characters.' },
      },
      set(val) {
        this.setDataValue('customerName', typeof val === 'string' ? val.trim() : val);
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
      type: DataTypes.ENUM(...DELIVERY_STATUSES),
      allowNull: false,
      defaultValue: 'DRAFT',
      validate: {
        isIn: {
          args: [DELIVERY_STATUSES],
          msg: `Status must be one of: ${DELIVERY_STATUSES.join(', ')}.`,
        },
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
    modelName: 'Delivery',
    tableName: 'deliveries',
    indexes: [
      { unique: true, fields: ['delivery_number'] },
      { fields: ['warehouse_id'] },
      { fields: ['location_id'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['created_at'] },
    ],
  },
);

module.exports = {
  DELIVERY_STATUSES,
  Delivery,
};
