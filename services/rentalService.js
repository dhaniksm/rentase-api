const supabase = require('../config/supabase');

const RENTALS_TABLE = 'rentals';
const VEHICLES_TABLE = 'vehicles';
const RENTAL_DETAILS_VIEW = 'rental_details';

const getAllRentals = async ({ status } = {}) => {
  let query = supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('rental_status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

const getRentalDetailById = async (id) => {
  const { data, error } = await supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

const getRentalById = async (id) => {
  const { data, error } = await supabase
    .from(RENTALS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

const getActiveRentals = async () => {
  return getAllRentals({ status: 'active' });
};

const normalizeHistoryRecord = (record) => {
  const penaltyAmount = Number(record.late_fee ?? record.denda ?? record.penalty ?? record.additional_fee ?? 0);

  return {
    id: record.id,
    nama_kendaraan: record.vehicle_name || record.vehicle || null,
    plat_nomor: record.plate_number || record.license_plate || record.vehicle_plate_number || null,
    nama_penyewa: record.full_name || record.name || record.user_name || record.customer_name || record.renter_name || record.user_id || null,
    waktu_sewa: record.start_date || null,
    waktu_pickup: record.pickup_verified_at || record.start_date || null,
    waktu_pengembalian: record.actual_return_date || record.return_verified_at || null,
    total_pembayaran: Number(record.total_price || 0),
    denda: Number.isNaN(penaltyAmount) ? 0 : penaltyAmount,
    status: record.rental_status || null,
    rental_status: record.rental_status || null,
    created_at: record.created_at || null
  };
};

const getRentalHistoryByUserId = async (userId, { status, includeActive = false, limit, offset } = {}) => {
  let query = supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('rental_status', status);
  } else if (!includeActive) {
    query = query.neq('rental_status', 'active');
  }

  if (Number.isInteger(limit) && limit > 0) {
    const start = Number.isInteger(offset) && offset > 0 ? offset : 0;
    query = query.range(start, start + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(normalizeHistoryRecord);
};

const getRentalsByUserId = async (userId, options = {}) => {
  return getRentalHistoryByUserId(userId, options);
};

const getVehicleById = async (vehicleId) => {
  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .select('id, vehicle_name, price_per_day, status')
    .eq('id', vehicleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

const getVehicleForVerification = async (vehicleId) => {
  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .select('*')
    .eq('id', vehicleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

const createRental = async (rentalData) => {
  const { data, error } = await supabase
    .from(RENTALS_TABLE)
    .insert(rentalData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateRental = async (id, rentalData) => {
  const { data, error } = await supabase
    .from(RENTALS_TABLE)
    .update(rentalData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateVehicleStatus = async (vehicleId, status) => {
  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .update({ status })
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  getAllRentals,
  getRentalDetailById,
  getRentalById,
  getActiveRentals,
  getRentalHistoryByUserId,
  getRentalsByUserId,
  getVehicleById,
  getVehicleForVerification,
  createRental,
  updateRental,
  updateVehicleStatus
};
