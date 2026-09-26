const adjustmentService = require('../services/adjustmentService');
const productService = require('../services/productService');
const warehouseService = require('../services/warehouseService');
const { Location } = require('../models');
const { flashError, flashSuccess } = require('../middleware/flash');
const asyncHandler = require('../utils/asyncHandler');

async function formData() {
  const [products, warehouses] = await Promise.all([
    productService.list({ limit: 100 }),
    warehouseService.listActive(),
  ]);
  return {
    products: products.products.filter((p) => p.isActive),
    warehouses: warehouses.map((w) => w.get({ plain: true })),
  };
}

const adjustmentController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await adjustmentService.list({ search, status, page });
    res.render('operations/adjustments/index', {
      layout: 'layouts/app',
      title: 'Inventory Adjustments',
      activePath: '/operations/adjustments',
      user: req.user,
      adjustments: result.adjustments,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const data = await formData();
    res.render('operations/adjustments/create', {
      layout: 'layouts/app',
      title: 'New Inventory Adjustment',
      activePath: '/operations/adjustments',
      user: req.user,
      products: data.products,
      warehouses: data.warehouses,
      values: {},
      errors: {},
      pageScripts: ['/js/operations.js'],
    });
  }),

  create: asyncHandler(async (req, res) => {
    try {
      const created = await adjustmentService.create(req.body, req.user.id);
      flashSuccess(res, `Adjustment ${created.adjustmentNumber} created as draft.`);
      return res.redirect(`/operations/adjustments/${created.id}`);
    } catch (err) {
      if (err.isOperational) {
        const data = await formData();
        return res.status(err.statusCode || 400).render('operations/adjustments/create', {
          layout: 'layouts/app',
          title: 'New Inventory Adjustment',
          activePath: '/operations/adjustments',
          user: req.user,
          products: data.products,
          warehouses: data.warehouses,
          values: req.body || {},
          errors: { form: err.message },
          pageScripts: ['/js/operations.js'],
        });
      }
      throw err;
    }
  }),

  show: asyncHandler(async (req, res) => {
    const adjustment = await adjustmentService.getById(req.params.id);
    res.render('operations/adjustments/show', {
      layout: 'layouts/app',
      title: `Adjustment ${adjustment.adjustmentNumber}`,
      activePath: '/operations/adjustments',
      user: req.user,
      adjustment: adjustment.get({ plain: true }),
      pageScripts: ['/js/master-data.js'],
    });
  }),

  validate: asyncHandler(async (req, res) => {
    try {
      await adjustmentService.validate(req.params.id, req.user.id);
      flashSuccess(res, 'Adjustment validated and stock reconciled.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/adjustments/${req.params.id}`);
  }),

  cancel: asyncHandler(async (req, res) => {
    try {
      await adjustmentService.cancel(req.params.id);
      flashSuccess(res, 'Adjustment canceled without changing stock.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/adjustments/${req.params.id}`);
  }),

  locations: asyncHandler(async (req, res) => {
    const locations = await Location.findAll({
      where: { warehouseId: req.params.warehouseId, isActive: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: locations.map((l) => l.get({ plain: true })) });
  }),
};

module.exports = adjustmentController;
