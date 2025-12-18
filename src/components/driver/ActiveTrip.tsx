import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Navigation, Phone, User, Luggage, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface ActiveTripProps {
  assignment: any;
  driver: any;
  onComplete: () => void;
}

export default function ActiveTrip({ assignment, driver, onComplete }: ActiveTripProps) {
  const [currentStatus, setCurrentStatus] = useState(assignment.status);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string, timestampField?: string) => {
    setLoading(true);
    try {
      const updates: any = { status: newStatus };

      if (timestampField) {
        updates[timestampField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from('trip_assignments')
        .update(updates)
        .eq('id', assignment.id);

      if (error) throw error;

      await supabase.from('trip_logs').insert({
        assignment_id: assignment.id,
        event_type: 'status_change',
        event_data: {
          old_status: currentStatus,
          new_status: newStatus,
          timestamp: new Date().toISOString(),
        },
      });

      setCurrentStatus(newStatus);

      if (newStatus === 'completed') {
        alert('Trip completed successfully!');
        onComplete();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case 'accepted':
        return {
          label: 'Start Pickup',
          action: () => updateStatus('en_route_pickup'),
          color: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'en_route_pickup':
        return {
          label: 'Arrived at Pickup',
          action: () => updateStatus('arrived', 'driver_arrived_at'),
          color: 'bg-green-600 hover:bg-green-700',
        };
      case 'arrived':
        return {
          label: 'Customer Onboard',
          action: () => updateStatus('in_progress', 'pickup_completed_at'),
          color: 'bg-green-600 hover:bg-green-700',
        };
      case 'in_progress':
        return {
          label: 'Complete Trip',
          action: () => updateStatus('completed', 'dropoff_completed_at'),
          color: 'bg-purple-600 hover:bg-purple-700',
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

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

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'accepted':
        return 'Trip accepted. Start when ready to pickup customer.';
      case 'en_route_pickup':
        return 'En route to pickup location.';
      case 'arrived':
        return 'Arrived at pickup. Waiting for customer.';
      case 'in_progress':
        return 'Customer onboard. En route to destination.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Active Trip</h2>
            <p className="text-blue-100 mt-1">{getStatusMessage()}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${assignment.booking.price}</p>
            <p className="text-blue-100 text-sm">Trip Fare</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`h-2 flex-1 rounded ${
            ['accepted', 'en_route_pickup', 'arrived', 'in_progress', 'completed'].includes(currentStatus)
              ? 'bg-blue-300'
              : 'bg-blue-900'
          }`}></div>
          <div className={`h-2 flex-1 rounded ${
            ['en_route_pickup', 'arrived', 'in_progress', 'completed'].includes(currentStatus)
              ? 'bg-blue-300'
              : 'bg-blue-900'
          }`}></div>
          <div className={`h-2 flex-1 rounded ${
            ['arrived', 'in_progress', 'completed'].includes(currentStatus)
              ? 'bg-blue-300'
              : 'bg-blue-900'
          }`}></div>
          <div className={`h-2 flex-1 rounded ${
            ['in_progress', 'completed'].includes(currentStatus)
              ? 'bg-blue-300'
              : 'bg-blue-900'
          }`}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trip Details
          </h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Pickup Location</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {assignment.booking.pickup_address}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDateTime(assignment.booking.pickup_datetime)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                <Navigation className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dropoff Location</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {assignment.booking.dropoff_address}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Passengers</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.booking.passenger_count}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Luggage className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Luggage</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.booking.luggage_count}
                </p>
              </div>
            </div>
          </div>

          {assignment.booking.special_requests && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                Special Requests
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {assignment.booking.special_requests}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Customer Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Customer Name</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {assignment.booking.customer_name || 'Not provided'}
                </p>
              </div>
            </div>

            {assignment.booking.customer_phone && (
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Phone Number</p>
                  <a
                    href={`tel:${assignment.booking.customer_phone}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                  >
                    {assignment.booking.customer_phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Vehicle Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vehicle</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.vehicle.make} {assignment.vehicle.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">License Plate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.vehicle.license_plate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Color</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.vehicle.color}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {nextAction && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <button
            onClick={nextAction.action}
            disabled={loading}
            className={`w-full ${nextAction.color} text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-6 w-6" />
                <span>{nextAction.label}</span>
              </>
            )}
          </button>
        </div>
      )}

      {currentStatus === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Trip Completed!
          </h3>
          <p className="text-green-800 dark:text-green-200">
            Great job! The trip has been completed successfully.
          </p>
        </div>
      )}
    </div>
  );
}
