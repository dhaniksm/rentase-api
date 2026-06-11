const express = require('express');
const rentalController = require('../controllers/rentalController');

const router = express.Router();

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Get all rentals
 *     tags: [Rentals]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, late, cancelled]
 *         description: Filter rentals by status
 *     responses:
 *       200:
 *         description: A list of rentals retrieved successfully
 *       400:
 *         description: Invalid status value
 *       500:
 *         description: Internal server error
 */
router.get('/', rentalController.getAllRentals);

/**
 * @swagger
 * /api/rentals/active:
 *   get:
 *     summary: Get all active rentals
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: Active rentals retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/active', rentalController.getActiveRentals);

/**
 * @swagger
 * /api/rentals/history/{userId}:
 *   get:
 *     summary: Get user rental history by User ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The User ID (UUID)
 *     responses:
 *       200:
 *         description: User rental history retrieved successfully
 *       400:
 *         description: Invalid UUID format
 *       500:
 *         description: Internal server error
 */
router.get('/history/:userId', rentalController.getUserRentalHistory);

/**
 * @swagger
 * /api/rentals/user/{userId}:
 *   get:
 *     summary: Get user rental history by User ID (alternative path)
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The User ID (UUID)
 *     responses:
 *       200:
 *         description: User rental history retrieved successfully
 *       400:
 *         description: Invalid UUID format
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', rentalController.getUserRentalHistory);

/**
 * @swagger
 * /api/rentals:
 *   post:
 *     summary: Create a new rental transaction
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - vehicle_id
 *               - start_date
 *               - expected_return_date
 *             properties:
 *               user_id:
 *                 type: string
 *               vehicle_id:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               expected_return_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Rental created successfully
 *       400:
 *         description: Missing required fields or invalid date ranges
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.post('/', rentalController.createRental);

/**
 * @swagger
 * /api/rentals/verify-vehicle:
 *   post:
 *     summary: Verify vehicle status before rental
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *             properties:
 *               vehicle_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle verified successfully
 *       400:
 *         description: Missing vehicle_id or invalid UUID
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.post('/verify-vehicle', rentalController.verifyVehicle);

/**
 * @swagger
 * /api/rentals/{id}:
 *   get:
 *     summary: Get rental detail by ID
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Rental detail retrieved successfully
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', rentalController.getRentalById);

/**
 * @swagger
 * /api/rentals/{id}/return:
 *   put:
 *     summary: Verify vehicle return and complete rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Rental returned successfully
 *       400:
 *         description: Rental not active or cannot be returned
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/return', rentalController.returnRental);

/**
 * @swagger
 * /api/rentals/{id}/cancel:
 *   put:
 *     summary: Cancel an active rental
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Rental cancelled successfully
 *       400:
 *         description: Rental not active or cannot be cancelled
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/cancel', rentalController.cancelRental);

module.exports = router;
