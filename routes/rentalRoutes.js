const express = require('express');
const rentalController = require('../controllers/rentalController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rentals
 *   description: Rental management API
 */

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Get all rentals
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: List of rentals
 */
router.get('/', rentalController.getAllRentals);

/**
 * @swagger
 * /api/rentals/active:
 *   get:
 *     summary: Get active rentals
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: List of active rentals
 */
router.get('/active', rentalController.getActiveRentals);

/**
 * @swagger
 * /api/rentals/user/{userId}:
 *   get:
 *     summary: Get rental history for a user
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's rental history
 */
router.get('/user/:userId', rentalController.getUserRentalHistory);

/**
 * @swagger
 * /api/rentals:
 *   post:
 *     summary: Create a new rental
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Rental created successfully
 */
router.post('/', rentalController.createRental);

/**
 * @swagger
 * /api/rentals/verify-vehicle:
 *   post:
 *     summary: Verify vehicle availability
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Vehicle availability verified
 */
router.post('/verify-vehicle', rentalController.verifyVehicle);

/**
 * @swagger
 * /api/rentals/{id}:
 *   get:
 *     summary: Get rental by ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental details
 */
router.get('/:id', rentalController.getRentalById);

/**
 * @swagger
 * /api/rentals/{id}/return:
 *   put:
 *     summary: Return a rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental returned successfully
 */
router.put('/:id/return', rentalController.returnRental);

/**
 * @swagger
 * /api/rentals/{id}/cancel:
 *   put:
 *     summary: Cancel a rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental cancelled successfully
 */
router.put('/:id/cancel', rentalController.cancelRental);

module.exports = router;
