import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Calendar, Search, Eye, ExternalLink, Filter, Trash2, CheckCircle, XCircle, Clock, Target, TrendingUp, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatConversation {
  id: string;
  device_id: string;
  started_at: string;
  last_message_at: string;
  language: string;
  booking_created: boolean;
  booking_id: string | null;
  session_metadata: Record<string, any>;
  message_count?: number;
  user_message_count?: number;
  assistant_message_count?: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ConversationStats {
  total: number;
  withBooking: number;
  withoutBooking: number;
  conversionRate: number;
  avgMessagesPerConversation: number;
}

export function AdminChatTranscripts() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [filterBookingStatus, setFilterBookingStatus] = useState<'all' | 'with_booking' | 'no_booking'>('all');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ConversationStats>({
    total: 0,
    withBooking: 0,
    withoutBooking: 0,
    conversionRate: 0,
    avgMessagesPerConversation: 0
  });

  useEffect(() => {
    loadConversations();
  }, [filterBookingStatus]);

  async function loadConversations() {
    setLoading(true);
    try {
      let query = supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_messages(count)
        `)
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (filterBookingStatus === 'with_booking') {
        query = query.not('booking_id', 'is', null);
      } else if (filterBookingStatus === 'no_booking') {
        query = query.is('booking_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const conversationsWithCount = await Promise.all((data || []).map(async conv => {
        const { data: msgData } = await supabase
          .from('chat_messages')
          .select('role')
          .eq('conversation_id', conv.id);

        const userMsgs = msgData?.filter(m => m.role === 'user').length || 0;
        const assistantMsgs = msgData?.filter(m => m.role === 'assistant').length || 0;

        return {
          ...conv,
          message_count: conv.chat_messages?.[0]?.count || 0,
          user_message_count: userMsgs,
          assistant_message_count: assistantMsgs
        };
      }));

      setConversations(conversationsWithCount);
      calculateStats(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(convos: ChatConversation[]) {
    const total = convos.length;
    const withBooking = convos.filter(c => c.booking_created).length;
    const withoutBooking = total - withBooking;
    const conversionRate = total > 0 ? (withBooking / total) * 100 : 0;
    const avgMessages = total > 0
      ? convos.reduce((sum, c) => sum + (c.message_count || 0), 0) / total
      : 0;

    setStats({
      total,
      withBooking,
      withoutBooking,
      conversionRate,
      avgMessagesPerConversation: avgMessages
    });
  }

  async function loadMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  function handleSelectConversation(conversation: ChatConversation) {
    setSelectedConversation(conversation);
    setMessageSearchQuery('');
    setExpandedMessages(new Set());
    loadMessages(conversation.id);
  }

  function toggleMessageExpansion(messageId: string) {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }

  function expandAllMessages() {
    const allMessageIds = messages.map(m => m.id);
    setExpandedMessages(new Set(allMessageIds));
  }

  function collapseAllMessages() {
    setExpandedMessages(new Set());
  }

  async function deleteConversation(conversationId: string) {
    if (!confirm('Are you sure you want to permanently delete this conversation? This will delete all messages in this conversation. This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setSelectedConversation(null);
      setMessages([]);
      loadConversations();
      alert('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function formatFullDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  function getLanguageFlag(lang: string) {
    const flags: Record<string, string> = {
      en: '🇬🇧',
      es: '🇪🇸',
      nl: '🇳🇱',
      de: '🇩🇪'
    };
    return flags[lang] || '🌐';
  }

  function hasBookingTriggers(messages: ChatMessage[]): boolean {
    return messages.some(msg =>
      msg.metadata?.bookingTriggered ||
      msg.metadata?.vehicleOptions ||
      msg.metadata?.priceCalculated ||
      msg.message_type === 'booking_initiated'
    );
  }

  function getConversationSummary(conv: ChatConversation): string {
    const userMsgCount = conv.user_message_count || 0;
    const assistantMsgCount = conv.assistant_message_count || 0;

    if (userMsgCount === 0) return 'No user messages';
    if (userMsgCount === 1) return '1 user message';
    if (conv.booking_created) return `${userMsgCount} msgs → Booking created`;
    if (userMsgCount > 5) return `${userMsgCount} msgs → No booking`;
    return `${userMsgCount} user messages`;
  }

  const filteredConversations = conversations.filter(conv =>
    conv.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(msg =>
    messageSearchQuery === '' ||
    msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  const userMessages = messages.filter(m => m.role === 'user');
  const hasBookingIndicators = hasBookingTriggers(messages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Chat Transcripts & Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View customer conversations and track booking conversion
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.total}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Conversations</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.withBooking}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">With Booking</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.conversionRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.avgMessagesPerConversation.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Messages</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterBookingStatus('all')}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      filterBookingStatus === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterBookingStatus('with_booking')}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      filterBookingStatus === 'with_booking'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Booked
                  </button>
                  <button
                    onClick={() => setFilterBookingStatus('no_booking')}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      filterBookingStatus === 'no_booking'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    No Booking
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto min-h-[300px] max-h-[calc(100vh-350px)]">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {conv.device_id.slice(-8)}
                          </span>
                        </div>
                        <span className="text-lg">{getLanguageFlag(conv.language)}</span>
                      </div>

                      <div className="mb-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {getConversationSummary(conv)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(conv.last_message_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          {conv.booking_created ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : conv.user_message_count && conv.user_message_count > 3 ? (
                            <XCircle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Conversation Details
                    </h2>
                    <div className="flex items-center gap-2">
                      {expandedMessages.size === messages.length && messages.length > 0 ? (
                        <button
                          onClick={collapseAllMessages}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                          title="Collapse All Messages"
                        >
                          <Minimize2 className="w-3 h-3" />
                          Collapse All
                        </button>
                      ) : (
                        <button
                          onClick={expandAllMessages}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-lg transition-all"
                          title="Expand All Messages"
                        >
                          <Maximize2 className="w-3 h-3" />
                          Expand All
                        </button>
                      )}
                      {selectedConversation.booking_id && (
                        <a
                          href={`#booking-${selectedConversation.booking_id}`}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Booking
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteConversation(selectedConversation.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all"
                        title="Delete Conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conversation Status Bar */}
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">User Messages</p>
                          <p className="font-bold text-slate-900 dark:text-white">{userMessages.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Booking Engine</p>
                          <p className={`font-bold ${hasBookingIndicators ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {hasBookingIndicators ? 'Triggered' : 'Not Triggered'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedConversation.booking_created ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Outcome</p>
                          <p className={`font-bold ${selectedConversation.booking_created ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {selectedConversation.booking_created ? 'Booked' : 'No Booking'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Duration</p>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {Math.round((new Date(selectedConversation.last_message_at).getTime() - new Date(selectedConversation.started_at).getTime()) / 60000)} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search within conversation */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search within this conversation..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Device ID:</span>
                      <p className="font-mono text-xs text-slate-900 dark:text-white break-all">
                        {selectedConversation.device_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Language:</span>
                      <p className="text-slate-900 dark:text-white">
                        {getLanguageFlag(selectedConversation.language)} {selectedConversation.language.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Started:</span>
                      <p className="text-slate-900 dark:text-white text-xs">
                        {formatFullDate(selectedConversation.started_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Last Message:</span>
                      <p className="text-slate-900 dark:text-white text-xs">
                        {formatFullDate(selectedConversation.last_message_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 overflow-y-auto min-h-[600px] max-h-[calc(100vh-400px)] space-y-4">
                  {filteredMessages.map((msg) => {
                    const hasSpecialData = msg.metadata && (
                      msg.metadata.bookingTriggered ||
                      msg.metadata.vehicleOptions ||
                      msg.metadata.priceCalculated ||
                      msg.metadata.suggestions
                    );
                    const isLongMessage = msg.content.length > 500;
                    const isExpanded = expandedMessages.has(msg.id);
                    const displayContent = isLongMessage && !isExpanded
                      ? msg.content.substring(0, 500) + '...'
                      : msg.content;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`w-full max-w-[90%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {msg.role === 'user' ? (
                              <User className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Bot className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {msg.role === 'user' ? 'Customer' : 'Assistant'}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {formatDate(msg.created_at)}
                            </span>
                            {msg.message_type && msg.message_type !== 'text' && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                                {msg.message_type}
                              </span>
                            )}
                            {hasSpecialData && (
                              <AlertCircle className="w-4 h-4 text-orange-500" title="Contains booking data" />
                            )}
                            {isLongMessage && (
                              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                                {msg.content.length} characters
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-4 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap break-words font-medium leading-relaxed">
                              {displayContent}
                            </div>

                            {isLongMessage && (
                              <button
                                onClick={() => toggleMessageExpansion(msg.id)}
                                className={`mt-2 text-xs font-semibold underline opacity-80 hover:opacity-100 transition-opacity ${
                                  msg.role === 'user' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {isExpanded ? '← Show Less' : 'Read More →'}
                              </button>
                            )}

                            {/* Show booking triggers prominently */}
                            {msg.metadata?.bookingTriggered && (
                              <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded text-xs">
                                <strong className="text-green-700 dark:text-green-300">✓ Booking Engine Triggered</strong>
                              </div>
                            )}

                            {msg.metadata?.vehicleOptions && (
                              <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs">
                                <strong className="text-blue-700 dark:text-blue-300">🚗 Vehicle Options Shown</strong>
                                <p className="mt-1 text-blue-600 dark:text-blue-400">
                                  {Array.isArray(msg.metadata.vehicleOptions) ?
                                    msg.metadata.vehicleOptions.length + ' vehicles' :
                                    'Multiple vehicles'}
                                </p>
                              </div>
                            )}

                            {msg.metadata?.priceCalculated && (
                              <div className="mt-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded text-xs">
                                <strong className="text-purple-700 dark:text-purple-300">💰 Price Calculated</strong>
                              </div>
                            )}

                            {msg.metadata?.suggestions && Array.isArray(msg.metadata.suggestions) && (
                              <div className="mt-2 p-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs">
                                <strong className="text-orange-700 dark:text-orange-300">💡 Suggestions Provided</strong>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {msg.metadata.suggestions.slice(0, 3).map((sugg: string, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                                      {sugg}
                                    </span>
                                  ))}
                                  {msg.metadata.suggestions.length > 3 && (
                                    <span className="text-orange-600 dark:text-orange-400">+{msg.metadata.suggestions.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100 font-semibold">
                                  View Raw Metadata
                                </summary>
                                <pre className="text-xs mt-1 opacity-70 overflow-x-auto bg-black/10 dark:bg-black/30 p-2 rounded">
                                  {JSON.stringify(msg.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredMessages.length === 0 && messageSearchQuery && (
                    <div className="text-center py-8 text-slate-500">
                      No messages found matching "{messageSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Select a Conversation
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Choose a conversation from the list to view the full transcript and see if the booking engine was triggered
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Green = Booking Created</span>
                </div>
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg ml-2">
                  <XCircle className="w-4 h-4 text-orange-500" />
                  <span>Orange = No Booking</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
