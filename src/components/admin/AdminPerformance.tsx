import { useState, useEffect } from 'react';
import {
  Activity, Clock, AlertTriangle, CheckCircle, Server,
  Wifi, WifiOff, Download, RefreshCw, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PerformanceData {
  metric_date: string;
  avg_page_load_time: number;
  avg_api_response_time: number;
  uptime_percentage: number;
  total_errors: number;
  error_rate: number;
  successful_requests: number;
  failed_requests: number;
}

export function AdminPerformance() {
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    const days = dateRange === '7d' ? 7 : 30;
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const { data } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('metric_date', startDate)
      .order('metric_date', { ascending: true });

    if (data) {
      setPerformanceData(data);
    }

    setLoading(false);
  };

  const averages = performanceData.length > 0
    ? {
        pageLoadTime: performanceData.reduce((sum, d) => sum + Number(d.avg_page_load_time), 0) / performanceData.length,
        apiResponseTime: performanceData.reduce((sum, d) => sum + Number(d.avg_api_response_time), 0) / performanceData.length,
        uptime: performanceData.reduce((sum, d) => sum + Number(d.uptime_percentage), 0) / performanceData.length,
        errorRate: performanceData.reduce((sum, d) => sum + Number(d.error_rate), 0) / performanceData.length,
        totalErrors: performanceData.reduce((sum, d) => sum + Number(d.total_errors), 0),
        successfulRequests: performanceData.reduce((sum, d) => sum + Number(d.successful_requests), 0),
        failedRequests: performanceData.reduce((sum, d) => sum + Number(d.failed_requests), 0),
      }
    : { pageLoadTime: 0, apiResponseTime: 0, uptime: 0, errorRate: 0, totalErrors: 0, successfulRequests: 0, failedRequests: 0 };

  const getStatusColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-green-400';
    if (uptime >= 99.5) return 'text-amber-400';
    return 'text-red-400';
  };

  const getLoadTimeStatus = (time: number) => {
    if (time < 1000) return { color: 'text-green-400', label: 'Excellent' };
    if (time < 2000) return { color: 'text-amber-400', label: 'Good' };
    return { color: 'text-red-400', label: 'Needs Improvement' };
  };

  const exportReport = () => {
    const headers = ['Date', 'Page Load (ms)', 'API Response (ms)', 'Uptime %', 'Errors', 'Error Rate', 'Successful Requests', 'Failed Requests'];
    const rows = performanceData.map(d => [
      d.metric_date,
      d.avg_page_load_time,
      d.avg_api_response_time,
      d.uptime_percentage,
      d.total_errors,
      d.error_rate,
      d.successful_requests,
      d.failed_requests
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${dateRange}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const loadTimeStatus = getLoadTimeStatus(averages.pageLoadTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Metrics</h1>
          <p className="text-gray-400 mt-1">System health, uptime, and response times</p>
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
            onClick={fetchPerformanceData}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
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
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <span className={`text-sm font-medium ${getStatusColor(averages.uptime)}`}>
              {averages.uptime >= 99.9 ? 'Healthy' : averages.uptime >= 99.5 ? 'Warning' : 'Critical'}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Average Uptime</p>
          <p className={`text-2xl font-bold ${getStatusColor(averages.uptime)}`}>
            {averages.uptime.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className={`text-sm font-medium ${loadTimeStatus.color}`}>
              {loadTimeStatus.label}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-1">Avg Page Load</p>
          <p className="text-2xl font-bold text-white">{averages.pageLoadTime.toFixed(0)}ms</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Avg API Response</p>
          <p className="text-2xl font-bold text-white">{averages.apiResponseTime.toFixed(0)}ms</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Errors</p>
          <p className="text-2xl font-bold text-red-400">{averages.totalErrors}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Web Server</p>
                  <p className="text-gray-500 text-sm">Primary application server</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Database</p>
                  <p className="text-gray-500 text-sm">Supabase PostgreSQL</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Edge Functions</p>
                  <p className="text-gray-500 text-sm">Serverless compute</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">AI Services</p>
                  <p className="text-gray-500 text-sm">LLM API connections</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Request Statistics</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Success Rate</span>
                <span className="text-green-400 font-medium">
                  {((averages.successfulRequests / (averages.successfulRequests + averages.failedRequests || 1)) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(averages.successfulRequests / (averages.successfulRequests + averages.failedRequests || 1)) * 100}%`
                  }}
                />
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${(averages.failedRequests / (averages.successfulRequests + averages.failedRequests || 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Successful</span>
                </div>
                <p className="text-2xl font-bold text-white">{averages.successfulRequests.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">requests</p>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Failed</span>
                </div>
                <p className="text-2xl font-bold text-white">{averages.failedRequests.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">requests</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Average Error Rate</span>
                <span className={`font-medium ${averages.errorRate < 0.01 ? 'text-green-400' : averages.errorRate < 0.05 ? 'text-amber-400' : 'text-red-400'}`}>
                  {(averages.errorRate * 100).toFixed(3)}%
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                {averages.errorRate < 0.01 ? 'Error rate is within acceptable limits' : 'Error rate needs attention'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Performance Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Date</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Uptime</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Page Load</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">API Response</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Errors</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Requests</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.slice().reverse().map((day) => (
                <tr key={day.metric_date} className="border-b border-white/5">
                  <td className="py-3 text-white text-sm">
                    {new Date(day.metric_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`py-3 text-right text-sm font-medium ${getStatusColor(Number(day.uptime_percentage))}`}>
                    {Number(day.uptime_percentage).toFixed(2)}%
                  </td>
                  <td className="py-3 text-right text-gray-300 text-sm">{Number(day.avg_page_load_time).toFixed(0)}ms</td>
                  <td className="py-3 text-right text-gray-300 text-sm">{Number(day.avg_api_response_time).toFixed(0)}ms</td>
                  <td className={`py-3 text-right text-sm ${Number(day.total_errors) > 10 ? 'text-red-400' : 'text-gray-300'}`}>
                    {day.total_errors}
                  </td>
                  <td className="py-3 text-right text-gray-300 text-sm">
                    {(Number(day.successful_requests) + Number(day.failed_requests)).toLocaleString()}
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
