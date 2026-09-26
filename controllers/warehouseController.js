const warehouseService = require('../services/warehouseService');
const { flashError, flashSuccess } = require('../middleware/flash');
const asyncHandler = require('../utils/asyncHandler');

const warehouseController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await warehouseService.list({ search, status, page });

    res.render('warehouses/index', {
      layout: 'layouts/app',
      title: 'Warehouses',
      activePath: '/warehouses',
      user: req.user,
      warehouses: result.warehouses,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: (req, res) => {
    res.render('warehouses/create', {
      layout: 'layouts/app',
      title: 'New Warehouse',
      activePath: '/warehouses',
      user: req.user,
      values: {},
      errors: {},
      pageScripts: [],
    });
  },

  create: asyncHandler(async (req, res) => {
    const { name, code, address, description, isActive } = req.body;
    try {
      await warehouseService.create({
        name,
        code,
        address,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Warehouse created successfully.');
      return res.redirect('/warehouses');
    } catch (err) {
      if (err.isOperational) {
        return res.status(err.statusCode || 400).render('warehouses/create', {
          layout: 'layouts/app',
          title: 'New Warehouse',
          activePath: '/warehouses',
          user: req.user,
          values: req.body || {},
          errors: { [err.statusCode === 409 ? 'code' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  showEdit: asyncHandler(async (req, res) => {
    const warehouse = await warehouseService.getById(req.params.id);
    res.render('warehouses/edit', {
      layout: 'layouts/app',
      title: `Edit Warehouse - ${warehouse.name}`,
      activePath: '/warehouses',
      user: req.user,
      warehouse: warehouse.get({ plain: true }),
      values: warehouse.get({ plain: true }),
      errors: {},
      pageScripts: [],
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { name, code, address, description, isActive } = req.body;
    try {
      await warehouseService.update(req.params.id, {
        name,
        code,
        address,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Warehouse updated successfully.');
      return res.redirect('/warehouses');
    } catch (err) {
      if (err.isOperational) {
        const warehouse = await warehouseService.getById(req.params.id).catch(() => ({ id: req.params.id, name: '' }));
        return res.status(err.statusCode || 400).render('warehouses/edit', {
          layout: 'layouts/app',
          title: `Edit Warehouse - ${warehouse.name || ''}`,
          activePath: '/warehouses',
          user: req.user,
          warehouse,
          values: { ...req.body, id: req.params.id },
          errors: { [err.statusCode === 409 ? 'code' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  toggleStatus: asyncHandler(async (req, res) => {
    const warehouse = await warehouseService.toggleStatus(req.params.id);
    flashSuccess(
      res,
      `Warehouse "${warehouse.name}" has been ${warehouse.isActive ? 'activated' : 'deactivated'}.`,
    );
    res.redirect('/warehouses');
  }),

  delete: asyncHandler(async (req, res) => {
    try {
      await warehouseService.delete(req.params.id);
      flashSuccess(res, 'Warehouse deleted successfully.');
    } catch (err) {
      if (err.isOperational) {
        flashError(res, err.message);
      } else {
        throw err;
      }
    }
    res.redirect('/warehouses');
  }),
};

module.exports = warehouseController;
