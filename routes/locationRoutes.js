const express = require('express');
const locationController = require('../controllers/locationController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Vehicle location tracking API
 */

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Update vehicle location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rental_id
 *               - latitude
 *               - longitude
 *             properties:
 *               rental_id:
 *                 type: string
 *                 description: The rental ID
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude coordinate
 *     responses:
 *       201:
 *         description: Location updated successfully
 *       400:
 *         description: Missing required fields or rental is not active
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

router.post('/', authenticateUser, locationController.updateLocation);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all vehicle locations
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by rental_id
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of locations retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateUser, authorizeAdmin, locationController.getAllLocations);

/**
 * @swagger
 * /api/locations/{rentalId}:
 *   get:
 *     summary: Get vehicle location history for a rental
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rentalId', authenticateUser, locationController.getLocationHistory);

/**
 * @swagger
 * /api/locations/{rentalId}/latest:
 *   get:
 *     summary: Get the latest vehicle location for a rental
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Latest location retrieved successfully
 *       404:
 *         description: Rental or location not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rentalId/latest', authenticateUser, locationController.getLatestLocation);

/**
 * @swagger
 * /api/locations/{rentalId}:
 *   delete:
 *     summary: Delete all location history for a rental
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Location history deleted successfully
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:rentalId', authenticateUser, authorizeAdmin, locationController.deleteLocationHistory);

module.exports = router;
