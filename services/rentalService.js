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

const getRentalsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from(RENTAL_DETAILS_VIEW)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
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
  getVehicleById,
  getVehicleForVerification,
  createRental,
  updateRental,
  updateVehicleStatus
};
