const express = require('express');
const rentalController = require('../controllers/rentalController');

const router = express.Router();

router.get('/', rentalController.getAllRentals);
router.get('/history', rentalController.getAllRentals);
router.get('/active', rentalController.getActiveRentals);
router.get('/user/:userId', rentalController.getUserRentalHistory);
router.post('/', rentalController.createRental);
router.post('/verify-vehicle', rentalController.verifyVehicle);
router.get('/:id', rentalController.getRentalById);
router.put('/:id/return', rentalController.returnRental);
router.put('/:id/cancel', rentalController.cancelRental);

module.exports = router;
