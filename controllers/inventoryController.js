const inventoryService = require('../services/inventoryService');
const warehouseService = require('../services/warehouseService');
const productService = require('../services/productService');
const { Location } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const inventoryController = {
  stockOverview: asyncHandler(async (req, res) => {
    const { search, locationId, warehouseId, stockStatus, page } = req.query;

    const [overview, warehouses] = await Promise.all([
      inventoryService.getStockOverview({
        search,
        locationId,
        warehouseId,
        stockStatus,
        page,
      }),
      warehouseService.listActive(),
    ]);

    let locations = [];
    if (warehouseId) {
      locations = await Location.findAll({
        where: { warehouseId, isActive: true },
        order: [['name', 'ASC']],
      });
    }

    res.render('inventory/index', {
      layout: 'layouts/app',
      title: 'Stock Overview',
      activePath: '/inventory',
      user: req.user,
      balances: overview.balances,
      warehouses: warehouses.map((w) => w.get({ plain: true })),
      locations: locations.map((l) => l.get({ plain: true })),
      pagination: overview.pagination,
      filters: overview.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  moveHistory: asyncHandler(async (req, res) => {
    const { productId, locationId, movementType, search, page } = req.query;

    const [history, products] = await Promise.all([
      inventoryService.getMovementHistory({
        productId,
        locationId,
        movementType,
        search,
        page,
      }),
      productService.list({ limit: 100 }),
    ]);

    res.render('operations/move-history', {
      layout: 'layouts/app',
      title: 'Move History',
      activePath: '/move-history',
      user: req.user,
      movements: history.movements,
      products: products.products,
      movementTypes: inventoryService.MOVEMENT_TYPES,
      pagination: history.pagination,
      filters: history.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),
};

module.exports = inventoryController;
