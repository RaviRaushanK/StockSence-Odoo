const { Op } = require('sequelize');

const { Category, Product } = require('../models');
const ApiError = require('../utils/ApiError');

const productService = {
  async list({ search = '', categoryId = '', status = '', page = 1, limit = 15 } = {}) {
    const where = {};
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      where[Op.or] = [
        { name: { [Op.like]: `%${trimmedSearch}%` } },
        { sku: { [Op.like]: `%${trimmedSearch}%` } },
      ];
    }
    if (categoryId) {
      const parsedCatId = parseInt(categoryId, 10);
      if (!Number.isNaN(parsedCatId)) where.categoryId = parsedCatId;
    }
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
      limit: pageLimit,
      offset,
    });
    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      products: rows.map((p) => p.get({ plain: true })),
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: count,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: { search: trimmedSearch, categoryId: categoryId ? String(categoryId) : '', status },
    };
  },

  async getById(id) {
    const product = await Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!product) throw ApiError.notFound('Product not found.');
    return product;
  },

  async create(data) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const sku = typeof data.sku === 'string' ? data.sku.trim().toUpperCase() : '';
    const categoryId = parseInt(data.categoryId, 10);
    const unitOfMeasure = typeof data.unitOfMeasure === 'string' ? data.unitOfMeasure.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() || null : null;
    const reorderLevel = Math.max(0, parseInt(data.reorderLevel, 10) || 0);
    const reorderQuantity = Math.max(0, parseInt(data.reorderQuantity, 10) || 0);
    const isActive = data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1 || data.isActive === undefined;

    if (!name) throw ApiError.badRequest('Product name is required.');
    if (!sku) throw ApiError.badRequest('SKU is required.');
    if (Number.isNaN(categoryId)) throw ApiError.badRequest('Category is required.');
    if (!unitOfMeasure) throw ApiError.badRequest('Unit of measure is required.');

    const category = await Category.findByPk(categoryId);
    if (!category) throw ApiError.badRequest('Selected category does not exist.');

    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) throw ApiError.conflict('A product with this SKU already exists.');

    return Product.create({
      name,
      sku,
      categoryId,
      unitOfMeasure,
      description,
      reorderLevel,
      reorderQuantity,
      isActive,
    });
  },

  async update(id, data) {
    const product = await this.getById(id);
    const name = typeof data.name === 'string' ? data.name.trim() : product.name;
    const sku = typeof data.sku === 'string' ? data.sku.trim().toUpperCase() : product.sku;
    const categoryId = data.categoryId !== undefined ? parseInt(data.categoryId, 10) : product.categoryId;
    const unitOfMeasure = typeof data.unitOfMeasure === 'string' ? data.unitOfMeasure.trim() : product.unitOfMeasure;
    const description = data.description !== undefined
      ? (typeof data.description === 'string' ? data.description.trim() || null : null)
      : product.description;
    const reorderLevel = data.reorderLevel !== undefined
      ? Math.max(0, parseInt(data.reorderLevel, 10) || 0)
      : product.reorderLevel;
    const reorderQuantity = data.reorderQuantity !== undefined
      ? Math.max(0, parseInt(data.reorderQuantity, 10) || 0)
      : product.reorderQuantity;
    const isActive = data.isActive !== undefined
      ? (data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1)
      : product.isActive;

    if (!name) throw ApiError.badRequest('Product name is required.');
    if (!sku) throw ApiError.badRequest('SKU is required.');
    if (Number.isNaN(categoryId)) throw ApiError.badRequest('Category is required.');
    if (!unitOfMeasure) throw ApiError.badRequest('Unit of measure is required.');

    const category = await Category.findByPk(categoryId);
    if (!category) throw ApiError.badRequest('Selected category does not exist.');

    const duplicateSku = await Product.findOne({
      where: { sku, id: { [Op.ne]: product.id } },
    });
    if (duplicateSku) throw ApiError.conflict('A product with this SKU already exists.');

    product.name = name;
    product.sku = sku;
    product.categoryId = categoryId;
    product.unitOfMeasure = unitOfMeasure;
    product.description = description;
    product.reorderLevel = reorderLevel;
    product.reorderQuantity = reorderQuantity;
    product.isActive = isActive;
    await product.save();
    return product;
  },

  async toggleStatus(id) {
    const product = await this.getById(id);
    product.isActive = !product.isActive;
    await product.save();
    return product;
  },

  async delete(id) {
    const product = await this.getById(id);
    await product.destroy();
    return { success: true };
  },
};

module.exports = productService;
