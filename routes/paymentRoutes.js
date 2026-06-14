const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/payments/confirm/{id}:
 *   patch:
 *     summary: Confirm rental payment (User)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     responses:
 *       200:
 *         description: Payment confirmation submitted successfully
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
 *                   example: "Payment confirmed"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid status or missing ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/confirm/:id', authenticateUser, paymentController.confirmPayment);

/**
 * @swagger
 * /api/payments/verify/{id}:
 *   patch:
 *     summary: Verify rental payment (Admin)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rental ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer]
 *                 description: The payment method used
 *     responses:
 *       200:
 *         description: Payment verified and vehicle status updated to rented successfully
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
 *                   example: "Payment verified successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid payment method or missing parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Rental not found
 *       500:
 *         description: Internal server error
 */
router.patch('/verify/:id', authenticateUser, authorizeAdmin, paymentController.verifyPayment);

module.exports = router;
