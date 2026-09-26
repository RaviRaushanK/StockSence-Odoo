const transferService = require('../services/transferService');
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

const transferController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await transferService.list({ search, status, page });
    res.render('operations/transfers/index', {
      layout: 'layouts/app',
      title: 'Internal Transfers',
      activePath: '/operations/transfers',
      user: req.user,
      transfers: result.transfers,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const data = await formData();
    res.render('operations/transfers/create', {
      layout: 'layouts/app',
      title: 'New Internal Transfer',
      activePath: '/operations/transfers',
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
      const created = await transferService.create(req.body, req.user.id);
      flashSuccess(res, `Transfer ${created.transferNumber} created as draft.`);
      return res.redirect(`/operations/transfers/${created.id}`);
    } catch (err) {
      if (err.isOperational) {
        const data = await formData();
        return res.status(err.statusCode || 400).render('operations/transfers/create', {
          layout: 'layouts/app',
          title: 'New Internal Transfer',
          activePath: '/operations/transfers',
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
    const transfer = await transferService.getById(req.params.id);
    res.render('operations/transfers/show', {
      layout: 'layouts/app',
      title: `Transfer ${transfer.transferNumber}`,
      activePath: '/operations/transfers',
      user: req.user,
      transfer: transfer.get({ plain: true }),
      pageScripts: ['/js/master-data.js'],
    });
  }),

  validate: asyncHandler(async (req, res) => {
    try {
      await transferService.validate(req.params.id, req.user.id);
      flashSuccess(res, 'Transfer validated and stock moved.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/transfers/${req.params.id}`);
  }),

  cancel: asyncHandler(async (req, res) => {
    try {
      await transferService.cancel(req.params.id);
      flashSuccess(res, 'Transfer canceled without changing stock.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/transfers/${req.params.id}`);
  }),

  locations: asyncHandler(async (req, res) => {
    const locations = await Location.findAll({
      where: { warehouseId: req.params.warehouseId, isActive: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: locations.map((l) => l.get({ plain: true })) });
  }),
};

module.exports = transferController;
