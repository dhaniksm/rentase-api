const supabase = require('../config/supabase');

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message
  };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, 'Rental ID is required');
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ rental_status: 'pending_verification' })
      .eq('id', id)
      .eq('rental_status', 'unpaid')
      .select();

    if (error) {
      return sendError(res, 500, error.message);
    }

    if (!data || data.length === 0) {
      return sendError(res, 400, 'Rental not found or status is not unpaid (already confirmed/paid/cancelled)');
    }

    return sendSuccess(res, 200, 'Payment confirmation submitted successfully. Waiting for admin verification.', data[0]);
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    if (!id) {
      return sendError(res, 400, 'Rental ID is required');
    }

    if (!payment_method || !['cash', 'transfer'].includes(payment_method)) {
      return sendError(res, 400, "Invalid or missing payment method. Must be either 'cash' or 'transfer'");
    }

    // Ambil data rental terlebih dahulu untuk mendapatkan vehicle_id
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('vehicle_id, rental_status')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return sendError(res, 404, 'Rental not found');
    }

    // Update rental status dan payment method
    const { error: updateRentalError } = await supabase
      .from('rentals')
      .update({
        payment_method,
        rental_status: 'active',
        pickup_verified_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateRentalError) {
      return sendError(res, 500, updateRentalError.message);
    }

    return sendSuccess(res, 200, 'Payment verified and vehicle status updated to rented successfully');
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
};

module.exports = {
  confirmPayment,
  verifyPayment
};
