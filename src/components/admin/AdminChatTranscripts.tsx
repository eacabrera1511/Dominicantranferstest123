import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Calendar, Search, Eye, ExternalLink, Filter, Trash2 } from 'lucide-react';
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

export function AdminChatTranscripts() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookingStatus, setFilterBookingStatus] = useState<'all' | 'with_booking' | 'no_booking'>('all');

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

      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: conv.chat_messages?.[0]?.count || 0
      })) || [];

      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
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
    loadMessages(conversation.id);
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

  function getLanguageFlag(lang: string) {
    const flags: Record<string, string> = {
      en: '🇬🇧',
      es: '🇪🇸',
      nl: '🇳🇱',
      de: '🇩🇪'
    };
    return flags[lang] || '🌐';
  }

  const filteredConversations = conversations.filter(conv =>
    conv.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Chat Transcripts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View all customer conversations and chat history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
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
                        selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {conv.device_id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-lg">{getLanguageFlag(conv.language)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(conv.last_message_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          {conv.booking_created && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                              Booked
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {conv.message_count || 0} msgs
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Conversation Details
                    </h2>
                    <div className="flex items-center gap-2">
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

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Device ID:</span>
                      <p className="font-mono text-xs text-slate-900 dark:text-white">
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
                      <p className="text-slate-900 dark:text-white">
                        {formatDate(selectedConversation.started_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Last Message:</span>
                      <p className="text-slate-900 dark:text-white">
                        {formatDate(selectedConversation.last_message_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(100vh-350px)] space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Bot className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {msg.role === 'user' ? 'Customer' : 'Assistant'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(msg.created_at)}
                          </span>
                          {msg.message_type !== 'text' && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                              {msg.message_type}
                            </span>
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                                Metadata
                              </summary>
                              <pre className="text-xs mt-1 opacity-70 overflow-x-auto">
                                {JSON.stringify(msg.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Select a Conversation
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Choose a conversation from the list to view its full transcript
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
