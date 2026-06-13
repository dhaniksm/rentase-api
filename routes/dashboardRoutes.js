const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard metrics and summary API
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary metrics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_users:
 *                       type: integer
 *                     total_vehicles:
 *                       type: integer
 *                     available_vehicles:
 *                       type: integer
 *                     rented_vehicles:
 *                       type: integer
 *                     maintenance_vehicles:
 *                       type: integer
 *                     active_rentals:
 *                       type: integer
 *                     completed_rentals:
 *                       type: integer
 *                     total_revenue:
 *                       type: number
 *                     monthly_revenue:
 *                       type: number
 *       500:
 *         description: Internal server error
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/recent-transactions:
 *   get:
 *     summary: Get 5 most recent transactions
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get('/recent-transactions', dashboardController.getRecentTransactions);

module.exports = router;
