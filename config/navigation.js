const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' }],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', path: '/products', icon: 'bi-box-seam' },
      { label: 'Stock Overview', path: '/inventory', icon: 'bi-layers' },
      { label: 'Move History', path: '/move-history', icon: 'bi-clock-history' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Receipts', path: '/operations/receipts', icon: 'bi-box-arrow-in-down' },
      { label: 'Delivery Orders', path: '/operations/deliveries', icon: 'bi-truck' },
      { label: 'Internal Transfers', path: '/operations/transfers', icon: 'bi-arrow-left-right' },
      { label: 'Inventory Adjustments', path: '/operations/adjustments', icon: 'bi-sliders' },
    ],
  },
  {
    title: 'Network',
    items: [{ label: 'Warehouses', path: '/warehouses', icon: 'bi-buildings' }],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', path: '/settings', icon: 'bi-gear' }],
  },
];

const AUTH_HIGHLIGHTS = [
  { icon: 'bi-box-seam', text: 'Track products, receipts and deliveries in one place.' },
  { icon: 'bi-arrow-left-right', text: 'Handle internal transfers and stock adjustments.' },
  { icon: 'bi-buildings', text: 'Organise stock across multiple warehouses.' },
];

const PLANNED_MODULES = [
  {
    title: 'Products',
    icon: 'bi-box-seam',
    description: 'Product catalogue with SKUs, units and reorder thresholds.',
  },
  {
    title: 'Receipts',
    icon: 'bi-box-arrow-in-down',
    description: 'Record incoming stock from suppliers against purchase receipts.',
  },
  {
    title: 'Delivery Orders',
    icon: 'bi-truck',
    description: 'Create, pick and dispatch outbound delivery orders.',
  },
  {
    title: 'Internal Transfers',
    icon: 'bi-arrow-left-right',
    description: 'Move stock between warehouses with approval tracking.',
  },
  {
    title: 'Inventory Adjustments',
    icon: 'bi-sliders',
    description: 'Correct stock discrepancies with a full audit trail.',
  },
  {
    title: 'Move History',
    icon: 'bi-clock-history',
    description: 'Searchable log of every stock movement in the system.',
  },
];

module.exports = { AUTH_HIGHLIGHTS, NAV_SECTIONS, PLANNED_MODULES };
