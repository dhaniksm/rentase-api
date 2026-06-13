const locationService = require('../services/locationService');
const { parsePaginationParams, sendPaginatedResponse } = require('../utils/paginationUtil');

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

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const isValidUuid = (value) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const updateLocation = async (req, res) => {
  try {
    const { rental_id, latitude, longitude } = req.body;

    if (!rental_id || latitude === undefined || longitude === undefined) {
      return sendError(res, 400, 'rental_id, latitude, and longitude are required');
    }

    if (!isValidUuid(rental_id)) {
      return sendError(res, 400, 'rental_id must be a valid uuid');
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return sendError(res, 400, 'latitude and longitude must be numbers');
    }

    const rental = await locationService.getRentalById(rental_id);

    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    if (rental.rental_status !== 'active') {
      return sendError(res, 400, `Location update rejected. Rental status is ${rental.rental_status}`);
    }

    const newLocation = await locationService.insertLocation({
      rental_id,
      latitude,
      longitude
    });

    return sendSuccess(res, 201, 'Location updated successfully', newLocation);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to update location');
  }
};

const getAllLocations = async (req, res) => {
  try {
    const { page, limit, search, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    const { data, count } = await locationService.getAllLocations({
      search, sortBy, sortOrder, limit, offset
    });

    return sendPaginatedResponse(res, 200, 'Locations retrieved successfully', data, count, page, limit);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve locations');
  }
};

const getLocationHistory = async (req, res) => {
  try {
    const { rentalId } = req.params;

    if (!isValidUuid(rentalId)) {
      return sendError(res, 400, 'rentalId must be a valid uuid');
    }

    const rental = await locationService.getRentalById(rentalId);
    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    const { page, limit, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    const { data, count } = await locationService.getLocationHistory(rentalId, {
      sortBy, sortOrder, limit, offset
    });

    return sendPaginatedResponse(res, 200, 'Location history retrieved successfully', data, count, page, limit);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve location history');
  }
};

const getLatestLocation = async (req, res) => {
  try {
    const { rentalId } = req.params;

    if (!isValidUuid(rentalId)) {
      return sendError(res, 400, 'rentalId must be a valid uuid');
    }

    const rental = await locationService.getRentalById(rentalId);
    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    const latestLocation = await locationService.getLatestLocation(rentalId);

    if (!latestLocation) {
      return sendError(res, 404, 'No location found for this rental');
    }

    return sendSuccess(res, 200, 'Latest location retrieved successfully', latestLocation);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve latest location');
  }
};

const deleteLocationHistory = async (req, res) => {
  try {
    const { rentalId } = req.params;

    if (!isValidUuid(rentalId)) {
      return sendError(res, 400, 'rentalId must be a valid uuid');
    }

    const rental = await locationService.getRentalById(rentalId);
    if (!rental) {
      return sendError(res, 404, 'Rental not found');
    }

    await locationService.deleteLocationHistory(rentalId);

    return sendSuccess(res, 200, 'Location history deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to delete location history');
  }
};

module.exports = {
  updateLocation,
  getAllLocations,
  getLocationHistory,
  getLatestLocation,
  deleteLocationHistory
};
