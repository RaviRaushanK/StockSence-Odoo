const deliveryService = require('../services/deliveryService');
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

const deliveryController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await deliveryService.list({ search, status, page });
    res.render('operations/deliveries/index', {
      layout: 'layouts/app',
      title: 'Delivery Orders',
      activePath: '/operations/deliveries',
      user: req.user,
      deliveries: result.deliveries,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const data = await formData();
    res.render('operations/deliveries/create', {
      layout: 'layouts/app',
      title: 'New Delivery Order',
      activePath: '/operations/deliveries',
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
      const created = await deliveryService.create(req.body, req.user.id);
      flashSuccess(res, `Delivery ${created.deliveryNumber} created as draft.`);
      return res.redirect(`/operations/deliveries/${created.id}`);
    } catch (err) {
      if (err.isOperational) {
        const data = await formData();
        return res.status(err.statusCode || 400).render('operations/deliveries/create', {
          layout: 'layouts/app',
          title: 'New Delivery Order',
          activePath: '/operations/deliveries',
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
    const delivery = await deliveryService.getById(req.params.id);
    res.render('operations/deliveries/show', {
      layout: 'layouts/app',
      title: `Delivery ${delivery.deliveryNumber}`,
      activePath: '/operations/deliveries',
      user: req.user,
      delivery: delivery.get({ plain: true }),
      pageScripts: ['/js/master-data.js'],
    });
  }),

  validate: asyncHandler(async (req, res) => {
    try {
      await deliveryService.validate(req.params.id, req.user.id);
      flashSuccess(res, 'Delivery validated and stock updated.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/deliveries/${req.params.id}`);
  }),

  cancel: asyncHandler(async (req, res) => {
    try {
      await deliveryService.cancel(req.params.id);
      flashSuccess(res, 'Delivery canceled without changing stock.');
    } catch (err) {
      if (err.isOperational) flashError(res, err.message);
      else throw err;
    }
    return res.redirect(`/operations/deliveries/${req.params.id}`);
  }),

  locations: asyncHandler(async (req, res) => {
    const locations = await Location.findAll({
      where: { warehouseId: req.params.warehouseId, isActive: true },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: locations.map((l) => l.get({ plain: true })) });
  }),
};

module.exports = deliveryController;
