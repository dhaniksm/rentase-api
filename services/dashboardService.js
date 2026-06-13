const supabase = require('../config/supabase');

const getDashboardSummary = async () => {
  const [
    usersResponse,
    totalVehiclesResponse,
    availableVehiclesResponse,
    rentedVehiclesResponse,
    maintenanceVehiclesResponse,
    activeRentalsResponse,
    completedRentalsResponse,
    revenueDataResponse
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'rented'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'maintenance'),
    supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('rental_status', 'active'),
    supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('rental_status', 'returned'),
    supabase.from('rentals').select('total_price, created_at').eq('rental_status', 'returned')
  ]);

  if (usersResponse.error) throw usersResponse.error;
  if (revenueDataResponse.error) throw revenueDataResponse.error;

  let totalRevenue = 0;
  let monthlyRevenue = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (revenueDataResponse.data) {
    revenueDataResponse.data.forEach((rental) => {
      const price = Number(rental.total_price) || 0;
      totalRevenue += price;

      if (rental.created_at) {
        const rentalDate = new Date(rental.created_at);
        if (rentalDate.getMonth() === currentMonth && rentalDate.getFullYear() === currentYear) {
          monthlyRevenue += price;
        }
      }
    });
  }

  return {
    total_users: usersResponse.count || 0,
    total_vehicles: totalVehiclesResponse.count || 0,
    available_vehicles: availableVehiclesResponse.count || 0,
    rented_vehicles: rentedVehiclesResponse.count || 0,
    maintenance_vehicles: maintenanceVehiclesResponse.count || 0,
    active_rentals: activeRentalsResponse.count || 0,
    completed_rentals: completedRentalsResponse.count || 0,
    total_revenue: totalRevenue,
    monthly_revenue: monthlyRevenue
  };
};

const getRecentTransactions = async () => {
  const { data, error } = await supabase
    .from('rental_details')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
};

module.exports = {
  getDashboardSummary,
  getRecentTransactions
};
