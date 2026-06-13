const vehicleService = require('../services/vehicleService');
const rentalService = require('../services/rentalService');
const { generateVehicleQRCode } = require('../utils/qrGenerator');
const { parsePaginationParams, sendPaginatedResponse } = require('../utils/paginationUtil');

const REQUIRED_FIELDS = ['vehicle_name', 'brand', 'vehicle_type', 'plate_number', 'price_per_day'];
const ALLOWED_STATUS = ['available', 'rented', 'maintenance'];

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

const normalizeString = (value) => {
  if (typeof value !== 'string') return value;
  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

const validateRequiredFields = (body) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => !normalizeString(body[field]));

  if (missingFields.length > 0) {
    return `${missingFields.join(', ')} is required`;
  }

  return null;
};

const buildVehiclePayload = (body, { partial = false } = {}) => {
  const payload = {};

  if (!partial || body.vehicle_name !== undefined) payload.vehicle_name = normalizeString(body.vehicle_name);
  if (!partial || body.brand !== undefined) payload.brand = normalizeString(body.brand);
  if (!partial || body.vehicle_type !== undefined) payload.vehicle_type = normalizeString(body.vehicle_type);
  if (!partial || body.plate_number !== undefined) payload.plate_number = normalizeString(body.plate_number);
  if (!partial || body.price_per_day !== undefined) payload.price_per_day = Number(body.price_per_day);
  if (body.description !== undefined) payload.description = normalizeString(body.description) || null;
  if (body.status !== undefined) payload.status = normalizeString(body.status);

  return payload;
};

const validateVehiclePayload = (payload, { requireAll = true } = {}) => {
  if (requireAll) {
    const missingMessage = validateRequiredFields(payload);
    if (missingMessage) return missingMessage;
  }

  if (payload.price_per_day !== undefined) {
    const price = Number(payload.price_per_day);
    if (!Number.isInteger(price) || price <= 0) {
      return 'price_per_day must be a positive integer';
    }
  }

  if (payload.status !== undefined && !ALLOWED_STATUS.includes(payload.status)) {
    return `status must be one of: ${ALLOWED_STATUS.join(', ')}`;
  }

  return null;
};

const getAllVehicles = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    if (status && !ALLOWED_STATUS.includes(status)) {
      return sendError(res, 400, `status must be one of: ${ALLOWED_STATUS.join(', ')}`);
    }

    const { data, count } = await vehicleService.getAllVehicles({
      status, search, sortBy, sortOrder, limit, offset
    });

    return sendPaginatedResponse(res, 200, 'Vehicles retrieved successfully', data, count, page, limit);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get vehicles');
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return sendSuccess(res, 200, 'Vehicle retrieved successfully', vehicle);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get vehicle');
  }
};

const createVehicle = async (req, res) => {
  let uploadedImagePath = null;
  let uploadedQrPath = null;
  let createdVehicleId = null;

  try {
    const validationMessage = validateVehiclePayload(req.body);
    if (validationMessage) return sendError(res, 400, validationMessage);

    if (!req.file) {
      return sendError(res, 400, 'image is required');
    }

    const imageUpload = await vehicleService.uploadVehicleImage(req.file);
    uploadedImagePath = imageUpload.path;

    const vehiclePayload = {
      ...buildVehiclePayload(req.body),
      image_url: imageUpload.publicUrl
    };

    const createdVehicle = await vehicleService.createVehicle(vehiclePayload);
    createdVehicleId = createdVehicle.id;

    const qrCodeBuffer = await generateVehicleQRCode({
      vehicleId: createdVehicle.id,
      plateNumber: createdVehicle.plate_number
    });

    const qrUpload = await vehicleService.uploadVehicleQrCode(createdVehicle.id, qrCodeBuffer);
    uploadedQrPath = qrUpload.path;

    const updatedVehicle = await vehicleService.updateVehicle(createdVehicle.id, {
      qr_code_url: qrUpload.publicUrl
    });

    return sendSuccess(res, 201, 'Vehicle created successfully', updatedVehicle);
  } catch (error) {
    if (uploadedImagePath) {
      await vehicleService.deleteStorageFile(uploadedImagePath).catch(() => null);
    }

    if (uploadedQrPath) {
      await vehicleService.deleteStorageFile(uploadedQrPath).catch(() => null);
    }

    if (createdVehicleId) {
      await vehicleService.deleteVehicleRecord(createdVehicleId).catch(() => null);
    }

    return sendError(res, 500, error.message || 'Failed to create vehicle');
  }
};

const updateVehicle = async (req, res) => {
  let uploadedImagePath = null;

  try {
    const existingVehicle = await vehicleService.getVehicleById(req.params.id);

    if (!existingVehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    const validationMessage = validateVehiclePayload(req.body, { requireAll: false });
    if (validationMessage) return sendError(res, 400, validationMessage);

    const updatePayload = buildVehiclePayload(req.body, { partial: true });

    if (req.file) {
      const imageUpload = await vehicleService.uploadVehicleImage(req.file);
      uploadedImagePath = imageUpload.path;
      updatePayload.image_url = imageUpload.publicUrl;
    }

    if (updatePayload.plate_number && updatePayload.plate_number !== existingVehicle.plate_number) {
      const qrCodeBuffer = await generateVehicleQRCode({
        vehicleId: existingVehicle.id,
        plateNumber: updatePayload.plate_number
      });
      const qrUpload = await vehicleService.uploadVehicleQrCode(existingVehicle.id, qrCodeBuffer);
      updatePayload.qr_code_url = qrUpload.publicUrl;
    }

    if (Object.keys(updatePayload).length === 0) {
      return sendError(res, 400, 'At least one field or image is required');
    }

    const updatedVehicle = await vehicleService.updateVehicle(req.params.id, updatePayload);

    if (req.file && existingVehicle.image_url) {
      await vehicleService.deleteStorageFileByUrl(existingVehicle.image_url).catch(() => null);
    }

    return sendSuccess(res, 200, 'Vehicle updated successfully', updatedVehicle);
  } catch (error) {
    if (uploadedImagePath) {
      await vehicleService.deleteStorageFile(uploadedImagePath).catch(() => null);
    }

    return sendError(res, 500, error.message || 'Failed to update vehicle');
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const existingVehicle = await vehicleService.getVehicleById(req.params.id);

    if (!existingVehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    await vehicleService.deleteStorageFileByUrl(existingVehicle.image_url);
    await vehicleService.deleteStorageFileByUrl(existingVehicle.qr_code_url);
    await vehicleService.deleteVehicleRecord(req.params.id);

    return sendSuccess(res, 200, 'Vehicle deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to delete vehicle');
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return sendError(res, 400, 'status is required');
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return sendError(res, 400, `status must be one of: ${ALLOWED_STATUS.join(', ')}`);
    }

    const existingVehicle = await vehicleService.getVehicleById(req.params.id);

    if (!existingVehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    const updatedVehicle = await vehicleService.updateVehicle(req.params.id, { status });

    return sendSuccess(res, 200, 'Vehicle status updated successfully', updatedVehicle);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to update vehicle status');
  }
};

const getVehicleRentalHistory = async (req, res) => {
  try {
    const { id: vehicleId } = req.params;

    const vehicle = await vehicleService.getVehicleById(vehicleId);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    const { page, limit, search, status, sortBy, sortOrder, offset } = parsePaginationParams(req.query);

    const ALLOWED_RENTAL_STATUS = ['active', 'returned', 'late', 'cancelled'];
    if (status && !ALLOWED_RENTAL_STATUS.includes(status)) {
      return sendError(res, 400, `status must be one of: ${ALLOWED_RENTAL_STATUS.join(', ')}`);
    }

    const options = { status, search, sortBy, sortOrder, limit, offset };

    const result = await rentalService.getRentalsByVehicleId(vehicleId, options);
    
    // Result might be an array (if no limit) or an object { data, count } if limit is provided.
    // Our util handles both ways safely if limit is provided.
    if (limit && result.data !== undefined) {
       return sendPaginatedResponse(res, 200, 'Vehicle rental history retrieved successfully', result.data, result.count, page, limit);
    }

    return sendSuccess(res, 200, 'Vehicle rental history retrieved successfully', result);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to get vehicle rental history');
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleRentalHistory
};
