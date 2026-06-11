const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/rentals', vehicleController.getVehicleRentalHistory);
router.post('/', upload.single('image'), handleUploadError, vehicleController.createVehicle);
router.put('/:id', upload.single('image'), handleUploadError, vehicleController.updateVehicle);
router.patch('/:id/status', vehicleController.updateVehicleStatus);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
