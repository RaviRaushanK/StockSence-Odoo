const express = require('express');

const productController = require('../controllers/productController');
const categoryService = require('../services/categoryService');
const { requireAuth } = require('../middleware/authenticate');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const validateProductBody = async (req, res, next) => {
  const { name, sku, categoryId, unitOfMeasure, reorderLevel, reorderQuantity } = req.body;
  const errors = {};

  if (!name || !String(name).trim()) {
    errors.name = 'Product name is required.';
  } else if (String(name).trim().length < 2 || String(name).trim().length > 160) {
    errors.name = 'Product name must be between 2 and 160 characters.';
  }

  if (!sku || !String(sku).trim()) {
    errors.sku = 'SKU is required.';
  } else if (String(sku).trim().length < 2 || String(sku).trim().length > 64) {
    errors.sku = 'SKU must be between 2 and 64 characters.';
  }

  if (!categoryId || Number.isNaN(parseInt(categoryId, 10))) {
    errors.categoryId = 'Category is required.';
  }

  if (!unitOfMeasure || !String(unitOfMeasure).trim()) {
    errors.unitOfMeasure = 'Unit of measure is required.';
  }

  if (reorderLevel !== undefined && reorderLevel !== '') {
    const lvl = parseInt(reorderLevel, 10);
    if (Number.isNaN(lvl) || lvl < 0) {
      errors.reorderLevel = 'Reorder level must be 0 or greater.';
    }
  }

  if (reorderQuantity !== undefined && reorderQuantity !== '') {
    const qty = parseInt(reorderQuantity, 10);
    if (Number.isNaN(qty) || qty < 0) {
      errors.reorderQuantity = 'Reorder quantity must be 0 or greater.';
    }
  }

  if (Object.keys(errors).length > 0) {
    const isEdit = Boolean(req.params.id);
    const categories = await categoryService.listActive();
    const error = ApiError.unprocessable('Please correct the highlighted fields.', errors);
    error.form = {
      view: isEdit ? 'products/edit' : 'products/create',
      title: isEdit ? 'Edit Product' : 'New Product',
      activePath: '/products',
      categories: categories.map((c) => c.get({ plain: true })),
      values: { ...req.body, id: req.params.id },
      pageScripts: [],
    };
    return next(error);
  }

  return next();
};

router.get('/products', requireAuth, productController.list);
router.get('/products/create', requireAuth, productController.showCreate);
router.post('/products/create', requireAuth, validateProductBody, productController.create);
router.get('/products/:id/edit', requireAuth, productController.showEdit);
router.post('/products/:id/edit', requireAuth, validateProductBody, productController.update);
router.post('/products/:id/toggle-status', requireAuth, productController.toggleStatus);
router.post('/products/:id/delete', requireAuth, productController.delete);

module.exports = router;
