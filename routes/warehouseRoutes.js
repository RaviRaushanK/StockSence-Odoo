const express = require('express');

const warehouseController = require('../controllers/warehouseController');
const { requireAuth } = require('../middleware/authenticate');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

const warehouseSchema = {
  name: (val) => {
    if (!val || !String(val).trim()) return 'Warehouse name is required.';
    if (String(val).trim().length < 2) return 'Warehouse name must be at least 2 characters.';
    if (String(val).trim().length > 120) return 'Warehouse name must be at most 120 characters.';
    return null;
  },
  code: (val) => {
    if (!val || !String(val).trim()) return 'Warehouse code is required.';
    if (String(val).trim().length < 2) return 'Warehouse code must be at least 2 characters.';
    if (String(val).trim().length > 30) return 'Warehouse code must be at most 30 characters.';
    return null;
  },
};

router.get('/warehouses', requireAuth, warehouseController.list);
router.get('/warehouses/create', requireAuth, warehouseController.showCreate);
router.post(
  '/warehouses/create',
  requireAuth,
  validateBody(warehouseSchema, {
    view: 'warehouses/create',
    title: 'New Warehouse',
    activePath: '/warehouses',
    pageScripts: [],
  }),
  warehouseController.create,
);
router.get('/warehouses/:id/edit', requireAuth, warehouseController.showEdit);
router.post(
  '/warehouses/:id/edit',
  requireAuth,
  validateBody(warehouseSchema, {
    view: 'warehouses/edit',
    title: 'Edit Warehouse',
    activePath: '/warehouses',
    pageScripts: [],
  }),
  warehouseController.update,
);
router.post('/warehouses/:id/toggle-status', requireAuth, warehouseController.toggleStatus);
router.post('/warehouses/:id/delete', requireAuth, warehouseController.delete);

module.exports = router;
