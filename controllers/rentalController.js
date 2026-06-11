const rentalService = require('../services/rentalService');

const ALLOWED_RENTAL_STATUS = ['active', 'returned', 'late', 'cancelled'];
const REQUIRED_RENTAL_FIELDS = ['user_id', 'vehicle_id', 'start_date', 'expected_return_date'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const sendSuccess = (res, statusCode, message, data = null, extra = {}) => {
  const response = {
    success: true,
    message,
    ...extra
  };

  if (data !== null) response.data = data;

  return res.status(statusCode).json(response);
};

const isValidUuid = (value) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const normalizeString = (value) => {
  if (typeof value !== 'string') return value;
  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

const validateRequiredFields = (body, fields) => {
  const missingFields = fields.filter((field) => !normalizeString(body[field]));
  return missingFields.length > 0 ? `${missingFields.join(', ')} is required` : null;
};

const parseRentalDate = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
};

const calculateTotalDays = (startDate, expectedReturnDate) => {
  const diffInMs = expectedReturnDate.getTime() - startDate.getTime();
  return Math.ceil(diffInMs / DAY_IN_MS);
};

const parsePaginationAndFilterParams = (query) => {
  const status = normalizeString(query.status);
  const search = normalizeString(query.search);
  const sortBy = normalizeString(query.sortBy) || 'created_at';
  const sortOrder = normalizeString(query.sortOrder) || 'desc';

  let page = query.page ? parseInt(query.page, 10) : undefined;
  let limit = query.limit ? parseInt(query.limit, 10) : undefined;

  // Validate status if present
  if (status && !ALLOWED_RENTAL_STATUS.includes(status)) {
    throw new Error(`status must be one of: ${ALLOWED_RENTAL_STATUS.join(', ')}`);
  }

  // Validate sortOrder
  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    throw new Error('sortOrder must be either asc or desc');
  }

  // Validate pagination numbers if present
  if (page !== undefined && (Number.isNaN(page) || page <= 0)) {
    throw new Error('page must be a positive integer');
  }
  if (limit !== undefined && (Number.isNaN(limit) || limit <= 0)) {
    throw new Error('limit must be a positive integer');
  }

  return {
    status,
    search,
    sortBy,
    sortOrder: sortOrder.toLowerCase(),
    page,
    limit
  };
};

const getAllRentals = async (req, res) => {
  try {
    let options;
    try {
      options = parsePaginationAndFilterParams(req.query);
    } catch (validationErr) {
      return sendError(res, 400, validationErr.message);
    }

    if (options.page && options.limit) {
      const { data, count } = await rentalService.getAllRentals(options);
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / options.limit);

      return sendSuccess(res, 200, 'Rentals retrieved successfully', data, {
        pagination: {
          totalItems,
          totalPages,
          currentPage: options.page,
          limit: options.limit
        }
      });
    }

    const rentals = await rentalService.getAllRentals(options);

    return sendSuccess(res, 200, 'Rentals retrieved successfully', rentals);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get rentals');
  }
};

const getRentalById = async (req, res) => {
  try {
    const rental = await rentalService.getRentalDetailById(req.params.id);

    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    return sendSuccess(res, 200, 'Rental retrieved successfully', rental);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get rental');
  }
};

const getActiveRentals = async (req, res) => {
  try {
    const rentals = await rentalService.getActiveRentals();

    return sendSuccess(res, 200, 'Active rentals retrieved successfully', rentals);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get active rentals');
  }
};

const getUserRentalHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidUuid(userId)) {
      return sendError(res, 400, 'userId must be a valid uuid');
    }

    let options;
    try {
      options = parsePaginationAndFilterParams(req.query);
    } catch (validationErr) {
      return sendError(res, 400, validationErr.message);
    }

    if (options.page && options.limit) {
      const { data, count } = await rentalService.getRentalsByUserId(userId, options);
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / options.limit);

      return sendSuccess(res, 200, 'User rental history retrieved successfully', data, {
        pagination: {
          totalItems,
          totalPages,
          currentPage: options.page,
          limit: options.limit
        }
      });
    }

    const rentals = await rentalService.getRentalsByUserId(userId, options);

    return sendSuccess(res, 200, 'User rental history retrieved successfully', rentals);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get user rental history');
  }
};

const createRental = async (req, res) => {
  let createdRentalId = null;

  try {
    const missingMessage = validateRequiredFields(req.body, REQUIRED_RENTAL_FIELDS);
    if (missingMessage) return sendError(res, 400, missingMessage);

    const userId = normalizeString(req.body.user_id);
    const vehicleId = normalizeString(req.body.vehicle_id);

    if (!isValidUuid(userId)) {
      return sendError(res, 400, 'user_id must be a valid uuid');
    }

    if (!isValidUuid(vehicleId)) {
      return sendError(res, 400, 'vehicle_id must be a valid uuid');
    }

    const startDate = parseRentalDate(req.body.start_date, 'start_date');
    const expectedReturnDate = parseRentalDate(req.body.expected_return_date, 'expected_return_date');
    const totalDays = calculateTotalDays(startDate, expectedReturnDate);

    if (totalDays <= 0) {
      return sendError(res, 400, 'expected_return_date must be after start_date');
    }

    const vehicle = await rentalService.getVehicleById(vehicleId);

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    if (vehicle.status !== 'available') {
      return sendError(res, 400, `Vehicle is not available. Current status: ${vehicle.status}`);
    }

    const now = new Date().toISOString();
    const totalPrice = totalDays * Number(vehicle.price_per_day);

    const createdRental = await rentalService.createRental({
      user_id: userId,
      vehicle_id: vehicleId,
      start_date: startDate.toISOString(),
      expected_return_date: expectedReturnDate.toISOString(),
      total_days: totalDays,
      total_price: totalPrice,
      rental_status: 'active',
      pickup_verified_at: now
    });

    createdRentalId = createdRental.id;

    // Keep vehicle availability accurate even when no database trigger handles rental creation.
    await rentalService.updateVehicleStatus(vehicleId, 'rented');

    const rentalDetail = await rentalService.getRentalDetailById(createdRental.id).catch(() => null);

    return sendSuccess(res, 201, 'Rental created successfully', rentalDetail || createdRental);
  } catch (error) {
    if (createdRentalId) {
      await rentalService.updateRental(createdRentalId, { rental_status: 'cancelled' }).catch(() => null);
    }

    return sendError(res, 500, error.message || 'Failed to create rental');
  }
};

const returnRental = async (req, res) => {
  try {
    const rental = await rentalService.getRentalById(req.params.id);

    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    if (rental.rental_status !== 'active') {
      return sendError(res, 400, 'Only active rentals can be returned');
    }

    const now = new Date().toISOString();

    const updatedRental = await rentalService.updateRental(req.params.id, {
      actual_return_date: now,
      return_verified_at: now,
      rental_status: 'returned'
    });

    const rentalDetail = await rentalService.getRentalDetailById(req.params.id);

    return sendSuccess(res, 200, 'Rental returned successfully', rentalDetail || updatedRental);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to return rental');
  }
};

const cancelRental = async (req, res) => {
  try {
    const rental = await rentalService.getRentalById(req.params.id);

    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    if (rental.rental_status !== 'active') {
      return sendError(res, 400, 'Only active rentals can be cancelled');
    }

    const updatedRental = await rentalService.updateRental(req.params.id, {
      rental_status: 'cancelled'
    });

    await rentalService.updateVehicleStatus(rental.vehicle_id, 'available').catch(() => null);

    const rentalDetail = await rentalService.getRentalDetailById(req.params.id);

    return sendSuccess(res, 200, 'Rental cancelled successfully', rentalDetail || updatedRental);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to cancel rental');
  }
};

const verifyVehicle = async (req, res) => {
  try {
    const vehicleId = normalizeString(req.body.vehicle_id || req.body.vehicleId);

    if (!vehicleId) {
      return sendError(res, 400, 'vehicle_id is required');
    }

    if (!isValidUuid(vehicleId)) {
      return sendError(res, 400, 'vehicle_id must be a valid uuid');
    }

    const vehicle = await rentalService.getVehicleForVerification(vehicleId);

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return sendSuccess(res, 200, 'Vehicle verified successfully', vehicle, { vehicle });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to verify vehicle');
  }
};

module.exports = {
  getAllRentals,
  getRentalById,
  getActiveRentals,
  getUserRentalHistory,
  createRental,
  returnRental,
  cancelRental,
  verifyVehicle
};
