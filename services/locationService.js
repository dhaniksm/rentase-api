const supabase = require('../config/supabase');

const LOCATIONS_TABLE = 'vehicle_locations';
const RENTALS_TABLE = 'rentals';

const getRentalById = async (rentalId) => {
  const { data, error } = await supabase
    .from(RENTALS_TABLE)
    .select('id, rental_status')
    .eq('id', rentalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

const insertLocation = async ({ rental_id, latitude, longitude }) => {
  const { data, error } = await supabase
    .from(LOCATIONS_TABLE)
    .insert({
      rental_id,
      latitude,
      longitude,
      recorded_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getAllLocations = async ({ search, sortBy = 'recorded_at', sortOrder = 'desc', limit = 10, offset = 0 } = {}) => {
  let query = supabase
    .from(LOCATIONS_TABLE)
    .select('*', { count: 'exact' });

  // Search by rental_id since there's not much else to search on
  if (search) {
    query = query.eq('rental_id', search);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const getLocationHistory = async (rentalId, { sortBy = 'recorded_at', sortOrder = 'desc', limit = 10, offset = 0 } = {}) => {
  let query = supabase
    .from(LOCATIONS_TABLE)
    .select('*', { count: 'exact' })
    .eq('rental_id', rentalId);

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
};

const getLatestLocation = async (rentalId) => {
  const { data, error } = await supabase
    .from(LOCATIONS_TABLE)
    .select('*')
    .eq('rental_id', rentalId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

const deleteLocationHistory = async (rentalId) => {
  const { data, error } = await supabase
    .from(LOCATIONS_TABLE)
    .delete()
    .eq('rental_id', rentalId)
    .select();

  if (error) throw error;
  return data;
};

module.exports = {
  getRentalById,
  insertLocation,
  getAllLocations,
  getLocationHistory,
  getLatestLocation,
  deleteLocationHistory
};
