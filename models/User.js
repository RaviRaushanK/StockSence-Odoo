const { DataTypes, Model } = require('sequelize');

const { ROLES } = require('../utils/validators');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required.' },
        len: { args: [2, 120], msg: 'Full name must be between 2 and 120 characters.' },
      },
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: { msg: 'An account with this email already exists.' },
      validate: {
        notEmpty: { msg: 'Email address is required.' },
        isEmail: { msg: 'Enter a valid email address.' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required.' },
      },
    },
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'WAREHOUSE_STAFF',
      validate: {
        isIn: { args: [ROLES], msg: `Role must be one of: ${ROLES.join(', ')}.` },
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
    modelName: 'User',
    tableName: 'users',
    indexes: [{ unique: true, fields: ['email'] }, { fields: ['role'] }],
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
  },
);

module.exports = User;
