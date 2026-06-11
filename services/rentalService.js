const supabase = require('../config/supabase');

const RENTALS_TABLE = 'rentals';
const VEHICLES_TABLE = 'vehicles';
const RENTAL_DETAILS_VIEW = 'rental_details';

const applyRentalFilters = (query, { status, search, sortBy, sortOrder, page, limit } = {}) => {
  if (status) {
    query = query.eq('rental_status', status);
  }

  if (search) {
    const escapedSearch = search.replace(/[(),]/g, ' ').trim();
    query = query.or(
      `vehicle_name.ilike.%${escapedSearch}%,brand.ilike.%${escapedSearch}%,plate_number.ilike.%${escapedSearch}%`
    );
  }

  const sortColumn = sortBy || 'created_at';
  const ascending = sortOrder === 'asc';
  query = query.order(sortColumn, { ascending });

  if (page && limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  return query;
};

const getAllRentals = async ({ status, search, sortBy, sortOrder, page, limit } = {}) => {
  let query = supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*', { count: page && limit ? 'exact' : 'estimated' });

  query = applyRentalFilters(query, { status, search, sortBy, sortOrder, page, limit });

  const { data, error, count } = await query;

  if (error) throw error;
  return page && limit ? { data, count } : data;
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

const getRentalsByUserId = async (userId, { status, search, sortBy, sortOrder, page, limit } = {}) => {
  let query = supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*', { count: page && limit ? 'exact' : 'estimated' })
    .eq('user_id', userId);

  query = applyRentalFilters(query, { status, search, sortBy, sortOrder, page, limit });

  const { data, error, count } = await query;

  if (error) throw error;
  return page && limit ? { data, count } : data;
};

const getRentalsByVehicleId = async (vehicleId, { status, search, sortBy, sortOrder, page, limit } = {}) => {
  let query = supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*', { count: page && limit ? 'exact' : 'estimated' })
    .eq('vehicle_id', vehicleId);

  query = applyRentalFilters(query, { status, search, sortBy, sortOrder, page, limit });

  const { data, error, count } = await query;

  if (error) throw error;
  return page && limit ? { data, count } : data;
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
  getRentalsByUserId,
  getRentalsByVehicleId,
  getVehicleById,
  getVehicleForVerification,
  createRental,
  updateRental,
  updateVehicleStatus
};
