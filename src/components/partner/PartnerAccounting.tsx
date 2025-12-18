import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface PartnerAccountingProps {
  partner: Partner;
}

type TimePeriod = 'today' | 'week' | 'month' | 'year';

interface FinancialData {
  totalRevenue: number;
  totalCommission: number;
  netEarnings: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  transactions: Transaction[];
  revenueByDay: { date: string; revenue: number; commission: number }[];
}

interface Transaction {
  id: string;
  date: string;
  item_name: string;
  customer_name: string;
  booking_type: string;
  total_price: number;
  commission: number;
  net_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
}

export function PartnerAccounting({ partner }: PartnerAccountingProps) {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalCommission: 0,
    netEarnings: 0,
    totalOrders: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    transactions: [],
    revenueByDay: []
  });

  useEffect(() => {
    loadFinancialData();
  }, [partner.id, period]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start: start.toISOString(), end: now.toISOString() };
  };

  const loadFinancialData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('partner_id', partner.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (orders) {
      const commissionRate = partner.commission_rate / 100;

      const transactions: Transaction[] = orders.map(order => {
        const commission = order.total_price * commissionRate;
        const netAmount = order.total_price - commission;

        return {
          id: order.id,
          date: order.created_at,
          item_name: order.item_name,
          customer_name: order.customer_name,
          booking_type: order.booking_type,
          total_price: order.total_price,
          commission,
          net_amount: netAmount,
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method
        };
      });

      const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
      const totalRevenue = confirmedTransactions.reduce((sum, t) => sum + t.total_price, 0);
      const totalCommission = confirmedTransactions.reduce((sum, t) => sum + t.commission, 0);
      const netEarnings = confirmedTransactions.reduce((sum, t) => sum + t.net_amount, 0);

      const revenueByDay = aggregateRevenueByDay(confirmedTransactions, commissionRate);

      setFinancialData({
        totalRevenue,
        totalCommission,
        netEarnings,
        totalOrders: orders.length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        transactions,
        revenueByDay
      });
    }

    setLoading(false);
  };

  const aggregateRevenueByDay = (transactions: Transaction[], commissionRate: number) => {
    const dayMap = new Map<string, { revenue: number; commission: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(date) || { revenue: 0, commission: 0 };
      dayMap.set(date, {
        revenue: existing.revenue + t.total_price,
        commission: existing.commission + t.commission
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .slice(-30);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Service', 'Customer', 'Type', 'Total', 'Commission', 'Net', 'Status'];
    const rows = financialData.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.item_name,
      t.customer_name,
      t.booking_type,
      t.total_price.toFixed(2),
      t.commission.toFixed(2),
      t.net_amount.toFixed(2),
      t.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const periodButtons: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ];

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `$${financialData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-500',
      description: 'Gross revenue from all confirmed bookings'
    },
    {
      label: 'Platform Commission',
      value: `$${financialData.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: PieChart,
      color: 'from-amber-500 to-orange-500',
      description: `${partner.commission_rate}% commission owed to platform`
    },
    {
      label: 'Net Earnings',
      value: `$${financialData.netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      description: 'Your earnings after commission'
    },
    {
      label: 'Total Bookings',
      value: financialData.totalOrders,
      icon: BarChart3,
      color: 'from-violet-500 to-purple-500',
      description: `${financialData.confirmedOrders} confirmed, ${financialData.pendingOrders} pending`
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">Financial Dashboard</h1>
          <p className="text-gray-400 text-sm">Track your earnings and commission payments</p>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {periodButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setPeriod(btn.value)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              period === btn.value
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-gray-400 text-sm font-medium mb-1">{card.label}</p>
            <p className="text-gray-500 text-xs">{card.description}</p>
          </div>
        ))}
      </div>

      {financialData.revenueByDay.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 xs:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Revenue Trends</h3>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>

          <div className="space-y-3">
            {financialData.revenueByDay.slice(-10).map((day, index) => {
              const maxRevenue = Math.max(...financialData.revenueByDay.map(d => d.revenue));
              const revenuePercent = (day.revenue / maxRevenue) * 100;
              const commissionPercent = (day.commission / maxRevenue) * 100;

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{day.date}</span>
                    <span className="text-white font-medium">${day.revenue.toFixed(2)}</span>
                  </div>
                  <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${revenuePercent}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${commissionPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Commission: ${day.commission.toFixed(2)}</span>
                    <span className="text-gray-500">Net: ${(day.revenue - day.commission).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <span className="text-xs text-gray-400">Total Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <span className="text-xs text-gray-400">Commission</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 xs:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm mt-1">All bookings and their financial breakdown</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Commission</th>
                <th className="px-4 py-3 text-right font-medium">Net</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {financialData.transactions.length > 0 ? (
                financialData.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {transaction.item_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {transaction.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 capitalize">
                      {transaction.booking_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium text-right">
                      ${transaction.total_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-400 text-right">
                      ${transaction.commission.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400 font-medium text-right">
                      ${transaction.net_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.status === 'confirmed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No transactions found for this period</p>
                    <p className="text-gray-500 text-xs mt-1">Transactions will appear here once bookings are confirmed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl xs:rounded-2xl border border-amber-500/30 p-4 xs:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <PieChart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Commission Breakdown</h3>
            <p className="text-gray-300 text-sm mb-3">
              Platform commission is calculated at <span className="font-bold text-amber-400">{partner.commission_rate}%</span> of each confirmed booking.
              This covers payment processing, marketing, customer support, and platform maintenance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Paid</p>
                <p className="text-lg font-bold text-white">${financialData.totalCommission.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Your Rate</p>
                <p className="text-lg font-bold text-white">{partner.commission_rate}%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Avg per Order</p>
                <p className="text-lg font-bold text-white">
                  ${financialData.confirmedOrders > 0
                    ? (financialData.totalCommission / financialData.confirmedOrders).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
