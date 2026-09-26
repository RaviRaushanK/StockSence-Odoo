const { ROLE_LABELS } = require('./validators');

const getInitials = (fullName = '') =>
  String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getFirstName = (fullName = '') => String(fullName).trim().split(/\s+/)[0] ?? '';

const getRoleLabel = (role) => ROLE_LABELS[role] || 'User';

module.exports = { getFirstName, getInitials, getRoleLabel };