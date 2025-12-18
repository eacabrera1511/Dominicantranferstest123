import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Navigation, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DriverAssignmentsProps {
  driver: any;
}

export default function DriverAssignments({ driver }: DriverAssignmentsProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'upcoming' | 'history'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [driver, filter]);

  const loadAssignments = async () => {
    if (!driver) return;

    setLoading(true);
    try {
      let query = supabase
        .from('trip_assignments')
        .select(`
          *,
          booking:bookings(*),
          vehicle:vehicles(*)
        `)
        .eq('driver_id', driver.id);

      if (filter === 'pending') {
        query = query.eq('status', 'assigned');
      } else if (filter === 'upcoming') {
        query = query.in('status', ['accepted', 'en_route_pickup', 'arrived', 'in_progress']);
      } else if (filter === 'history') {
        query = query.in('status', ['completed', 'cancelled']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('trip_assignments')
        .update({
          status: 'accepted',
          driver_accepted_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      alert('Assignment accepted!');
      loadAssignments();
    } catch (error) {
      console.error('Error accepting assignment:', error);
      alert('Failed to accept assignment');
    }
  };

  const declineAssignment = async (assignmentId: string) => {
    const reason = prompt('Please provide a reason for declining:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('trip_assignments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `Driver declined: ${reason}`,
        })
        .eq('id', assignmentId);

      if (error) throw error;

      alert('Assignment declined');
      loadAssignments();
    } catch (error) {
      console.error('Error declining assignment:', error);
      alert('Failed to decline assignment');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'accepted':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'en_route_pickup':
      case 'arrived':
      case 'in_progress':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Assignments</h2>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'pending'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'upcoming'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(assignment.booking.pickup_datetime)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${assignment.booking.price}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Pickup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assignment.booking.pickup_address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Navigation className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dropoff</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assignment.booking.dropoff_address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Passengers</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.booking.passenger_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Luggage</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.booking.luggage_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Vehicle</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.vehicle.make} {assignment.vehicle.model}
                  </p>
                </div>
              </div>

              {assignment.booking.special_requests && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Special Requests
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {assignment.booking.special_requests}
                  </p>
                </div>
              )}

              {assignment.status === 'assigned' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => acceptAssignment(assignment.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => declineAssignment(assignment.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Decline</span>
                  </button>
                </div>
              )}

              {assignment.notes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Dispatch Notes
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{assignment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
