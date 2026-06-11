const supabase = require('../../config/supabase');

/**
 * Controller untuk menangani alur pembayaran rental.
 */

// A. confirmPayment (User)
// - Ambil 'id' dari req.params.
// - Update tabel 'public.rentals' di Supabase: set rental_status = 'pending_verification' (kondisi: jika status saat ini 'unpaid').
// - Return JSON sukses (200) + data update, atau error.
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID is required'
      });
    }

    // Update rental status ke 'pending_verification' jika status saat ini adalah 'unpaid'
    const { data, error } = await supabase
      .from('rentals')
      .update({ rental_status: 'pending_verification' })
      .eq('id', id)
      .eq('rental_status', 'unpaid')
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rental not found or status is not unpaid (already confirmed/paid/cancelled)'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmation submitted successfully. Waiting for admin verification.',
      data: data[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// B. verifyPayment (Admin)
// - Ambil 'id' dari req.params dan 'payment_method' ('cash'/'transfer') dari req.body.
// - Update tabel 'public.rentals': set payment_method sesuai input & rental_status = 'paid'.
// - Ambil 'vehicle_id' dari rental terkait, lalu update tabel 'public.vehicles': set status = 'rented'.
// - Return JSON sukses (200) atau error.
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID is required'
      });
    }

    if (!payment_method || !['cash', 'transfer'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing payment method. Must be either 'cash' or 'transfer'"
      });
    }

    // Ambil data rental terlebih dahulu untuk mendapatkan vehicle_id
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('vehicle_id, rental_status')
      .eq('id', id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Update rental status dan payment method
    const { error: updateRentalError } = await supabase
      .from('rentals')
      .update({
        payment_method,
        rental_status: 'paid'
      })
      .eq('id', id);

    if (updateRentalError) {
      return res.status(500).json({
        success: false,
        message: updateRentalError.message
      });
    }

    // Update status kendaraan (vehicle) menjadi 'rented'
    const { error: updateVehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', rental.vehicle_id);

    if (updateVehicleError) {
      return res.status(500).json({
        success: false,
        message: `Rental status updated to paid, but failed to update vehicle status: ${updateVehicleError.message}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and vehicle status updated to rented successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  confirmPayment,
  verifyPayment
};
