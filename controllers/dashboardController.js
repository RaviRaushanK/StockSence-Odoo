const { PLANNED_MODULES } = require('../config/navigation');
const { getFirstName, getRoleLabel } = require('../utils/viewHelpers');

/** Renders a protected page through the shared application layout. */
const renderApp = (req, res, view, options = {}) =>
  res.render(view, { layout: 'layouts/app', user: req.user, ...options });

const index = (req, res) =>
  renderApp(req, res, 'dashboard/index', {
    title: 'Dashboard',
    activePath: '/dashboard',
    pageScripts: [],
    firstName: getFirstName(req.user.fullName),
    roleLabel: getRoleLabel(req.user.role),
    isActive: Boolean(req.user.isActive),
    plannedModules: PLANNED_MODULES,
  });

/** Builds a placeholder handler for a module scheduled for a later phase. */
const placeholder = (view, title, description, activePath) => (req, res) =>
  renderApp(req, res, view, {
    title,
    activePath,
    pageScripts: [],
    placeholder: { title, description },
  });

const products = placeholder(
  'products/index',
  'Products',
  'The product catalogue with SKUs, units and reorder thresholds is planned for the next development phase.',
  '/products',
);

const warehouses = placeholder(
  'warehouses/index',
  'Warehouses',
  'Warehouse and bin management is planned for the next development phase.',
  '/warehouses',
);

const receipts = placeholder(
  'operations/receipts',
  'Receipts',
  'Goods receipts for incoming supplier stock are planned for the next development phase.',
  '/receipts',
);

const deliveries = placeholder(
  'operations/deliveries',
  'Delivery Orders',
  'Outbound delivery orders with picking and dispatch are planned for the next development phase.',
  '/deliveries',
);

const transfers = placeholder(
  'operations/transfers',
  'Internal Transfers',
  'Stock transfers between warehouses are planned for the next development phase.',
  '/transfers',
);

const adjustments = placeholder(
  'operations/adjustments',
  'Inventory Adjustments',
  'Stock corrections with a full audit trail are planned for the next development phase.',
  '/adjustments',
);

const moveHistory = placeholder(
  'operations/move-history',
  'Move History',
  'The searchable stock movement ledger is planned for the next development phase.',
  '/move-history',
);

const settings = placeholder(
  'settings/index',
  'Settings',
  'Account and workspace settings are planned for a later phase.',
  '/settings',
);

module.exports = {
  adjustments,
  deliveries,
  index,
  moveHistory,
  products,
  receipts,
  settings,
  transfers,
  warehouses,
};