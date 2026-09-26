const crypto = require('crypto');

const formatDatePrefix = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const generateDocumentNumber = (prefix) => {
  const dateStr = formatDatePrefix();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${randomSuffix}`;
};

module.exports = {
  formatDatePrefix,
  generateDocumentNumber,
};
