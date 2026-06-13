const parsePaginationParams = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;

  const search = query.search && typeof query.search === 'string' ? query.search.trim() : '';
  const status = query.status && typeof query.status === 'string' ? query.status.trim() : '';
  const sortBy = query.sortBy && typeof query.sortBy === 'string' ? query.sortBy.trim() : 'created_at';
  const sortOrder = query.sortOrder && String(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const offset = (page - 1) * limit;

  return { page, limit, search, status, sortBy, sortOrder, offset };
};

const sendPaginatedResponse = (res, statusCode, message, data, totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const response = {
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      totalItems: totalItems || 0,
      totalPages
    }
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  parsePaginationParams,
  sendPaginatedResponse
};
