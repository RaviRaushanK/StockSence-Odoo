const { DataTypes, Model } = require('sequelize');

const TRANSFER_STATUSES = Object.freeze(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']);

class InternalTransfer extends Model {}

InternalTransfer.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    transferNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Transfer number is required.' },
      },
    },
    sourceWarehouseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Source warehouse is required.' },
      },
    },
    sourceLocationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Source location is required.' },
      },
    },
    destinationWarehouseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Destination warehouse is required.' },
      },
    },
    destinationLocationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      validate: {
        notNull: { msg: 'Destination location is required.' },
      },
    },
    status: {
      type: DataTypes.ENUM(...TRANSFER_STATUSES),
      allowNull: false,
      defaultValue: 'DRAFT',
      validate: {
        isIn: {
          args: [TRANSFER_STATUSES],
          msg: `Status must be one of: ${TRANSFER_STATUSES.join(', ')}.`,
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
    modelName: 'InternalTransfer',
    tableName: 'internal_transfers',
    indexes: [
      { unique: true, fields: ['transfer_number'] },
      { fields: ['source_warehouse_id'] },
      { fields: ['source_location_id'] },
      { fields: ['destination_warehouse_id'] },
      { fields: ['destination_location_id'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['created_at'] },
    ],
  },
);

module.exports = {
  TRANSFER_STATUSES,
  InternalTransfer,
};
