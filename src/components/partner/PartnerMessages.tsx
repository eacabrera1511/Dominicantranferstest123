import { useState, useEffect } from 'react';
import {
  Mail, Bell, Check, CheckCheck, Trash2, Archive,
  RefreshCw, Filter, Search, ChevronRight, Clock,
  Package, AlertCircle, Settings2, X, ShoppingCart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface Message {
  id: string;
  partner_id: string;
  order_id: string | null;
  message_type: string;
  subject: string;
  content: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  priority: string;
  created_at: string;
}

interface NotificationSettings {
  id: string;
  partner_id: string;
  email_on_new_order: boolean;
  email_on_order_update: boolean;
  email_on_cancellation: boolean;
  in_app_notifications: boolean;
  notification_email: string;
  daily_digest: boolean;
  digest_time: string;
}

interface PartnerMessagesProps {
  partner: Partner;
}

export function PartnerMessages({ partner }: PartnerMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'new_order' | 'order_update'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchSettings();
  }, [partner.id]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_messages')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('partner_notification_settings')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (data) {
      setSettings(data);
    } else {
      const { data: newSettings } = await supabase
        .from('partner_notification_settings')
        .insert({
          partner_id: partner.id,
          notification_email: partner.email
        })
        .select()
        .single();

      if (newSettings) {
        setSettings(newSettings);
      }
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('partner_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
    );

    if (selectedMessage?.id === messageId) {
      setSelectedMessage(prev => prev ? { ...prev, is_read: true } : null);
    }
  };

  const markAllAsRead = async () => {
    await supabase
      .from('partner_messages')
      .update({ is_read: true })
      .eq('partner_id', partner.id)
      .eq('is_read', false);

    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
  };

  const deleteMessage = async (messageId: string) => {
    await supabase
      .from('partner_messages')
      .delete()
      .eq('id', messageId);

    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSavingSettings(true);
    await supabase
      .from('partner_notification_settings')
      .update({
        email_on_new_order: settings.email_on_new_order,
        email_on_order_update: settings.email_on_order_update,
        email_on_cancellation: settings.email_on_cancellation,
        in_app_notifications: settings.in_app_notifications,
        notification_email: settings.notification_email,
        daily_digest: settings.daily_digest,
        digest_time: settings.digest_time
      })
      .eq('id', settings.id);

    setSavingSettings(false);
    setShowSettings(false);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'order_update':
        return <Package className="w-5 h-5" />;
      case 'cancellation':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getMessageColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-400 bg-red-500/20';
    switch (type) {
      case 'new_order':
        return 'text-green-400 bg-green-500/20';
      case 'order_update':
        return 'text-blue-400 bg-blue-500/20';
      case 'cancellation':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full">High</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread' && m.is_read) return false;
    if (filter === 'new_order' && m.message_type !== 'new_order') return false;
    if (filter === 'order_update' && m.message_type !== 'order_update') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return m.subject.toLowerCase().includes(query) ||
             m.content.toLowerCase().includes(query);
    }
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-400" />
            Messages
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Notifications and order updates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          {(['all', 'unread', 'new_order', 'order_update'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'new_order' ? 'Orders' : 'Updates'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No messages found</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.is_read) {
                    markAsRead(message.id);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedMessage?.id === message.id
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : message.is_read
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-white/10 border-white/20 hover:bg-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getMessageColor(message.message_type, message.priority)}`}>
                    {getMessageIcon(message.message_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!message.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <h3 className={`font-medium truncate ${message.is_read ? 'text-gray-300' : 'text-white'}`}>
                        {message.subject}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
                      {getPriorityBadge(message.priority)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedMessage ? (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${getMessageColor(selectedMessage.message_type, selectedMessage.priority)}`}>
                      {getMessageIcon(selectedMessage.message_type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{selectedMessage.subject}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-400">
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </span>
                        {getPriorityBadge(selectedMessage.priority)}
                        {selectedMessage.is_read && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Check className="w-3.5 h-3.5" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all lg:hidden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.content}
                </p>

                {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Booking Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedMessage.metadata.customer_name && (
                        <div>
                          <span className="text-xs text-gray-500">Customer</span>
                          <p className="text-white">{selectedMessage.metadata.customer_name as string}</p>
                        </div>
                      )}
                      {selectedMessage.metadata.customer_email && (
                        <div>
                          <span className="text-xs text-gray-500">Email</span>
                          <p className="text-white">{selectedMessage.metadata.customer_email as string}</p>
                        </div>
                      )}
                      {selectedMessage.metadata.customer_phone && (
                        <div>
                          <span className="text-xs text-gray-500">Phone</span>
                          <p className="text-white">{selectedMessage.metadata.customer_phone as string}</p>
                        </div>
                      )}
                      {selectedMessage.metadata.booking_type && (
                        <div>
                          <span className="text-xs text-gray-500">Type</span>
                          <p className="text-white capitalize">{selectedMessage.metadata.booking_type as string}</p>
                        </div>
                      )}
                      {selectedMessage.metadata.total_price && (
                        <div>
                          <span className="text-xs text-gray-500">Total</span>
                          <p className="text-white">${selectedMessage.metadata.total_price as number}</p>
                        </div>
                      )}
                      {selectedMessage.metadata.check_in_date && (
                        <div>
                          <span className="text-xs text-gray-500">Check-in</span>
                          <p className="text-white">
                            {new Date(selectedMessage.metadata.check_in_date as string).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedMessage.order_id && (
                  <div className="mt-6">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium">
                      <Package className="w-4 h-4" />
                      View Order Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center h-full flex flex-col items-center justify-center">
              <Mail className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg">Select a message to read</p>
              <p className="text-gray-600 text-sm mt-1">Choose from your inbox on the left</p>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Settings2 className="w-6 h-6 text-blue-400" />
                  Notification Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {settings && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={settings.notification_email || ''}
                    onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Email Notifications</h3>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-green-400" />
                      <span className="text-white">New orders</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.email_on_new_order}
                      onChange={(e) => setSettings({ ...settings, email_on_new_order: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Order updates</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.email_on_order_update}
                      onChange={(e) => setSettings({ ...settings, email_on_order_update: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-white">Cancellations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.email_on_cancellation}
                      onChange={(e) => setSettings({ ...settings, email_on_cancellation: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">In-App Notifications</h3>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Show notifications in portal</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.in_app_notifications}
                      onChange={(e) => setSettings({ ...settings, in_app_notifications: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Archive className="w-5 h-5 text-gray-400" />
                      <span className="text-white">Daily digest email</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.daily_digest}
                      onChange={(e) => setSettings({ ...settings, daily_digest: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
