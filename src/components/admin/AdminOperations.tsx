import { useState, useEffect } from 'react';
import {
  HeadphonesIcon, Clock, Code, Bug, Wrench, Download,
  CheckCircle, AlertCircle, Users, TrendingUp, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OperationalData {
  metric_date: string;
  open_support_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  dev_hours_features: number;
  dev_hours_bugs: number;
  dev_hours_maintenance: number;
}

export function AdminOperations() {
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  const [operationalData, setOperationalData] = useState<OperationalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperationalData();
  }, [dateRange]);

  const fetchOperationalData = async () => {
    setLoading(true);
    const days = dateRange === '7d' ? 7 : 30;
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const { data } = await supabase
      .from('operational_metrics')
      .select('*')
      .gte('metric_date', startDate)
      .order('metric_date', { ascending: true });

    if (data) {
      setOperationalData(data);
    }

    setLoading(false);
  };

  const totals = operationalData.reduce(
    (acc, d) => ({
      openTickets: acc.openTickets + Number(d.open_support_tickets),
      resolvedTickets: acc.resolvedTickets + Number(d.resolved_tickets),
      avgResolutionTime: acc.avgResolutionTime + Number(d.avg_resolution_time_hours),
      devFeatures: acc.devFeatures + Number(d.dev_hours_features),
      devBugs: acc.devBugs + Number(d.dev_hours_bugs),
      devMaintenance: acc.devMaintenance + Number(d.dev_hours_maintenance),
    }),
    { openTickets: 0, resolvedTickets: 0, avgResolutionTime: 0, devFeatures: 0, devBugs: 0, devMaintenance: 0 }
  );

  const avgResolutionTime = operationalData.length > 0
    ? totals.avgResolutionTime / operationalData.length
    : 0;

  const totalDevHours = totals.devFeatures + totals.devBugs + totals.devMaintenance;
  const latestData = operationalData[operationalData.length - 1];

  const exportReport = () => {
    const headers = ['Date', 'Open Tickets', 'Resolved', 'Avg Resolution (h)', 'Feature Dev (h)', 'Bug Fixes (h)', 'Maintenance (h)'];
    const rows = operationalData.map(d => [
      d.metric_date,
      d.open_support_tickets,
      d.resolved_tickets,
      d.avg_resolution_time_hours,
      d.dev_hours_features,
      d.dev_hours_bugs,
      d.dev_hours_maintenance
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operations-report-${dateRange}.csv`;
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
          <h1 className="text-2xl font-bold text-white">Operations</h1>
          <p className="text-gray-400 mt-1">Support tickets and development activity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-xl p-1">
            {(['7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={exportReport}
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
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <HeadphonesIcon className="w-5 h-5 text-amber-400" />
            </div>
            <span className={`text-sm font-medium ${latestData?.open_support_tickets > 10 ? 'text-amber-400' : 'text-green-400'}`}>
              {latestData?.open_support_tickets > 10 ? 'High' : 'Normal'}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Open Tickets</p>
          <p className="text-2xl font-bold text-white">{latestData?.open_support_tickets || 0}</p>
          <p className="text-gray-500 text-xs mt-1">Current queue</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-400">{totals.resolvedTickets}</p>
          <p className="text-gray-500 text-xs mt-1">This period</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Avg Resolution</p>
          <p className="text-2xl font-bold text-white">{avgResolutionTime.toFixed(1)}h</p>
          <p className="text-gray-500 text-xs mt-1">Time to resolve</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-fuchsia-500/20">
              <Code className="w-5 h-5 text-fuchsia-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Dev Hours</p>
          <p className="text-2xl font-bold text-white">{totalDevHours.toFixed(1)}h</p>
          <p className="text-gray-500 text-xs mt-1">This period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Development Time Allocation</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm">New Features</span>
                </div>
                <span className="text-white font-medium">{totals.devFeatures.toFixed(1)}h</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(totals.devFeatures / totalDevHours) * 100}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {((totals.devFeatures / totalDevHours) * 100).toFixed(1)}% of total dev time
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-400" />
                  <span className="text-gray-400 text-sm">Bug Fixes</span>
                </div>
                <span className="text-white font-medium">{totals.devBugs.toFixed(1)}h</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(totals.devBugs / totalDevHours) * 100}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {((totals.devBugs / totalDevHours) * 100).toFixed(1)}% of total dev time
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-400 text-sm">Maintenance</span>
                </div>
                <span className="text-white font-medium">{totals.devMaintenance.toFixed(1)}h</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(totals.devMaintenance / totalDevHours) * 100}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {((totals.devMaintenance / totalDevHours) * 100).toFixed(1)}% of total dev time
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Development Time</span>
              <span className="text-white font-bold text-lg">{totalDevHours.toFixed(1)} hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Support Performance</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Resolution Rate</span>
                <span className={`font-medium ${totals.resolvedTickets >= totals.openTickets ? 'text-green-400' : 'text-amber-400'}`}>
                  {totals.openTickets > 0
                    ? ((totals.resolvedTickets / (totals.resolvedTickets + latestData?.open_support_tickets || 1)) * 100).toFixed(1)
                    : 100}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{
                    width: `${totals.openTickets > 0
                      ? (totals.resolvedTickets / (totals.resolvedTickets + latestData?.open_support_tickets || 1)) * 100
                      : 100}%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                <p className="text-white text-2xl font-bold">{latestData?.open_support_tickets || 0}</p>
                <p className="text-gray-400 text-sm">Pending</p>
              </div>

              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-white text-2xl font-bold">{totals.resolvedTickets}</p>
                <p className="text-gray-400 text-sm">Resolved</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Average Response Time</span>
              </div>
              <p className="text-3xl font-bold text-white">{avgResolutionTime.toFixed(1)}<span className="text-lg text-gray-400 ml-1">hours</span></p>
              <p className="text-gray-500 text-sm mt-1">
                {avgResolutionTime < 8 ? 'Excellent response time' : avgResolutionTime < 24 ? 'Good response time' : 'Needs improvement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Operations Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Date</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Open</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Resolved</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Avg Time</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Features</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Bugs</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {operationalData.slice().reverse().map((day) => (
                <tr key={day.metric_date} className="border-b border-white/5">
                  <td className="py-3 text-white text-sm">
                    {new Date(day.metric_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`py-3 text-right text-sm ${Number(day.open_support_tickets) > 10 ? 'text-amber-400' : 'text-gray-300'}`}>
                    {day.open_support_tickets}
                  </td>
                  <td className="py-3 text-right text-green-400 text-sm">{day.resolved_tickets}</td>
                  <td className="py-3 text-right text-gray-300 text-sm">{Number(day.avg_resolution_time_hours).toFixed(1)}h</td>
                  <td className="py-3 text-right text-blue-400 text-sm">{Number(day.dev_hours_features).toFixed(1)}h</td>
                  <td className="py-3 text-right text-red-400 text-sm">{Number(day.dev_hours_bugs).toFixed(1)}h</td>
                  <td className="py-3 text-right text-amber-400 text-sm">{Number(day.dev_hours_maintenance).toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
