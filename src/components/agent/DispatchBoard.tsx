import React, { useState, useEffect } from 'react';
import { Truck, User, MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PendingBooking {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;
  vehicle_type: string;
  passenger_count: number;
  customers: {
    first_name: string;
    last_name: string;
  };
}

interface AvailableDriver {
  id: string;
  first_name: string;
  last_name: string;
  rating: number;
  vehicle_id: string;
  vehicles: {
    vehicle_type: string;
    make: string;
    model: string;
    license_plate: string;
  };
}

export default function DispatchBoard() {
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  useEffect(() => {
    loadDispatchData();

    // Refresh every 30 seconds
    const interval = setInterval(loadDispatchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDispatchData = async () => {
    try {
      // Load pending bookings (not yet assigned)
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('workflow_status', 'pending')
        .order('pickup_datetime', { ascending: true });

      // Load available drivers with vehicles
      const { data: drivers } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (
            vehicle_type,
            make,
            model,
            license_plate
          )
        `)
        .eq('status', 'active')
        .not('vehicle_id', 'is', null);

      // Filter out drivers with active assignments
      if (drivers) {
        const { data: activeAssignments } = await supabase
          .from('trip_assignments')
          .select('driver_id')
          .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress']);

        const busyDriverIds = new Set(activeAssignments?.map((a) => a.driver_id) || []);
        const freeDrivers = drivers.filter((d) => !busyDriverIds.has(d.id));
        setAvailableDrivers(freeDrivers);
      }

      setPendingBookings(bookings || []);
    } catch (error) {
      console.error('Error loading dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDispatch = async (bookingId: string) => {
    setDispatching(true);
    setSelectedBooking(bookingId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-dispatch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_id: bookingId }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Booking assigned to ${result.driver.first_name} ${result.driver.last_name}`);
        loadDispatchData();
      } else {
        alert(result.error || 'Dispatch failed');
      }
    } catch (error) {
      console.error('Error dispatching:', error);
      alert('Failed to dispatch booking');
    } finally {
      setDispatching(false);
      setSelectedBooking(null);
    }
  };

  const handleManualAssign = async (bookingId: string, driverId: string) => {
    setDispatching(true);

    try {
      const driver = availableDrivers.find((d) => d.id === driverId);
      if (!driver) return;

      const { error } = await supabase
        .from('trip_assignments')
        .insert({
          booking_id: bookingId,
          driver_id: driverId,
          vehicle_id: driver.vehicle_id,
          assignment_method: 'manual',
          assigned_by: 'agent',
          status: 'assigned',
        });

      if (error) throw error;

      await supabase
        .from('bookings')
        .update({ workflow_status: 'assigned' })
        .eq('id', bookingId);

      alert('Booking assigned successfully');
      loadDispatchData();
    } catch (error) {
      console.error('Error assigning:', error);
      alert('Failed to assign booking');
    } finally {
      setDispatching(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Dispatch Board</h1>
        <p className="text-gray-600 mt-1">Assign drivers to pending bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Bookings ({pendingBookings.length})
            </h2>

            <div className="space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">All bookings have been assigned!</p>
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.customers.first_name} {booking.customers.last_name}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{booking.vehicle_type} • {booking.passenger_count} pax</p>
                      </div>
                      <button
                        onClick={() => handleAutoDispatch(booking.id)}
                        disabled={dispatching && selectedBooking === booking.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                      >
                        {dispatching && selectedBooking === booking.id ? 'Assigning...' : 'Auto-Assign'}
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{booking.pickup_address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{booking.dropoff_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{new Date(booking.pickup_datetime).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Manual Assignment:</p>
                      <div className="flex gap-2 flex-wrap">
                        {availableDrivers
                          .filter((d) => d.vehicles.vehicle_type === booking.vehicle_type)
                          .slice(0, 3)
                          .map((driver) => (
                            <button
                              key={driver.id}
                              onClick={() => handleManualAssign(booking.id, driver.id)}
                              disabled={dispatching}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition disabled:opacity-50"
                            >
                              {driver.first_name} {driver.last_name} ({driver.rating}⭐)
                            </button>
                          ))}
                        {availableDrivers.filter((d) => d.vehicles.vehicle_type === booking.vehicle_type).length === 0 && (
                          <span className="text-xs text-gray-500">No matching drivers available</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Available Drivers ({availableDrivers.length})
            </h2>

            <div className="space-y-3">
              {availableDrivers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No drivers available</p>
              ) : (
                availableDrivers.map((driver) => (
                  <div key={driver.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="text-xs text-gray-600">{driver.rating} ⭐ rating</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Truck className="w-3 h-3" />
                      <span className="capitalize">{driver.vehicles.vehicle_type}</span>
                      <span className="text-gray-400">•</span>
                      <span>{driver.vehicles.make} {driver.vehicles.model}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
