import { useState, useEffect } from 'react';
import { MapPin, User, Car, Clock, Phone, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Assignment {
  id: string;
  booking_id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_info: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  status: 'pending' | 'accepted' | 'en_route_pickup' | 'arrived' | 'in_progress' | 'completed';
  total_price: number;
}

export function AdminDispatch() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [unassignedBookings, setUnassignedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('dispatch_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_assignments'
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: assignmentsData } = await supabase
      .from('driver_assignments')
      .select(`
        *,
        drivers:driver_id(name, phone),
        vehicles:vehicle_id(make, model),
        bookings:booking_id(
          customer_name,
          customer_phone,
          pickup_location,
          dropoff_location,
          pickup_datetime,
          total_price
        )
      `)
      .in('status', ['pending', 'accepted', 'en_route_pickup', 'arrived', 'in_progress'])
      .order('created_at', { ascending: true });

    const { data: driversData } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicles:vehicle_id(make, model, license_plate)
      `)
      .eq('status', 'active');

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .is('driver_assignment_id', null)
      .order('pickup_datetime', { ascending: true });

    if (assignmentsData) {
      const mapped = assignmentsData.map((a: any) => ({
        id: a.id,
        booking_id: a.booking_id,
        driver_id: a.driver_id,
        driver_name: a.drivers?.name || 'Unknown',
        driver_phone: a.drivers?.phone || 'N/A',
        vehicle_info: a.vehicles ? `${a.vehicles.make} ${a.vehicles.model}` : 'N/A',
        customer_name: a.bookings?.customer_name || 'Unknown',
        customer_phone: a.bookings?.customer_phone || 'N/A',
        pickup_location: a.bookings?.pickup_location || 'N/A',
        dropoff_location: a.bookings?.dropoff_location || 'N/A',
        pickup_datetime: a.bookings?.pickup_datetime || new Date().toISOString(),
        status: a.status,
        total_price: a.bookings?.total_price || 0,
      }));
      setAssignments(mapped);
    }

    if (driversData) {
      setAvailableDrivers(driversData);
    }

    if (bookingsData) {
      setUnassignedBookings(bookingsData);
    }

    setLoading(false);
  };

  const assignDriver = async () => {
    if (!selectedBooking || !selectedDriver) return;

    const { data: vehicleData } = await supabase
      .from('drivers')
      .select('vehicle_id')
      .eq('id', selectedDriver)
      .single();

    const { error } = await supabase
      .from('driver_assignments')
      .insert([{
        booking_id: selectedBooking,
        driver_id: selectedDriver,
        vehicle_id: vehicleData?.vehicle_id,
        status: 'pending',
      }]);

    if (!error) {
      setSelectedBooking('');
      setSelectedDriver('');
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: Assignment['status']) => {
    await supabase
      .from('driver_assignments')
      .update({ status })
      .eq('id', id);

    if (status === 'completed') {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', assignments.find(a => a.id === id)?.booking_id);
    }

    fetchData();
  };

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/20',
    accepted: 'text-blue-400 bg-blue-500/20',
    en_route_pickup: 'text-cyan-400 bg-cyan-500/20',
    arrived: 'text-purple-400 bg-purple-500/20',
    in_progress: 'text-green-400 bg-green-500/20',
    completed: 'text-gray-400 bg-gray-500/20',
  };

  const stats = {
    active: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    unassigned: unassignedBookings.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Dispatch</h1>
          <p className="text-gray-400 mt-1">Real-time driver assignments and tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs mb-1">Active Trips</p>
          <p className="text-xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs mb-1">In Progress</p>
          <p className="text-xl font-bold text-green-400">{stats.inProgress}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <p className="text-gray-400 text-xs mb-1">Unassigned</p>
          <p className="text-xl font-bold text-red-400">{stats.unassigned}</p>
        </div>
      </div>

      {unassignedBookings.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Assign Driver to Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Select Booking</option>
              {unassignedBookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.reference} - {booking.customer_name} ({new Date(booking.pickup_datetime).toLocaleString()})
                </option>
              ))}
            </select>

            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Select Driver</option>
              {availableDrivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} - {driver.vehicles ? `${driver.vehicles.make} ${driver.vehicles.model}` : 'No vehicle'}
                </option>
              ))}
            </select>

            <button
              onClick={assignDriver}
              disabled={!selectedBooking || !selectedDriver}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Assign Driver
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <h2 className="text-white font-semibold mb-4">Active Assignments</h2>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{assignment.driver_name}</p>
                    <p className="text-gray-400 text-sm">{assignment.vehicle_info}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[assignment.status]}`}>
                  {assignment.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Customer</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-white">{assignment.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <p className="text-gray-300 text-sm">{assignment.customer_phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Pickup Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-white">
                      {new Date(assignment.pickup_datetime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 text-xs font-medium mb-1">Pickup</p>
                    <p className="text-white text-sm">{assignment.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <MapPin className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-xs font-medium mb-1">Dropoff</p>
                    <p className="text-white text-sm">{assignment.dropoff_location}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {assignment.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(assignment.id, 'accepted')}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
                  >
                    Mark Accepted
                  </button>
                )}
                {assignment.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(assignment.id, 'en_route_pickup')}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium"
                  >
                    En Route to Pickup
                  </button>
                )}
                {assignment.status === 'en_route_pickup' && (
                  <button
                    onClick={() => updateStatus(assignment.id, 'arrived')}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all text-sm font-medium"
                  >
                    Arrived
                  </button>
                )}
                {assignment.status === 'arrived' && (
                  <button
                    onClick={() => updateStatus(assignment.id, 'in_progress')}
                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all text-sm font-medium"
                  >
                    Start Trip
                  </button>
                )}
                {assignment.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(assignment.id, 'completed')}
                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all text-sm font-medium"
                  >
                    Complete Trip
                  </button>
                )}
              </div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div className="text-center py-12">
              <Navigation className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No active assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
