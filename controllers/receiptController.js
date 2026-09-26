const receiptService = require('../services/receiptService');
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

const receiptController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await receiptService.list({ search, status, page });
    res.render('operations/receipts/index', {
      layout: 'layouts/app',
      title: 'Receipts',
      activePath: '/operations/receipts',
      user: req.user,
      receipts: result.receipts,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const data = await formData();
    res.render('operations/receipts/create', {
      layout: 'layouts/app',
      title: 'New Receipt',
      activePath: '/operations/receipts',
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
      const created = await receiptService.create(req.body, req.user.id);
      flashSuccess(res, `Receipt ${created.receiptNumber} created as draft.`);
      return res.redirect(`/operations/receipts/${created.id}`);
    } catch (err) {
      if (err.isOperational) {
        const data = await formData();
        return res.status(err.statusCode || 400).render('operations/receipts/create', {
          layout: 'layouts/app',
          title: 'New Receipt',
          activePath: '/operations/receipts',
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
    const receipt = await receiptService.getById(req.params.id);
    res.render('operations/receipts/show', {
      layout: 'layouts/app',
      title: `Receipt ${receipt.receiptNumber}`,
      activePath: '/operations/receipts',
      user: req.user,
      receipt: receipt.get({ plain: true }),
      pageScripts: ['/js/master-data.js'],
    });
  }),

  validate: asyncHandler(async (req, res) => {
    try {
      await receiptService.validate(req.params.id, req.user.id);
      flashSuccess(res, 'Receipt validated and stock updated.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/receipts/${req.params.id}`);
  }),

  cancel: asyncHandler(async (req, res) => {
    try {
      await receiptService.cancel(req.params.id);
      flashSuccess(res, 'Receipt canceled without changing stock.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/receipts/${req.params.id}`);
  }),

  locations: asyncHandler(async (req, res) => {
    const locations = await Location.findAll({
      where: { warehouseId: req.params.warehouseId, isActive: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: locations.map((l) => l.get({ plain: true })) });
  }),
};

module.exports = receiptController;
