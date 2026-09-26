const productService = require('../services/productService');
const categoryService = require('../services/categoryService');
const { flashError, flashSuccess } = require('../middleware/flash');
const asyncHandler = require('../utils/asyncHandler');

const productController = {
  list: asyncHandler(async (req, res) => {
    const { search, categoryId, status, page } = req.query;
    const [result, categories] = await Promise.all([
      productService.list({ search, categoryId, status, page }),
      categoryService.listActive(),
    ]);

    res.render('products/index', {
      layout: 'layouts/app',
      title: 'Products',
      activePath: '/products',
      user: req.user,
      products: result.products,
      categories: categories.map((c) => c.get({ plain: true })),
      pagination: result.pagination,
      filters: result.filters,
      pageScripts: ['/js/master-data.js'],
    });
  }),

  showCreate: asyncHandler(async (req, res) => {
    const categories = await categoryService.listActive();
    res.render('products/create', {
      layout: 'layouts/app',
      title: 'New Product',
      activePath: '/products',
      user: req.user,
      categories: categories.map((c) => c.get({ plain: true })),
      values: {},
      errors: {},
      pageScripts: [],
    });
  }),

  create: asyncHandler(async (req, res) => {
    const {
      name,
      sku,
      categoryId,
      unitOfMeasure,
      description,
      reorderLevel,
      reorderQuantity,
      isActive,
    } = req.body;

    try {
      await productService.create({
        name,
        sku,
        categoryId,
        unitOfMeasure,
        description,
        reorderLevel,
        reorderQuantity,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Product created successfully.');
      return res.redirect('/products');
    } catch (err) {
      if (err.isOperational) {
        const categories = await categoryService.listActive();
        const fieldKey = err.statusCode === 409 ? 'sku' : 'form';
        return res.status(err.statusCode || 400).render('products/create', {
          layout: 'layouts/app',
          title: 'New Product',
          activePath: '/products',
          user: req.user,
          categories: categories.map((c) => c.get({ plain: true })),
          values: req.body || {},
          errors: { [fieldKey]: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  showEdit: asyncHandler(async (req, res) => {
    const [product, categories] = await Promise.all([
      productService.getById(req.params.id),
      categoryService.listActive(),
    ]);

    res.render('products/edit', {
      layout: 'layouts/app',
      title: `Edit Product - ${product.name}`,
      activePath: '/products',
      user: req.user,
      product: product.get({ plain: true }),
      categories: categories.map((c) => c.get({ plain: true })),
      values: product.get({ plain: true }),
      errors: {},
      pageScripts: [],
    });
  }),

  update: asyncHandler(async (req, res) => {
    const {
      name,
      sku,
      categoryId,
      unitOfMeasure,
      description,
      reorderLevel,
      reorderQuantity,
      isActive,
    } = req.body;

    try {
      await productService.update(req.params.id, {
        name,
        sku,
        categoryId,
        unitOfMeasure,
        description,
        reorderLevel,
        reorderQuantity,
        isActive: isActive === '1' || isActive === 'on' || isActive === true,
      });
      flashSuccess(res, 'Product updated successfully.');
      return res.redirect('/products');
    } catch (err) {
      if (err.isOperational) {
        const [product, categories] = await Promise.all([
          productService.getById(req.params.id).catch(() => ({ id: req.params.id, name: '' })),
          categoryService.listActive(),
        ]);
        const fieldKey = err.statusCode === 409 ? 'sku' : 'form';
        return res.status(err.statusCode || 400).render('products/edit', {
          layout: 'layouts/app',
          title: `Edit Product - ${product.name || ''}`,
          activePath: '/products',
          user: req.user,
          product,
          categories: categories.map((c) => c.get({ plain: true })),
          values: { ...req.body, id: req.params.id },
          errors: { [fieldKey]: err.message },
          pageScripts: [],
        });
      }
      throw err;
    }
  }),

  toggleStatus: asyncHandler(async (req, res) => {
    const product = await productService.toggleStatus(req.params.id);
    flashSuccess(
      res,
      `Product "${product.name}" has been ${product.isActive ? 'activated' : 'deactivated'}.`,
    );
    res.redirect('/products');
  }),

  delete: asyncHandler(async (req, res) => {
    try {
      await productService.delete(req.params.id);
      flashSuccess(res, 'Product deleted successfully.');
    } catch (err) {
      if (err.isOperational) {
        flashError(res, err.message);
      } else {
        throw err;
      }
    }
    res.redirect('/products');
  }),
};

module.exports = productController;
