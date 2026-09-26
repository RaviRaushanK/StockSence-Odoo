const locationService = require('../services/locationService');
const warehouseService = require('../services/warehouseService');
const { flashError, flashSuccess } = require('../middleware/flash');
const asyncHandler = require('../utils/asyncHandler');

const locationController = {
  list: asyncHandler(async (req, res) => {
    const { warehouseId } = req.params;
    const { search, status, page } = req.query;
    const result = await locationService.listByWarehouse(warehouseId, { search, status, page });

    res.render('locations/index', {
      layout: 'layouts/app',
      title: `Locations - ${result.warehouse.name}`,
      activePath: '/warehouses',
      user: req.user,
      warehouse: result.warehouse,
      locations: result.locations,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const { warehouseId } = req.params;
    const warehouse = await warehouseService.getById(warehouseId);

    res.render('locations/create', {
      layout: 'layouts/app',
      title: `New Location - ${warehouse.name}`,
      activePath: '/warehouses',
      user: req.user,
      warehouse: warehouse.get({ plain: true }),
      values: { warehouseId },
      errors: {},
      pageScripts: [],
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { warehouseId } = req.params;
    const { name, code, description, isActive } = req.body;

    try {
      await locationService.create({
        warehouseId,
        name,
        code,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Location created successfully.');
      return res.redirect(`/warehouses/${warehouseId}/locations`);
    } catch (err) {
      if (err.isOperational) {
        const warehouse = await warehouseService.getById(warehouseId);
        return res.status(err.statusCode || 400).render('locations/create', {
          layout: 'layouts/app',
          title: `New Location - ${warehouse.name}`,
          activePath: '/warehouses',
          user: req.user,
          warehouse: warehouse.get({ plain: true }),
          values: req.body || {},
          errors: { [err.statusCode === 409 ? 'code' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  showEdit: asyncHandler(async (req, res) => {
    const { warehouseId, id } = req.params;
    const [location, warehouse] = await Promise.all([
      locationService.getById(id, warehouseId),
      warehouseService.getById(warehouseId),
    ]);

    res.render('locations/edit', {
      layout: 'layouts/app',
      title: `Edit Location - ${location.name}`,
      activePath: '/warehouses',
      user: req.user,
      warehouse: warehouse.get({ plain: true }),
      location: location.get({ plain: true }),
      values: location.get({ plain: true }),
      errors: {},
      pageScripts: [],
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { warehouseId, id } = req.params;
    const { name, code, description, isActive } = req.body;

    try {
      await locationService.update(id, {
        name,
        code,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      }, warehouseId);
      flashSuccess(res, 'Location updated successfully.');
      return res.redirect(`/warehouses/${warehouseId}/locations`);
    } catch (err) {
      if (err.isOperational) {
        const warehouse = await warehouseService.getById(warehouseId);
        return res.status(err.statusCode || 400).render('locations/edit', {
          layout: 'layouts/app',
          title: `Edit Location - ${name || ''}`,
          activePath: '/warehouses',
          user: req.user,
          warehouse: warehouse.get({ plain: true }),
          location: { id, warehouseId, name, code, description },
          values: { ...req.body, id, warehouseId },
          errors: { [err.statusCode === 409 ? 'code' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  toggleStatus: asyncHandler(async (req, res) => {
    const { warehouseId, id } = req.params;
    const location = await locationService.toggleStatus(id, warehouseId);
    flashSuccess(
      res,
      `Location "${location.name}" has been ${location.isActive ? 'activated' : 'deactivated'}.`,
    );
    res.redirect(`/warehouses/${warehouseId}/locations`);
  }),

  delete: asyncHandler(async (req, res) => {
    const { warehouseId, id } = req.params;
    try {
      await locationService.delete(id, warehouseId);
      flashSuccess(res, 'Location deleted successfully.');
    } catch (err) {
      if (err.isOperational) {
        flashError(res, err.message);
      } else {
        throw err;
      }
    }
    res.redirect(`/warehouses/${warehouseId}/locations`);
  }),
};

module.exports = locationController;
