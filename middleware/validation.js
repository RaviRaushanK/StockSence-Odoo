const ApiError = require('../utils/ApiError');

const collectErrors = (schema, body) => {
  const errors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const message = rule(body?.[field]);
    if (message) errors[field] = message;
  }

  return errors;
};

/**
 * Validates the request body against a field/rule map.
 *
 * When `form` metadata is supplied the failure is rendered back through that
 * EJS view so the user sees the messages inline next to the fields. Without it
 * the request fails with the standard 422 payload.
 */
const validateBody = (schema, form = null) => (req, res, next) => {
  const errors = collectErrors(schema, req.body);

  if (Object.keys(errors).length === 0) {
    return next();
  }

  const error = ApiError.unprocessable('Please correct the highlighted fields.', errors);

  if (form) {
    error.form = { ...form, values: req.body || {} };
  }

  return next(error);
};

module.exports = { validateBody };