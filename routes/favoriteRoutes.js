const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: User favorite vehicles API
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorited vehicle IDs for the logged-in user
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: A list of favorited vehicle IDs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Favorites retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: Vehicle ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateUser, favoriteController.getFavorites);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Add a vehicle to favorites
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 description: The ID of the vehicle to favorite
 *     responses:
 *       201:
 *         description: Vehicle added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vehicle added to favorites successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Missing vehicleId or vehicle already in favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateUser, favoriteController.addFavorite);

/**
 * @swagger
 * /api/favorites/{vehicleId}:
 *   delete:
 *     summary: Remove a vehicle from favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID to remove from favorites
 *     responses:
 *       200:
 *         description: Vehicle removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vehicle removed from favorites successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Missing vehicleId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:vehicleId', authenticateUser, favoriteController.removeFavorite);

module.exports = router;
