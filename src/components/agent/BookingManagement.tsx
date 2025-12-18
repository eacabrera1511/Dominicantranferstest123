import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, User, Car, DollarSign, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  customer_id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;
  vehicle_type: string;
  passenger_count: number;
  price: number;
  workflow_status: string;
  payment_status: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  trip_assignments?: Array<{
    id: string;
    status: string;
    drivers: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, bookings]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email,
            phone
          ),
          trip_assignments (
            id,
            status,
            drivers (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.customers?.first_name?.toLowerCase().includes(term) ||
          b.customers?.last_name?.toLowerCase().includes(term) ||
          b.customers?.email?.toLowerCase().includes(term) ||
          b.pickup_address?.toLowerCase().includes(term) ||
          b.dropoff_address?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.workflow_status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">{filteredBookings.length} bookings found</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {booking.customers?.first_name} {booking.customers?.last_name}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.workflow_status)}`}>
                        {booking.workflow_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Pickup:</p>
                          <p className="text-gray-900 font-medium">{booking.pickup_address || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Dropoff:</p>
                          <p className="text-gray-900 font-medium">{booking.dropoff_address || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.pickup_datetime ? new Date(booking.pickup_datetime).toLocaleString() : 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        <span className="capitalize">{booking.vehicle_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {booking.trip_assignments && booking.trip_assignments.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Driver:</span>
                        <span className="font-medium text-gray-900">
                          {booking.trip_assignments[0].drivers.first_name} {booking.trip_assignments[0].drivers.last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                      <DollarSign className="w-5 h-5" />
                      {parseFloat(booking.price?.toString() || '0').toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{booking.payment_status}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedBooking.customers?.first_name} {selectedBooking.customers?.last_name}</span></p>
                  <p><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedBooking.customers?.email}</span></p>
                  <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedBooking.customers?.phone || 'Not provided'}</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Trip Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-600">Pickup:</span> <span className="font-medium">{selectedBooking.pickup_address}</span></p>
                  <p><span className="text-gray-600">Dropoff:</span> <span className="font-medium">{selectedBooking.dropoff_address}</span></p>
                  <p><span className="text-gray-600">Date/Time:</span> <span className="font-medium">{new Date(selectedBooking.pickup_datetime).toLocaleString()}</span></p>
                  <p><span className="text-gray-600">Vehicle:</span> <span className="font-medium capitalize">{selectedBooking.vehicle_type}</span></p>
                  <p><span className="text-gray-600">Passengers:</span> <span className="font-medium">{selectedBooking.passenger_count}</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-gray-900">${parseFloat(selectedBooking.price?.toString() || '0').toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">Payment Status: {selectedBooking.payment_status}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
