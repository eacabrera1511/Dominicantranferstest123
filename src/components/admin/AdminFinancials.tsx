import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, CreditCard, Download, Calendar, ArrowUpRight, ArrowDownRight, Percent
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FinancialData {
  metric_date: string;
  total_revenue: number;
  booking_count: number;
  payment_processing_fees: number;
  net_profit: number;
}

export function AdminFinancials() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    setLoading(true);
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 86400000);

    const bookingsRes = await supabase
      .from('bookings')
      .select('created_at, total_price, payment_status, payment_method')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (bookingsRes.data) {
      const bookingsByDate: Record<string, FinancialData> = {};

      bookingsRes.data.forEach(booking => {
        const date = new Date(booking.created_at).toISOString().split('T')[0];
        if (!bookingsByDate[date]) {
          bookingsByDate[date] = {
            metric_date: date,
            total_revenue: 0,
            booking_count: 0,
            payment_processing_fees: 0,
            net_profit: 0
          };
        }

        const price = Number(booking.total_price || 0);
        bookingsByDate[date].total_revenue += price;
        bookingsByDate[date].booking_count += 1;

        if (booking.payment_method === 'stripe' && booking.payment_status === 'paid') {
          bookingsByDate[date].payment_processing_fees += price * 0.029 + 0.30;
        }
      });

      for (const date in bookingsByDate) {
        const data = bookingsByDate[date];
        data.net_profit = data.total_revenue - data.payment_processing_fees;
      }

      setFinancialData(Object.values(bookingsByDate).sort((a, b) =>
        a.metric_date.localeCompare(b.metric_date)
      ));
    }

    setLoading(false);
  };

  const totals = financialData.reduce(
    (acc, d) => ({
      revenue: acc.revenue + Number(d.total_revenue),
      bookings: acc.bookings + Number(d.booking_count),
      paymentFees: acc.paymentFees + Number(d.payment_processing_fees),
      netProfit: acc.netProfit + Number(d.net_profit),
    }),
    { revenue: 0, bookings: 0, paymentFees: 0, netProfit: 0 }
  );

  const profitMargin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;
  const avgBookingValue = totals.bookings > 0 ? totals.revenue / totals.bookings : 0;

  const exportCSV = () => {
    const headers = ['Date', 'Revenue', 'Bookings', 'Payment Fees', 'Net Profit'];
    const rows = financialData.map(d => [
      d.metric_date,
      Number(d.total_revenue).toFixed(2),
      d.booking_count || 0,
      Number(d.payment_processing_fees).toFixed(2),
      Number(d.net_profit).toFixed(2)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange}.csv`;
    a.click();
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
          <h1 className="text-2xl font-bold text-white">Financial Metrics</h1>
          <p className="text-gray-400 mt-1">Revenue, costs, and profitability analysis</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">${totals.revenue.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{totals.bookings}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Avg Booking Value</p>
          <p className="text-2xl font-bold text-white">${avgBookingValue.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Percent className="w-5 h-5 text-amber-400" />
            </div>
            {profitMargin > 0 ? (
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-gray-400 text-sm mb-1">Profit Margin</p>
          <p className={`text-2xl font-bold ${profitMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Summary</h2>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Gross Revenue</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">${totals.revenue.toFixed(2)}</p>
              <p className="text-green-400 text-sm mt-1">From {totals.bookings} transfers</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Payment Fees</span>
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white">-${totals.paymentFees.toFixed(2)}</p>
              <p className="text-amber-400 text-sm mt-1">Stripe processing fees</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Net Profit</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">${totals.netProfit.toFixed(2)}</p>
              <p className="text-blue-400 text-sm mt-1">{profitMargin.toFixed(1)}% margin</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Booking Statistics</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Transfers</span>
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totals.bookings}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Average Booking Value</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">${avgBookingValue.toFixed(2)}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Revenue per Day</span>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                ${financialData.length > 0 ? (totals.revenue / financialData.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Financial Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Date</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Revenue</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Bookings</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Payment Fees</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {financialData.slice(-10).reverse().map((day) => (
                <tr key={day.metric_date} className="border-b border-white/5">
                  <td className="py-3 text-white text-sm">
                    {new Date(day.metric_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 text-right text-white text-sm">${Number(day.total_revenue).toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-400 text-sm">{day.booking_count || 0}</td>
                  <td className="py-3 text-right text-gray-400 text-sm">${Number(day.payment_processing_fees).toFixed(2)}</td>
                  <td className={`py-3 text-right text-sm font-medium ${Number(day.net_profit) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Number(day.net_profit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
