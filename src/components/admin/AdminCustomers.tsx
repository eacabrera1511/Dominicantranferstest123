import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, DollarSign, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_bookings: number;
  total_spent: number;
  last_booking_date?: string;
  preferred_pickup_locations: string[];
  vip_status: boolean;
  created_at: string;
}

interface CustomerBooking {
  id: string;
  reference: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  total_price: number;
  status: string;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('customer_name, customer_email, customer_phone, total_price, pickup_location, pickup_datetime, created_at');

    if (bookingsData) {
      const customerMap = new Map<string, Customer>();

      bookingsData.forEach((booking: any) => {
        const key = booking.customer_email.toLowerCase();

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            total_bookings: 0,
            total_spent: 0,
            preferred_pickup_locations: [],
            vip_status: false,
            created_at: booking.created_at,
          });
        }

        const customer = customerMap.get(key)!;
        customer.total_bookings++;
        customer.total_spent += booking.total_price || 0;

        if (booking.pickup_location && !customer.preferred_pickup_locations.includes(booking.pickup_location)) {
          customer.preferred_pickup_locations.push(booking.pickup_location);
        }

        if (!customer.last_booking_date || new Date(booking.pickup_datetime) > new Date(customer.last_booking_date)) {
          customer.last_booking_date = booking.pickup_datetime;
        }

        if (customer.total_bookings >= 5 || customer.total_spent >= 500) {
          customer.vip_status = true;
        }
      });

      const customersArray = Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(customersArray);
    }

    setLoading(false);
  };

  const fetchCustomerBookings = async (email: string) => {
    setLoadingBookings(true);

    const { data } = await supabase
      .from('bookings')
      .select('id, reference, pickup_location, dropoff_location, pickup_datetime, total_price, status')
      .eq('customer_email', email)
      .order('pickup_datetime', { ascending: false });

    if (data) {
      setCustomerBookings(data);
    }

    setLoadingBookings(false);
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerBookings(customer.email);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.vip_status).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgSpent: customers.length > 0
      ? (customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length).toFixed(2)
      : '0.00',
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
          <h1 className="text-2xl font-bold text-white">Customer CRM</h1>
          <p className="text-gray-400 mt-1">Manage customer relationships and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">VIP Customers</p>
          <p className="text-2xl font-bold text-amber-400">{stats.vip}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Avg Customer Value</p>
          <p className="text-2xl font-bold text-white">${stats.avgSpent}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Customer</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Contact</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Bookings</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Total Spent</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Last Booking</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleViewCustomer(customer)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{customer.name}</p>
                        {customer.vip_status && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-white font-medium">{customer.total_bookings}</td>
                  <td className="py-4 text-green-400 font-medium">${customer.total_spent.toFixed(2)}</td>
                  <td className="py-4 text-gray-300 text-sm">
                    {customer.last_booking_date
                      ? new Date(customer.last_booking_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      customer.vip_status ? 'text-amber-400 bg-amber-500/20' : 'text-gray-400 bg-gray-500/20'
                    }`}>
                      {customer.vip_status ? 'VIP' : 'Standard'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-gray-400">{selectedCustomer.email}</p>
                </div>
                {selectedCustomer.vip_status && (
                  <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium">
                    VIP Customer
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{selectedCustomer.total_bookings}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-green-400">${selectedCustomer.total_spent.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Avg per Booking</p>
                <p className="text-2xl font-bold text-white">
                  ${(selectedCustomer.total_spent / selectedCustomer.total_bookings).toFixed(2)}
                </p>
              </div>
            </div>

            {selectedCustomer.preferred_pickup_locations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Preferred Pickup Locations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.preferred_pickup_locations.slice(0, 5).map((location, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-white/5 text-gray-300 text-sm">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-white font-semibold mb-3">Booking History</h3>
              {loadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {customerBookings.map((booking) => (
                    <div key={booking.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{booking.reference}</span>
                        <span className="text-green-400 font-medium">${booking.total_price}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Route</p>
                          <p className="text-white">{booking.pickup_location}</p>
                          <p className="text-gray-400">to {booking.dropoff_location}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Date</p>
                          <p className="text-white">
                            {new Date(booking.pickup_datetime).toLocaleDateString()}
                          </p>
                          <p className="text-gray-400 capitalize">{booking.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
