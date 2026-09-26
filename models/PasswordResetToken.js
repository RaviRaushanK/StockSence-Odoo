const { DataTypes, Model } = require('sequelize');

class PasswordResetToken extends Model {}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Email address is required.' },
        isEmail: { msg: 'Enter a valid email address.' },
      },
      set(val) {
        this.setDataValue('email', typeof val === 'string' ? val.trim().toLowerCase() : val);
      },
    },
    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    consumedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: require('../config/database').sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    indexes: [
      { fields: ['email'] },
      { fields: ['expires_at'] },
    ],
  },
);

module.exports = PasswordResetToken;
