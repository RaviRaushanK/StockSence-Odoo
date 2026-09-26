const { DataTypes, Model } = require('sequelize');

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'A category with this name already exists.' },
      validate: {
        notEmpty: { msg: 'Category name is required.' },
        len: { args: [2, 100], msg: 'Category name must be between 2 and 100 characters.' },
      },
      set(val) {
        this.setDataValue('name', typeof val === 'string' ? val.trim() : val);
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
    modelName: 'Category',
    tableName: 'categories',
    indexes: [{ unique: true, fields: ['name'] }, { fields: ['is_active'] }],
  },
);

module.exports = Category;
