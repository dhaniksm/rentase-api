const rentalService = require('../services/rentalService');
const { parsePaginationParams, sendPaginatedResponse } = require('../utils/paginationUtil');

const ALLOWED_RENTAL_STATUS = ['unpaid', 'pending_verification', 'paid', 'active', 'returned', 'late', 'cancelled'];
const REQUIRED_RENTAL_FIELDS = ['user_id', 'vehicle_id', 'start_date', 'expected_return_date'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message
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
  return parsePaginationParams(query);
};

const getAllRentals = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    const ALLOWED_STATUS = ['unpaid', 'pending_verification', 'paid', 'active', 'returned', 'late', 'cancelled'];
    if (status && !ALLOWED_STATUS.includes(status)) {
      return sendError(res, 400, `status must be one of: ${ALLOWED_STATUS.join(', ')}`);
    }

    const options = { status, search, sortBy, sortOrder, limit, offset };
    const result = await rentalService.getAllRentals(options);

    if (limit && result.data !== undefined) {
      return sendPaginatedResponse(res, 200, 'Rentals retrieved successfully', result.data, result.count, page, limit);
    }

    return sendSuccess(res, 200, 'Rentals retrieved successfully', result);
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
      return sendError(res, 400, 'Invalid user ID format');
    }

    const { page, limit, search, status, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    const ALLOWED_STATUS = ['unpaid', 'pending_verification', 'active', 'returned', 'late', 'cancelled'];
    if (status && !ALLOWED_STATUS.includes(status)) {
      return sendError(res, 400, `status must be one of: ${ALLOWED_STATUS.join(', ')}`);
    }

    const options = { status, search, sortBy, sortOrder, limit, offset };

    const result = await rentalService.getRentalsByUserId(userId, options);

    if (limit && result.data !== undefined) {
      return sendPaginatedResponse(res, 200, 'User rental history retrieved successfully', result.data, result.count, page, limit);
    }

    return sendSuccess(res, 200, 'User rental history retrieved successfully', result);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get user rental history');
  }
};

const createRental = async (req, res) => {
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
      rental_status: 'unpaid'
    });

    const rentalDetail = await rentalService.getRentalDetailById(createdRental.id);

    return sendSuccess(res, 201, 'Rental created successfully', rentalDetail);
  } catch (error) {
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

    const now = new Date();
    const expectedReturnDate = new Date(rental.expected_return_date);
    let lateFee = 0;
    let finalStatus = 'returned';

    // Calculate penalty if returned late
    const diffMs = now.getTime() - expectedReturnDate.getTime();
    if (diffMs > 0) {
      const daysLate = Math.ceil(diffMs / DAY_IN_MS);
      const vehicle = await rentalService.getVehicleById(rental.vehicle_id);
      lateFee = daysLate * Number(vehicle.price_per_day);
      finalStatus = 'late';
    }

    const nowIso = now.toISOString();

    await rentalService.updateRental(req.params.id, {
      actual_return_date: nowIso,
      return_verified_at: nowIso,
      rental_status: finalStatus,
      late_fee: lateFee
    });

    const rentalDetail = await rentalService.getRentalDetailById(req.params.id);

    return sendSuccess(res, 200, 'Rental returned successfully', rentalDetail);
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

    if (!['active', 'unpaid', 'pending_verification'].includes(rental.rental_status)) {
      return sendError(res, 400, 'Only active, unpaid, or pending rentals can be cancelled');
    }

    await rentalService.updateRental(req.params.id, {
      rental_status: 'cancelled'
    });

    const rentalDetail = await rentalService.getRentalDetailById(req.params.id);

    return sendSuccess(res, 200, 'Rental cancelled successfully', rentalDetail);
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

    return sendSuccess(res, 200, 'Vehicle verified successfully', vehicle);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to verify vehicle');
  }
};

const pickupRental = async (req, res) => {
  try {
    const rental = await rentalService.getRentalById(req.params.id);

    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    if (rental.rental_status !== 'paid') {
      return sendError(res, 400, 'Only paid rentals can be picked up');
    }

    await rentalService.updateRental(req.params.id, {
      rental_status: 'active',
      pickup_verified_at: new Date().toISOString()
    });

    const rentalDetail = await rentalService.getRentalDetailById(req.params.id);

    return sendSuccess(res, 200, 'Rental picked up successfully. Status is now active.', rentalDetail);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to pickup rental');
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
  verifyVehicle,
  pickupRental
};
