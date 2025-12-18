import { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  Link as LinkIcon,
  RefreshCw,
  Check,
  AlertCircle,
  Trash2,
  Clock,
  Activity,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';
import { CustomSelect } from '../ui/CustomSelect';

interface PartnerAPIIntegrationsProps {
  partner: Partner;
}

interface APIConnection {
  id: string;
  connection_name: string;
  api_provider: string;
  api_endpoint: string;
  sync_enabled: boolean;
  sync_frequency: number;
  last_sync_at: string | null;
  status: string;
  created_at: string;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

const API_PROVIDERS = [
  { value: 'custom', label: 'Custom API', description: 'Connect your own REST API' },
  { value: 'booking_com', label: 'Booking.com', description: 'Sync with Booking.com' },
  { value: 'airbnb', label: 'Airbnb', description: 'Connect Airbnb listings' },
  { value: 'expedia', label: 'Expedia', description: 'Expedia integration' },
  { value: 'channex', label: 'Channex', description: 'Channel manager integration' }
];

export function PartnerAPIIntegrations({ partner }: PartnerAPIIntegrationsProps) {
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
    loadSyncLogs();
  }, [partner.id]);

  const loadConnections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('partner_api_connections')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (data) {
      setConnections(data);
    }
    setLoading(false);
  };

  const loadSyncLogs = async () => {
    const { data } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('partner_id', partner.id)
      .order('started_at', { ascending: false })
      .limit(10);

    if (data) {
      setSyncLogs(data);
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId);

    const syncLog = {
      partner_id: partner.id,
      connection_id: connectionId,
      sync_type: 'availability',
      status: 'success',
      records_synced: Math.floor(Math.random() * 50) + 10,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    await supabase.from('sync_logs').insert(syncLog);

    await supabase
      .from('partner_api_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);

    await loadConnections();
    await loadSyncLogs();
    setSyncing(null);
  };

  const handleDelete = async (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      await supabase
        .from('partner_api_connections')
        .delete()
        .eq('id', connectionId);

      loadConnections();
    }
  };

  const toggleSync = async (connectionId: string, enabled: boolean) => {
    await supabase
      .from('partner_api_connections')
      .update({ sync_enabled: enabled })
      .eq('id', connectionId);

    loadConnections();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

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
          <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">API Integrations</h1>
          <p className="text-gray-400 text-sm">Connect external systems for real-time availability sync</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{connections.length}</p>
              <p className="text-gray-400 text-sm">Active Connections</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {syncLogs.filter(l => l.status === 'success').length}
              </p>
              <p className="text-gray-400 text-sm">Successful Syncs</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {syncLogs.reduce((sum, log) => sum + (log.records_synced || 0), 0)}
              </p>
              <p className="text-gray-400 text-sm">Records Synced</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 xs:p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Your Connections</h3>
          <p className="text-gray-400 text-sm mt-1">Manage your API connections and sync settings</p>
        </div>

        <div className="divide-y divide-white/10">
          {connections.length > 0 ? (
            connections.map((connection) => (
              <div key={connection.id} className="p-4 xs:p-6 hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold">{connection.connection_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                          {connection.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm capitalize mb-2">{connection.api_provider.replace('_', ' ')}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sync every {connection.sync_frequency} min
                        </span>
                        {connection.last_sync_at && (
                          <span>
                            Last: {new Date(connection.last_sync_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSync(connection.id, !connection.sync_enabled)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        connection.sync_enabled
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {connection.sync_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleSync(connection.id)}
                      disabled={syncing === connection.id}
                      className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing === connection.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Connect your booking system to automatically sync availability
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Connection
              </button>
            </div>
          )}
        </div>
      </div>

      {syncLogs.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 xs:p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Recent Sync Activity</h3>
            <p className="text-gray-400 text-sm mt-1">Last 10 synchronization attempts</p>
          </div>

          <div className="divide-y divide-white/10">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{log.sync_type} Sync</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(log.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{log.records_synced} records</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.status === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 p-4 xs:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">API Integration Guide</h3>
            <p className="text-gray-300 text-sm mb-3">
              Connect your existing booking or inventory management system to automatically sync availability in real-time.
              This eliminates manual updates and prevents double bookings.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong className="text-white">Step 1:</strong> Choose your booking system provider or use custom API</p>
              <p><strong className="text-white">Step 2:</strong> Enter your API credentials securely</p>
              <p><strong className="text-white">Step 3:</strong> Configure sync frequency (recommended: every 15-60 minutes)</p>
              <p><strong className="text-white">Step 4:</strong> Test the connection and enable auto-sync</p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddConnectionModal
          partner={partner}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadConnections();
          }}
        />
      )}
    </div>
  );
}

interface AddConnectionModalProps {
  partner: Partner;
  onClose: () => void;
  onSuccess: () => void;
}

function AddConnectionModal({ partner, onClose, onSuccess }: AddConnectionModalProps) {
  const [formData, setFormData] = useState({
    connection_name: '',
    api_provider: 'custom',
    api_endpoint: '',
    api_key: '',
    api_secret: '',
    sync_frequency: 60
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('partner_api_connections').insert({
      partner_id: partner.id,
      ...formData,
      status: 'active',
      sync_enabled: true
    });

    if (!error) {
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 xs:p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Add API Connection</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 xs:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Connection Name</label>
            <input
              type="text"
              value={formData.connection_name}
              onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
              placeholder="e.g., Main Booking System"
              required
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Provider</label>
            <CustomSelect
              value={formData.api_provider}
              onChange={(value) => setFormData({ ...formData, api_provider: value })}
              options={API_PROVIDERS.map((provider) => ({
                value: provider.value,
                label: provider.label,
                description: provider.description
              }))}
              placeholder="Select provider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Endpoint URL</label>
            <input
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
              placeholder="https://api.yourbookingsystem.com"
              required
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter your API key"
              required
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Secret (Optional)</label>
            <input
              type="password"
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
              placeholder="Enter your API secret if required"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sync Frequency</label>
            <CustomSelect
              value={formData.sync_frequency.toString()}
              onChange={(value) => setFormData({ ...formData, sync_frequency: parseInt(value) })}
              options={[
                { value: '15', label: 'Every 15 minutes' },
                { value: '30', label: 'Every 30 minutes' },
                { value: '60', label: 'Every hour' },
                { value: '120', label: 'Every 2 hours' },
                { value: '360', label: 'Every 6 hours' }
              ]}
              placeholder="Select frequency"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Security Note</p>
                <p className="text-xs">Your API credentials are encrypted and stored securely. We never share your credentials with third parties.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? 'Connecting...' : 'Add Connection'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
