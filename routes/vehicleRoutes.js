const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management API
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Retrieve a list of all vehicles
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: A list of vehicles retrieved successfully
 *       500:
 *         description: Internal server error
 */

router.get('/', vehicleController.getAllVehicles);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle detail retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', vehicleController.getVehicleById);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_name:
 *                 type: string
 *               brand:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *               plate_number:
 *                 type: string
 *               price_per_day:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Vehicle rating (default 5)
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Otomatis]
 *                 description: Transmission type (default Otomatis)
 *               capacity:
 *                 type: integer
 *                 description: Passenger capacity (default 2)
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateUser, authorizeAdmin, upload.single('image'), handleUploadError, vehicleController.createVehicle);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update an existing vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_name:
 *                 type: string
 *               brand:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *               plate_number:
 *                 type: string
 *               price_per_day:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Vehicle rating (default 5)
 *               transmission:
 *                 type: string
 *                 enum: [Manual, Otomatis]
 *                 description: Transmission type (default Otomatis)
 *               capacity:
 *                 type: integer
 *                 description: Passenger capacity (default 2)
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateUser, authorizeAdmin, upload.single('image'), handleUploadError, vehicleController.updateVehicle);

/**
 * @swagger
 * /api/vehicles/{id}/status:
 *   patch:
 *     summary: Update vehicle status
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, rented, maintenance]
 *     responses:
 *       200:
 *         description: Vehicle status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/status', authenticateUser, authorizeAdmin, vehicleController.updateVehicleStatus);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateUser, authorizeAdmin, vehicleController.deleteVehicle);

/**
 * @swagger
 * /api/vehicles/{id}/history:
 *   get:
 *     summary: Get rental history for a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle rental history retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/history', authenticateUser, authorizeAdmin, vehicleController.getVehicleRentalHistory);

module.exports = router;
