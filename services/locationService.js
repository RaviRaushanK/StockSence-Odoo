const { Op } = require('sequelize');

const { Location, Warehouse } = require('../models');
const ApiError = require('../utils/ApiError');

const locationService = {
  async listByWarehouse(warehouseId, { search = '', status = '', page = 1, limit = 15 } = {}) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw ApiError.notFound('Warehouse not found.');

    const where = { warehouseId: warehouse.id };
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    if (trimmedSearch) {
      where[Op.or] = [
        { name: { [Op.like]: `%${trimmedSearch}%` } },
        { code: { [Op.like]: `%${trimmedSearch}%` } },
      ];
    }
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (currentPage - 1) * pageLimit;

    const { count, rows } = await Location.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: pageLimit,
      offset,
    });
    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      warehouse: warehouse.get({ plain: true }),
      locations: rows.map((l) => l.get({ plain: true })),
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

  async getById(id, warehouseId = null) {
    const where = { id };
    if (warehouseId) where.warehouseId = warehouseId;

    const location = await Location.findOne({
      where,
      include: [{ model: Warehouse, as: 'warehouse' }],
    });
    if (!location) throw ApiError.notFound('Location not found.');
    return location;
  },

  async create(data) {
    const warehouseId = parseInt(data.warehouseId, 10);
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
    const description = typeof data.description === 'string' ? data.description.trim() || null : null;
    const isActive = data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1 || data.isActive === undefined;

    if (Number.isNaN(warehouseId)) throw ApiError.badRequest('Warehouse is required.');
    if (!name) throw ApiError.badRequest('Location name is required.');
    if (!code) throw ApiError.badRequest('Location code is required.');

    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw ApiError.badRequest('Selected warehouse does not exist.');

    const existing = await Location.findOne({
      where: { warehouseId, code },
    });
    if (existing) {
      throw ApiError.conflict('A location with this code already exists in this warehouse.');
    }

    return Location.create({ warehouseId, name, code, description, isActive });
  },

  async update(id, data, warehouseId = null) {
    const location = await this.getById(id, warehouseId);
    const name = typeof data.name === 'string' ? data.name.trim() : location.name;
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : location.code;
    const description = data.description !== undefined
      ? (typeof data.description === 'string' ? data.description.trim() || null : null)
      : location.description;
    const isActive = data.isActive !== undefined
      ? (data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1)
      : location.isActive;

    if (!name) throw ApiError.badRequest('Location name is required.');
    if (!code) throw ApiError.badRequest('Location code is required.');

    const duplicate = await Location.findOne({
      where: {
        warehouseId: location.warehouseId,
        code,
        id: { [Op.ne]: location.id },
      },
    });
    if (duplicate) {
      throw ApiError.conflict('A location with this code already exists in this warehouse.');
    }

    location.name = name;
    location.code = code;
    location.description = description;
    location.isActive = isActive;
    await location.save();
    return location;
  },

  async toggleStatus(id, warehouseId = null) {
    const location = await this.getById(id, warehouseId);
    location.isActive = !location.isActive;
    await location.save();
    return location;
  },

  async delete(id, warehouseId = null) {
    const location = await this.getById(id, warehouseId);
    await location.destroy();
    return { success: true };
  },
};

module.exports = locationService;
