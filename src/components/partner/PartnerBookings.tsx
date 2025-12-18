import { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface PartnerBookingsProps {
  partner: Partner;
}

interface Order {
  id: string;
  booking_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_email: string;
  customer_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  details: any;
}

export function PartnerBookings({ partner }: PartnerBookingsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, [partner.id]);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setOrders(data);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    loadOrders();
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-amber-500/20 text-amber-400';
    }
  };

  const totalRevenue = filteredOrders
    .filter(o => o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">Bookings</h1>
          <p className="text-gray-400 text-sm">Manage customer reservations and orders</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
          <DollarSign className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xs text-gray-400">Total Revenue</p>
            <p className="text-lg font-bold text-white">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer or item..."
            className="w-full bg-white/5 border border-white/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">{order.item_name || 'Booking'}</h3>
                    <p className="text-gray-400 text-sm truncate">{order.customer_name} - {order.customer_email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      {order.check_in_date && (
                        <span>Check-in: {new Date(order.check_in_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <p className="text-white font-bold">${order.total_price}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Bookings will appear here once customers book your listings'}
          </p>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
        />
      )}
    </div>
  );
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Booking Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Booking ID</span>
              <span className="text-white font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Service</span>
              <span className="text-white text-sm">{order.item_name || order.booking_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Customer</span>
              <span className="text-white text-sm">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white text-sm truncate ml-4">{order.customer_email}</span>
            </div>
            {order.check_in_date && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Check-in</span>
                <span className="text-white text-sm">{new Date(order.check_in_date).toLocaleDateString()}</span>
              </div>
            )}
            {order.check_out_date && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Check-out</span>
                <span className="text-white text-sm">{new Date(order.check_out_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Quantity</span>
              <span className="text-white text-sm">{order.quantity}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-white font-bold">${order.total_price}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Payment</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {order.payment_status}
              </span>
            </div>
            {order.payment_method && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Method</span>
                <span className="text-white text-sm capitalize">{order.payment_method}</span>
              </div>
            )}
          </div>

          {order.details && Object.keys(order.details).length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 text-sm">Additional Details</h4>
              <div className="space-y-2 text-sm">
                {order.details.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone</span>
                    <span className="text-white">{order.details.phone}</span>
                  </div>
                )}
                {order.details.customerRequests && (
                  <div>
                    <span className="text-gray-400 block mb-1">Special Requests</span>
                    <p className="text-white text-xs bg-white/5 rounded-lg p-2">{order.details.customerRequests}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateStatus(order.id, 'confirmed')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
