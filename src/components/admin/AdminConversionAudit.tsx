import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, AlertCircle, CheckCircle, XCircle, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';

interface ConversionEvent {
  id: string;
  conversion_type: string;
  conversion_value: number;
  booking_reference: string;
  utm_campaign: string | null;
  utm_term: string | null;
  gclid: string | null;
  sent_to_google: boolean;
  payment_confirmed: boolean;
  created_at: string;
}

export default function AdminConversionAudit() {
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  const fetchConversions = async () => {
    try {
      let query = supabase
        .from('conversion_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      if (dateFilter === 'today') {
        const today = new Date().toDateString();
        filtered = filtered.filter(c => new Date(c.created_at).toDateString() === today);
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        filtered = filtered.filter(c => new Date(c.created_at).toDateString() === yesterdayStr);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(c => new Date(c.created_at) >= weekAgo);
      }

      if (searchTerm) {
        filtered = filtered.filter(c =>
          c.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.utm_campaign?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setConversions(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, [dateFilter, searchTerm]);

  const totalValue = conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0);
  const validConversions = conversions.filter(c => c.payment_confirmed);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Audit</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all Google Ads conversion events</p>
        </div>
        <button
          onClick={fetchConversions}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{conversions.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valid (Paid)</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{validConversions.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by booking reference or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>

        {conversions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No conversion events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Booking Ref</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Sent to Google</th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((conv) => (
                  <tr key={conv.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      {conv.payment_confirmed ? (
                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4" />
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                      {new Date(conv.created_at).toLocaleDateString()}<br />
                      <span className="text-xs text-gray-500">{new Date(conv.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {conv.booking_reference}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      ${conv.conversion_value?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">{conv.utm_campaign || 'Direct'}</div>
                      {conv.utm_term && <div className="text-xs text-gray-500 truncate max-w-[150px]">{conv.utm_term}</div>}
                      {conv.gclid && <div className="text-xs text-blue-600 dark:text-blue-400">GCLID</div>}
                    </td>
                    <td className="py-4 px-4">
                      {conv.sent_to_google ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400 text-sm">✗ No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Conversion Status Explained
        </h3>
        <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
          <p><strong>✓ Valid:</strong> Payment confirmed (payment_status = 'paid') - counted in Google Ads</p>
          <p><strong>✗ Invalid:</strong> Conversion fired but payment was never completed - should NOT appear in Google Ads</p>
          <p className="mt-4"><strong>⚠️ Important:</strong> Only VALID conversions should appear in your Google Ads dashboard. Invalid conversions indicate the old bug where conversions fired on clicks instead of completed payments.</p>
        </div>
      </div>
    </div>
  );
}
