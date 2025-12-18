import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Building2, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface PartnerDashboardProps {
  partner: Partner;
}

interface Stats {
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  recentBookings: any[];
}

export function PartnerDashboard({ partner }: PartnerDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [partner.id]);

  const loadStats = async () => {
    setLoading(true);

    const [hotelsResult, servicesResult, ordersResult] = await Promise.all([
      supabase.from('hotels').select('id').eq('partner_id', partner.id),
      supabase.from('services').select('id').eq('partner_id', partner.id),
      supabase.from('orders').select('*').eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(10)
    ]);

    const totalListings = (hotelsResult.data?.length || 0) + (servicesResult.data?.length || 0);
    const orders = ordersResult.data || [];
    const totalBookings = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const pendingBookings = orders.filter(o => o.status === 'pending').length;

    setStats({
      totalListings,
      totalBookings,
      totalRevenue,
      pendingBookings,
      recentBookings: orders.slice(0, 5)
    });
    setLoading(false);
  };

  const statCards = [
    {
      label: 'Total Listings',
      value: stats.totalListings,
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      change: '+2',
      trend: 'up'
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      change: '+12%',
      trend: 'up'
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-amber-500 to-orange-500',
      change: '+8%',
      trend: 'up'
    },
    {
      label: 'Pending',
      value: stats.pendingBookings,
      icon: Users,
      color: 'from-rose-500 to-pink-500',
      change: '-3',
      trend: 'down'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">Welcome back, {partner.contact_name}!</h1>
        <p className="text-gray-400 text-sm">Here's what's happening with your listings today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-3 xs:p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-lg xs:text-xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-xs xs:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 xs:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base xs:text-lg font-semibold text-white">Recent Bookings</h3>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          {stats.recentBookings.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{booking.item_name || 'Booking'}</p>
                    <p className="text-gray-400 text-xs">{booking.customer_name || 'Customer'}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-white font-semibold text-sm">${booking.total_price}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-500/20 text-green-400'
                        : booking.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No bookings yet</p>
              <p className="text-gray-500 text-xs">Bookings will appear here once customers book your listings</p>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 xs:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base xs:text-lg font-semibold text-white">Partner Status</h3>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              partner.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : partner.status === 'pending'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {partner.status}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-400 text-sm">Business Type</span>
              <span className="text-white text-sm capitalize">{partner.business_type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-400 text-sm">Commission Rate</span>
              <span className="text-white text-sm">{partner.commission_rate}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-400 text-sm">Verified</span>
              <span className={`text-sm ${partner.verified ? 'text-green-400' : 'text-amber-400'}`}>
                {partner.verified ? 'Yes' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400 text-sm">Member Since</span>
              <span className="text-white text-sm">
                {new Date(partner.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {!partner.verified && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-300 text-xs">
                Your account is pending verification. Complete your profile to get verified faster.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl xs:rounded-2xl border border-blue-500/30 p-4 xs:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Ready to grow your business?</h3>
            <p className="text-gray-300 text-sm">Add more listings to reach thousands of travelers searching for their next adventure.</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-3 rounded-xl transition-all whitespace-nowrap">
            Add New Listing
          </button>
        </div>
      </div>
    </div>
  );
}
