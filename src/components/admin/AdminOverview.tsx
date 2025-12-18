import { useState, useEffect } from 'react';
import {
  Car, Calendar, TrendingUp, MapPin,
  DollarSign, Clock, AlertCircle, ArrowUpRight,
  ArrowDownRight, Users, CheckCircle, XCircle, Plane
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
}

function MetricCard({ title, value, change, changeLabel, icon: Icon, color, prefix, suffix }: MetricCardProps) {
  const isPositive = change && change > 0;
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-500',
    slate: 'from-slate-500 to-gray-500',
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {changeLabel && (
        <p className="text-gray-500 text-xs mt-1">{changeLabel}</p>
      )}
    </div>
  );
}

interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  passengers: number;
  vehicle_type: string;
  total_price: string;
  status: string;
  payment_status: string;
  driver_id: string | null;
  vehicle_id: string | null;
  flight_number: string;
}

export function AdminOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [metrics, setMetrics] = useState<any>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [selectedDate]);

  const fetchOverviewData = async () => {
    setLoading(true);

    const selectedDateObj = new Date(selectedDate);
    const yesterdayDate = new Date(selectedDateObj);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const startOfWeek = new Date(selectedDateObj);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const [
      allBookingsRes,
      todayBookingsRes,
      yesterdayBookingsRes,
      weeklyBookingsRes,
      driversRes,
      vehiclesRes
    ] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase
        .from('bookings')
        .select('*')
        .gte('pickup_datetime', `${selectedDate}T00:00:00`)
        .lte('pickup_datetime', `${selectedDate}T23:59:59`)
        .order('pickup_datetime', { ascending: true }),
      supabase
        .from('bookings')
        .select('total_price')
        .gte('created_at', `${yesterday}T00:00:00`)
        .lte('created_at', `${yesterday}T23:59:59`),
      supabase
        .from('bookings')
        .select('created_at, total_price')
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('drivers').select('id, status'),
      supabase.from('fleet_vehicles').select('id, status')
    ]);

    const allBookings = allBookingsRes.data || [];
    const todayPickups = todayBookingsRes.data || [];
    const yesterdayBookings = yesterdayBookingsRes.data || [];

    const todayRevenue = todayPickups.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const yesterdayRevenue = yesterdayBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    const newBookings = allBookings.filter(b =>
      new Date(b.created_at).toISOString().split('T')[0] === selectedDate
    );

    const yesterdayNewBookings = allBookings.filter(b =>
      new Date(b.created_at).toISOString().split('T')[0] === yesterday
    );

    const bookingsChange = yesterdayNewBookings.length > 0
      ? ((newBookings.length - yesterdayNewBookings.length) / yesterdayNewBookings.length) * 100
      : 0;

    const pending = todayPickups.filter(b => b.status === 'pending').length;
    const confirmed = todayPickups.filter(b => b.status === 'confirmed').length;
    const assigned = todayPickups.filter(b => b.driver_id !== null).length;
    const completed = todayPickups.filter(b => b.status === 'completed').length;

    const activeDrivers = (driversRes.data || []).filter(d => d.status === 'active').length;
    const availableVehicles = (vehiclesRes.data || []).filter(v => v.status === 'available').length;

    const weeklyData: Record<string, number> = {};
    (weeklyBookingsRes.data || []).forEach(booking => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      weeklyData[date] = (weeklyData[date] || 0) + Number(booking.total_price || 0);
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(selectedDateObj);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        revenue: weeklyData[dateStr] || 0,
        label: date.toLocaleDateString('en', { weekday: 'short' })
      });
    }

    setMetrics({
      totalBookings: allBookings.length,
      newBookings: newBookings.length,
      bookingsChange,
      todayRevenue,
      revenueChange,
      todayPickups: todayPickups.length,
      pending,
      confirmed,
      assigned,
      completed,
      activeDrivers,
      availableVehicles
    });

    setTodayBookings(todayPickups);
    setWeeklyRevenue(last7Days);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxRevenue = Math.max(...weeklyRevenue.map(d => d.revenue), 1);
  const weekTotal = weeklyRevenue.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transfer Operations Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time airport transfer and limo service metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="New Bookings"
          value={metrics?.newBookings || 0}
          change={metrics?.bookingsChange}
          changeLabel="vs yesterday"
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Today's Revenue"
          value={metrics?.todayRevenue?.toFixed(2) || '0.00'}
          prefix="$"
          change={metrics?.revenueChange}
          changeLabel="vs yesterday"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Active Transfers"
          value={metrics?.todayPickups || 0}
          icon={Car}
          color="amber"
        />
        <MetricCard
          title="Available Drivers"
          value={metrics?.activeDrivers || 0}
          icon={Users}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Revenue Trend</h2>
              <p className="text-gray-400 text-sm">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                ${weekTotal.toFixed(2)}
              </p>
              <p className="text-gray-400 text-sm">Total this week</p>
            </div>
          </div>

          <div className="flex items-end gap-2 h-40">
            {weeklyRevenue.map((day, idx) => (
              <div key={idx} className="flex items-end gap-1 flex-1">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-white/5 rounded-t-sm relative" style={{ height: '120px' }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-orange-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs mt-2">{day.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Dispatch Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-gray-300 text-sm">Pending</span>
              </div>
              <span className="text-white font-bold text-xl">{metrics?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-gray-300 text-sm">Confirmed</span>
              </div>
              <span className="text-white font-bold text-xl">{metrics?.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-gray-300 text-sm">Assigned</span>
              </div>
              <span className="text-white font-bold text-xl">{metrics?.assigned || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-gray-300 text-sm">Completed</span>
              </div>
              <span className="text-white font-bold text-xl">{metrics?.completed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Today's Transfers Schedule</h2>
          <span className="text-gray-400 text-sm">{todayBookings.length} transfers</span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transfers scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">{booking.reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                        booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.driver_id && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                          Assigned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <Users className="w-4 h-4" />
                      <span>{booking.customer_name}</span>
                      {booking.flight_number && (
                        <>
                          <Plane className="w-4 h-4 ml-2" />
                          <span>{booking.flight_number}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{booking.pickup_location}</span>
                      <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{booking.dropoff_location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-bold">${booking.total_price}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(booking.pickup_datetime).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{booking.vehicle_type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
