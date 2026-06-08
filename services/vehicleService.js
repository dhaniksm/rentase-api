const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const TABLE_NAME = 'vehicles';
const BUCKET_NAME = 'vehicles';
const IMAGE_FOLDER = 'vehicles/images';
const QR_FOLDER = 'vehicles/qr';

const getPublicUrl = (filePath) => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};

const sanitizeFileName = (originalName) => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${baseName || 'vehicle'}${extension}`;
};

const getStoragePathFromUrl = (publicUrl) => {
  if (!publicUrl) return null;

  const marker = `/object/public/${BUCKET_NAME}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length).split('?')[0]);
};

const sanitizeSearchTerm = (search) => {
  if (!search) return null;
  return search.replace(/[(),]/g, ' ').trim();
};

const getAllVehicles = async ({ status, search } = {}) => {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const escapedSearch = sanitizeSearchTerm(search);
    query = query.or(
      `vehicle_name.ilike.%${escapedSearch}%,brand.ilike.%${escapedSearch}%,plate_number.ilike.%${escapedSearch}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

const getVehicleById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

const createVehicle = async (vehicleData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(vehicleData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateVehicle = async (id, vehicleData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(vehicleData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteVehicleRecord = async (id) => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) throw error;
};

const uploadVehicleImage = async (file) => {
  const fileName = `${Date.now()}-${uuidv4()}-${sanitizeFileName(file.originalname)}`;
  const filePath = `${IMAGE_FOLDER}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (error) throw error;

  return {
    path: filePath,
    publicUrl: getPublicUrl(filePath)
  };
};

const uploadVehicleQrCode = async (vehicleId, qrCodeBuffer) => {
  const filePath = `${QR_FOLDER}/${vehicleId}.png`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, qrCodeBuffer, {
    contentType: 'image/png',
    upsert: true
  });

  if (error) throw error;

  return {
    path: filePath,
    publicUrl: getPublicUrl(filePath)
  };
};

const deleteStorageFile = async (filePath) => {
  if (!filePath) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) throw error;
};

const deleteStorageFileByUrl = async (publicUrl) => {
  const filePath = getStoragePathFromUrl(publicUrl);
  await deleteStorageFile(filePath);
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicleRecord,
  uploadVehicleImage,
  uploadVehicleQrCode,
  deleteStorageFile,
  deleteStorageFileByUrl
};
