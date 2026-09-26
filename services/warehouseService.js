const { Op } = require('sequelize');

const { Location, Warehouse } = require('../models');
const ApiError = require('../utils/ApiError');

const warehouseService = {
  async list({ search = '', status = '', page = 1, limit = 15 } = {}) {
    const where = {};
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

    const { count, rows } = await Warehouse.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: pageLimit,
      offset,
    });

    const warehouseIds = rows.map((w) => w.id);
    let locationCounts = {};
    if (warehouseIds.length > 0) {
      const counts = await Location.findAll({
        attributes: [
          'warehouseId',
          [Location.sequelize.fn('COUNT', Location.sequelize.col('id')), 'count'],
        ],
        where: { warehouseId: { [Op.in]: warehouseIds } },
        group: ['warehouseId'],
        raw: true,
      });
      locationCounts = counts.reduce((acc, row) => {
        acc[row.warehouseId] = parseInt(row.count, 10) || 0;
        return acc;
      }, {});
    }

    const warehouses = rows.map((warehouse) => {
      const plain = warehouse.get({ plain: true });
      plain.locationCount = locationCounts[plain.id] || 0;
      return plain;
    });

    const totalPages = Math.ceil(count / pageLimit) || 1;

    return {
      warehouses,
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
    return Warehouse.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
  },

  async getById(id) {
    const warehouse = await Warehouse.findByPk(id, {
      include: [{ model: Location, as: 'locations' }],
    });
    if (!warehouse) throw ApiError.notFound('Warehouse not found.');
    return warehouse;
  },

  async create(data) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
    const address = typeof data.address === 'string' ? data.address.trim() || null : null;
    const description = typeof data.description === 'string' ? data.description.trim() || null : null;
    const isActive = data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1 || data.isActive === undefined;

    if (!name) throw ApiError.badRequest('Warehouse name is required.');
    if (!code) throw ApiError.badRequest('Warehouse code is required.');

    const existingCode = await Warehouse.findOne({ where: { code } });
    if (existingCode) throw ApiError.conflict('A warehouse with this code already exists.');

    return Warehouse.create({ name, code, address, description, isActive });
  },

  async update(id, data) {
    const warehouse = await this.getById(id);
    const name = typeof data.name === 'string' ? data.name.trim() : warehouse.name;
    const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : warehouse.code;
    const address = data.address !== undefined
      ? (typeof data.address === 'string' ? data.address.trim() || null : null)
      : warehouse.address;
    const description = data.description !== undefined
      ? (typeof data.description === 'string' ? data.description.trim() || null : null)
      : warehouse.description;
    const isActive = data.isActive !== undefined
      ? (data.isActive === true || data.isActive === 'true' || data.isActive === '1' || data.isActive === 1)
      : warehouse.isActive;

    if (!name) throw ApiError.badRequest('Warehouse name is required.');
    if (!code) throw ApiError.badRequest('Warehouse code is required.');

    const duplicateCode = await Warehouse.findOne({
      where: { code, id: { [Op.ne]: warehouse.id } },
    });
    if (duplicateCode) throw ApiError.conflict('A warehouse with this code already exists.');

    warehouse.name = name;
    warehouse.code = code;
    warehouse.address = address;
    warehouse.description = description;
    warehouse.isActive = isActive;
    await warehouse.save();
    return warehouse;
  },

  async toggleStatus(id) {
    const warehouse = await this.getById(id);
    warehouse.isActive = !warehouse.isActive;
    await warehouse.save();
    return warehouse;
  },

  async delete(id) {
    const warehouse = await this.getById(id);
    const locationCount = await Location.count({ where: { warehouseId: warehouse.id } });
    if (locationCount > 0) {
      throw ApiError.badRequest('Cannot delete warehouse because locations are assigned to it. Deactivate it instead.');
    }
    await warehouse.destroy();
    return { success: true };
  },
};

module.exports = warehouseService;
