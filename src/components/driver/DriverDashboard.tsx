import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, DollarSign, Star, MapPin, Navigation } from 'lucide-react';

interface DriverDashboardProps {
  driver: any;
}

export default function DriverDashboard({ driver }: DriverDashboardProps) {
  const [stats, setStats] = useState({
    todayTrips: 0,
    todayEarnings: 0,
    upcomingTrips: 0,
    rating: driver?.rating || 0,
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [driver]);

  const loadDashboardData = async () => {
    if (!driver) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayAssignments } = await supabase
        .from('trip_assignments')
        .select(`
          *,
          booking:bookings(*)
        `)
        .eq('driver_id', driver.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const { data: upcoming } = await supabase
        .from('trip_assignments')
        .select(`
          *,
          booking:bookings(*),
          vehicle:vehicles(*)
        `)
        .eq('driver_id', driver.id)
        .in('status', ['assigned', 'accepted'])
        .gte('booking.pickup_datetime', new Date().toISOString())
        .order('booking(pickup_datetime)', { ascending: true })
        .limit(5);

      const completedToday = todayAssignments?.filter(a => a.status === 'completed') || [];
      const todayEarnings = completedToday.reduce((sum, a) => sum + (a.booking?.price || 0), 0);

      setStats({
        todayTrips: completedToday.length,
        todayEarnings,
        upcomingTrips: upcoming?.length || 0,
        rating: driver.rating,
      });

      setUpcomingAssignments(upcoming || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const updateDriverStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driver.id);

      if (error) throw error;

      alert(`Status updated to ${newStatus}`);
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {driver.first_name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={driver.status}
            onChange={(e) => updateDriverStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="on_break">On Break</option>
            <option value="off_duty">Off Duty</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.todayTrips}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${stats.todayEarnings.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.upcomingTrips}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.rating.toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Assignments
          </h3>
        </div>
        <div className="p-6">
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          assignment.status === 'assigned'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {assignment.status}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateTime(assignment.booking.pickup_datetime)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {assignment.booking.pickup_address}
                          </span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Navigation className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {assignment.booking.dropoff_address}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>{assignment.booking.passenger_count} passengers</span>
                        <span>{assignment.booking.luggage_count} bags</span>
                        <span>{assignment.vehicle.make} {assignment.vehicle.model}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${assignment.booking.price}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
