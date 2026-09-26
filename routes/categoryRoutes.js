const express = require('express');

const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/authenticate');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

const categorySchema = {
  name: (val) => {
    if (!val || !String(val).trim()) return 'Category name is required.';
    if (String(val).trim().length < 2) return 'Category name must be at least 2 characters.';
    if (String(val).trim().length > 100) return 'Category name must be at most 100 characters.';
    return null;
  },
};

router.get('/categories', requireAuth, categoryController.list);
router.get('/categories/create', requireAuth, categoryController.showCreate);
router.post(
  '/categories/create',
  requireAuth,
  validateBody(categorySchema, {
    view: 'categories/create',
    title: 'New Category',
    activePath: '/products',
    pageScripts: [],
  }),
  categoryController.create,
);
router.get('/categories/:id/edit', requireAuth, categoryController.showEdit);
router.post(
  '/categories/:id/edit',
  requireAuth,
  validateBody(categorySchema, {
    view: 'categories/edit',
    title: 'Edit Category',
    activePath: '/products',
    pageScripts: [],
  }),
  categoryController.update,
);
router.post('/categories/:id/toggle-status', requireAuth, categoryController.toggleStatus);
router.post('/categories/:id/delete', requireAuth, categoryController.delete);

module.exports = router;
