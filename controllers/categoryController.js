const categoryService = require('../services/categoryService');
const { flashError, flashSuccess } = require('../middleware/flash');
const asyncHandler = require('../utils/asyncHandler');

const categoryController = {
  list: asyncHandler(async (req, res) => {
    const { search, status, page } = req.query;
    const result = await categoryService.list({ search, status, page });

    res.render('categories/index', {
      layout: 'layouts/app',
      title: 'Categories',
      activePath: '/products',
      user: req.user,
      categories: result.categories,
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: (req, res) => {
    res.render('categories/create', {
      layout: 'layouts/app',
      title: 'New Category',
      activePath: '/products',
      user: req.user,
      values: {},
      errors: {},
      pageScripts: [],
    });
  },

  create: asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;
    try {
      await categoryService.create({
        name,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Category created successfully.');
      return res.redirect('/categories');
    } catch (err) {
      if (err.isOperational) {
        return res.status(err.statusCode || 400).render('categories/create', {
          layout: 'layouts/app',
          title: 'New Category',
          activePath: '/products',
          user: req.user,
          values: req.body || {},
          errors: { [err.statusCode === 409 ? 'name' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  showEdit: asyncHandler(async (req, res) => {
    const category = await categoryService.getById(req.params.id);
    res.render('categories/edit', {
      layout: 'layouts/app',
      title: `Edit Category - ${category.name}`,
      activePath: '/products',
      user: req.user,
      category: category.get({ plain: true }),
      values: category.get({ plain: true }),
      errors: {},
      pageScripts: [],
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;
    try {
      await categoryService.update(req.params.id, {
        name,
        description,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Category updated successfully.');
      return res.redirect('/categories');
    } catch (err) {
      if (err.isOperational) {
        const category = await categoryService.getById(req.params.id).catch(() => ({ id: req.params.id, name: '' }));
        return res.status(err.statusCode || 400).render('categories/edit', {
          layout: 'layouts/app',
          title: `Edit Category - ${category.name || ''}`,
          activePath: '/products',
          user: req.user,
          category,
          values: { ...req.body, id: req.params.id },
          errors: { [err.statusCode === 409 ? 'name' : 'form']: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  toggleStatus: asyncHandler(async (req, res) => {
    const category = await categoryService.toggleStatus(req.params.id);
    flashSuccess(
      res,
      `Category "${category.name}" has been ${category.isActive ? 'activated' : 'deactivated'}.`,
    );
    res.redirect('/categories');
  }),

  delete: asyncHandler(async (req, res) => {
    try {
      await categoryService.delete(req.params.id);
      flashSuccess(res, 'Category deleted successfully.');
    } catch (err) {
      if (err.isOperational) {
        flashError(res, err.message);
      } else {
        throw err;
      }
    }
    res.redirect('/categories');
  }),
};

module.exports = categoryController;
