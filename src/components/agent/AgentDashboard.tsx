import React, { useState, useEffect } from 'react';
import { Calendar, Car, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  activeTrips: number;
  todayRevenue: number;
  availableDrivers: number;
  availableVehicles: number;
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    activeTrips: 0,
    todayRevenue: 0,
    availableDrivers: 0,
    availableVehicles: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get booking counts
      const { count: totalCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_status', 'pending');

      const { count: activeTripsCount } = await supabase
        .from('trip_assignments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress']);

      // Get available drivers and vehicles
      const { count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: vehiclesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

      // Get today's revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', today.toISOString())
        .eq('payment_status', 'paid');

      const revenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0) || 0;

      // Get recent bookings with customer info
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalBookings: totalCount || 0,
        pendingBookings: pendingCount || 0,
        activeTrips: activeTripsCount || 0,
        todayRevenue: revenue,
        availableDrivers: driversCount || 0,
        availableVehicles: vehiclesCount || 0,
      });

      setRecentBookings(bookings || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, subtext }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Calendar}
          label="Total Bookings"
          value={stats.totalBookings}
          color="bg-blue-600"
          subtext={`${stats.pendingBookings} pending`}
        />
        <StatCard
          icon={Clock}
          label="Active Trips"
          value={stats.activeTrips}
          color="bg-green-600"
          subtext="In progress now"
        />
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`$${stats.todayRevenue.toFixed(2)}`}
          color="bg-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Available Drivers"
          value={stats.availableDrivers}
          color="bg-purple-600"
          subtext="Ready for dispatch"
        />
        <StatCard
          icon={Car}
          label="Available Vehicles"
          value={stats.availableVehicles}
          color="bg-orange-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Booking Rate"
          value="+12%"
          color="bg-pink-600"
          subtext="vs last week"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {booking.customers?.first_name} {booking.customers?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.pickup_address || 'Pickup address not set'} → {booking.dropoff_address || 'Dropoff not set'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {booking.pickup_datetime ? new Date(booking.pickup_datetime).toLocaleString() : 'Time not set'}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      booking.workflow_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.workflow_status === 'assigned'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.workflow_status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.workflow_status || 'pending'}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    ${parseFloat(booking.price || '0').toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
