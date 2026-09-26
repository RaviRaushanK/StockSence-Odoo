const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_PATTERN = /^\d{6}$/;
const ROLES = Object.freeze(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']);
const PASSWORD_MIN_LENGTH = 8;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const isEmail = (value) => EMAIL_PATTERN.test(asString(value));

const isOtp = (value) => OTP_PATTERN.test(asString(value));

const isRole = (value) => ROLES.includes(value);

const checkPasswordStrength = (value) => {
  if (isBlank(value)) return 'Password is required.';
  if (asString(value).length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(asString(value)) || !/\d/.test(asString(value))) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
};

const validators = {
  fullName: (value) => {
    if (isBlank(value)) return 'Full name is required.';
    if (asString(value).length < 2) return 'Full name must be at least 2 characters.';
    if (asString(value).length > 120) return 'Full name must be at most 120 characters.';
    return null;
  },
  email: (value) => {
    if (isBlank(value)) return 'Email address is required.';
    if (!isEmail(value)) return 'Enter a valid email address.';
    return null;
  },
  password: (value) => checkPasswordStrength(value),
  currentPassword: (value) => (isBlank(value) ? 'Password is required.' : null),
  role: (value) => {
    if (isBlank(value)) return null;
    if (!isRole(value)) return 'Role must be INVENTORY_MANAGER or WAREHOUSE_STAFF.';
    return null;
  },
  otp: (value) => {
    if (isBlank(value)) return 'OTP is required.';
    if (!isOtp(value)) return 'Enter the 6-digit OTP.';
    return null;
  },
};

module.exports = {
  ROLES,
  ROLE_LABELS: Object.freeze({
    INVENTORY_MANAGER: 'Inventory Manager',
    WAREHOUSE_STAFF: 'Warehouse Staff',
  }),
  validators,
};
