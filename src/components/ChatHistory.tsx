import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Trash2, Plus, X } from 'lucide-react';
import { supabase, Conversation } from '../lib/supabase';

interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const getDeviceId = (): string => {
  const storageKey = 'dominican_transfers_device_id';
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
};

export { getDeviceId };

export function ChatHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose,
  deviceId
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, deviceId]);

  const loadConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false });

    if (data && !error) {
      setConversations(data);
    }
    setLoading(false);
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        onNewConversation();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col h-full">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chat History</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start chatting to see your history here</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
                className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentConversationId === conversation.id
                    ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700'
                    : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm line-clamp-1 mb-1 ${
                      currentConversationId === conversation.id
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {conversation.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(conversation.updated_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center text-red-500 dark:text-red-400 transition-all duration-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>
  );
}