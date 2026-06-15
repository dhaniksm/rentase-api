const supabase = require('../config/supabase');

const getFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('vehicle_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  // Mengembalikan array yang hanya berisi ID kendaraan
  return data.map(fav => fav.vehicle_id);
};

const addFavorite = async (userId, vehicleId) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      vehicle_id: vehicleId
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const removeFavorite = async (userId, vehicleId) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .match({
      user_id: userId,
      vehicle_id: vehicleId
    });

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
