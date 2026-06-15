const favoriteService = require('../services/favoriteService');

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleIds = await favoriteService.getFavorites(userId);

    return res.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: vehicleIds
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required'
      });
    }

    await favoriteService.addFavorite(userId, vehicleId);

    return res.status(201).json({
      success: true,
      message: 'Vehicle added to favorites successfully',
      data: null
    });
  } catch (error) {
    // Jika duplicate (sudah difavoritkan), abaikan error atau kirim 400
    if (error.message.includes('duplicate key value')) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already in favorites'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleId } = req.params;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required'
      });
    }

    await favoriteService.removeFavorite(userId, vehicleId);

    return res.status(200).json({
      success: true,
      message: 'Vehicle removed from favorites successfully',
      data: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
