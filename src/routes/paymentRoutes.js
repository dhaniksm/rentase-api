const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// PATCH '/confirm/:id' -> panggil paymentController.confirmPayment
router.patch('/confirm/:id', paymentController.confirmPayment);

// PATCH '/verify/:id' -> panggil paymentController.verifyPayment
router.patch('/verify/:id', paymentController.verifyPayment);

module.exports = router;
