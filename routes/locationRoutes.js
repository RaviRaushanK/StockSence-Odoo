const express = require('express');

const locationController = require('../controllers/locationController');
const warehouseService = require('../services/warehouseService');
const { requireAuth } = require('../middleware/authenticate');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const validateLocationBody = async (req, res, next) => {
  const { name, code } = req.body;
  const { warehouseId } = req.params;
  const errors = {};

  if (!name || !String(name).trim()) {
    errors.name = 'Location name is required.';
  } else if (String(name).trim().length < 2 || String(name).trim().length > 100) {
    errors.name = 'Location name must be between 2 and 100 characters.';
  }

  if (!code || !String(code).trim()) {
    errors.code = 'Location code is required.';
  } else if (String(code).trim().length < 2 || String(code).trim().length > 30) {
    errors.code = 'Location code must be between 2 and 30 characters.';
  }

  if (Object.keys(errors).length > 0) {
    const isEdit = Boolean(req.params.id);
    const warehouse = await warehouseService.getById(warehouseId);
    const error = ApiError.unprocessable('Please correct the highlighted fields.', errors);
    error.form = {
      view: isEdit ? 'locations/edit' : 'locations/create',
      title: isEdit ? 'Edit Location' : `New Location - ${warehouse.name}`,
      activePath: '/warehouses',
      warehouse: warehouse.get({ plain: true }),
      location: { id: req.params.id, warehouseId, name, code },
      values: { ...req.body, id: req.params.id, warehouseId },
      pageScripts: [],
    };
    return next(error);
  }

  return next();
};

router.get('/warehouses/:warehouseId/locations', requireAuth, locationController.list);
router.get('/warehouses/:warehouseId/locations/create', requireAuth, locationController.showCreate);
router.post(
  '/warehouses/:warehouseId/locations/create',
  requireAuth,
  validateLocationBody,
  locationController.create,
);
router.get('/warehouses/:warehouseId/locations/:id/edit', requireAuth, locationController.showEdit);
router.post(
  '/warehouses/:warehouseId/locations/:id/edit',
  requireAuth,
  validateLocationBody,
  locationController.update,
);
router.post(
  '/warehouses/:warehouseId/locations/:id/toggle-status',
  requireAuth,
  locationController.toggleStatus,
);
router.post(
  '/warehouses/:warehouseId/locations/:id/delete',
  requireAuth,
  locationController.delete,
);

module.exports = router;
