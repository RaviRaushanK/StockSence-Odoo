const { Op } = require('sequelize');

const { Category, Product } = require('../models');
const ApiError = require('../utils/ApiError');

const categoryService = {
  async list({ search = '', status = '', page = 1, limit = 15 } = {}) {
    const where = {};

    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      where.name = { [Op.like]: `%${trimmedSearch}%` };
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: pageLimit,
      offset,
    });

    const categoryIds = rows.map((c) => c.id);
    let productCounts = {};
    if (categoryIds.length > 0) {
      const counts = await Product.findAll({
        attributes: [
          'categoryId',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count'],
        ],
        where: { categoryId: { [Op.in]: categoryIds } },
        group: ['categoryId'],
        raw: true,
      });
      productCounts = counts.reduce((acc, row) => {
        acc[row.categoryId] = parseInt(row.count, 10) || 0;
        return acc;
      }, {});
    }

    const categories = rows.map((category) => {
      const plain = category.get({ plain: true });
      plain.productCount = productCounts[plain.id] || 0;
      return plain;
    });

    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      categories,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: count,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: { search: trimmedSearch, status },
    };
  },

  async listActive() {
    return Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
  },

  async getById(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }
    return category;
  },

  async create(data) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() || null : null;
    const isActive = data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1 || data.isActive === undefined;

    if (!name) {
      throw ApiError.badRequest('Category name is required.');
    }

    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      throw ApiError.conflict('A category with this name already exists.');
    }

    return Category.create({ name, description, isActive });
  },

  async update(id, data) {
    const category = await this.getById(id);
    const name = typeof data.name === 'string' ? data.name.trim() : category.name;
    const description = data.description !== undefined
      ? (typeof data.description === 'string' ? data.description.trim() || null : null)
      : category.description;
    const isActive = data.isActive !== undefined
      ? (data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1)
      : category.isActive;

    if (!name) {
      throw ApiError.badRequest('Category name is required.');
    }

    const duplicate = await Category.findOne({
      where: {
        name,
        id: { [Op.ne]: category.id },
      },
    });
    if (duplicate) {
      throw ApiError.conflict('A category with this name already exists.');
    }

    category.name = name;
    category.description = description;
    category.isActive = isActive;
    await category.save();

    return category;
  },

  async toggleStatus(id) {
    const category = await this.getById(id);
    category.isActive = !category.isActive;
    await category.save();
    return category;
  },

  async delete(id) {
    const category = await this.getById(id);
    const productCount = await Product.count({ where: { categoryId: category.id } });
    if (productCount > 0) {
      throw ApiError.badRequest('Cannot delete category because products are assigned to it. Deactivate it instead.');
    }
    await category.destroy();
    return { success: true };
  },
};

module.exports = categoryService;
