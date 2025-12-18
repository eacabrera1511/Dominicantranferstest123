import { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Mail, Phone, Clock, Tag, Send,
  MessageSquare, FileText, PhoneCall, Calendar, Plus,
  CheckCircle, AlertTriangle, Edit2, Save, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportAgent {
  id: string;
  name: string;
  email?: string;
}

interface Communication {
  id: string;
  type: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  agent: SupportAgent | null;
}

interface FollowUp {
  id: string;
  due_date: string;
  note: string;
  status: string;
  agent: SupportAgent | null;
}

interface TicketTag {
  id: string;
  tag: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  source: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  updated_at: string;
  first_response_at: string;
  resolved_at: string;
  assigned_to: SupportAgent | null;
  created_by: SupportAgent | null;
}

interface TicketDetailProps {
  ticketId: string;
  currentAgent: SupportAgent;
  onBack: () => void;
}

export function TicketDetail({ ticketId, currentAgent, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [tags, setTags] = useState<TicketTag[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<string>('note');
  const [isInternal, setIsInternal] = useState(true);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);

  useEffect(() => {
    fetchTicketData();
    fetchAgents();
  }, [ticketId]);

  const fetchAgents = async () => {
    const { data } = await supabase.from('support_agents').select('id, name, email').order('name');
    if (data) setAgents(data);
  };

  const fetchTicketData = async () => {
    setLoading(true);

    const [ticketRes, commsRes, followUpsRes, tagsRes] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('*, assigned_to:support_agents!support_tickets_assigned_to_fkey(id, name, email), created_by:support_agents!support_tickets_created_by_fkey(id, name)')
        .eq('id', ticketId)
        .single(),
      supabase
        .from('ticket_communications')
        .select('*, agent:support_agents(id, name)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
      supabase
        .from('ticket_follow_ups')
        .select('*, agent:support_agents(id, name)')
        .eq('ticket_id', ticketId)
        .order('due_date', { ascending: true }),
      supabase
        .from('ticket_tags')
        .select('*')
        .eq('ticket_id', ticketId),
    ]);

    if (ticketRes.data) setTicket(ticketRes.data);
    if (commsRes.data) setCommunications(commsRes.data);
    if (followUpsRes.data) setFollowUps(followUpsRes.data);
    if (tagsRes.data) setTags(tagsRes.data);

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase.from('ticket_communications').insert({
      ticket_id: ticketId,
      agent_id: currentAgent.id,
      type: messageType,
      content: newMessage,
      is_internal: isInternal,
    });

    if (!ticket?.first_response_at && !isInternal) {
      await supabase
        .from('support_tickets')
        .update({ first_response_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    } else {
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    }

    setNewMessage('');
    fetchTicketData();
  };

  const handleCreateFollowUp = async () => {
    if (!followUpDate) return;

    await supabase.from('ticket_follow_ups').insert({
      ticket_id: ticketId,
      agent_id: currentAgent.id,
      due_date: new Date(followUpDate).toISOString(),
      note: followUpNote,
      status: 'pending',
    });

    setFollowUpDate('');
    setFollowUpNote('');
    setShowFollowUpForm(false);
    fetchTicketData();
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    await supabase
      .from('ticket_follow_ups')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', followUpId);

    fetchTicketData();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const updates: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    await supabase.from('support_tickets').update(updates).eq('id', ticketId);

    setEditingStatus(false);
    fetchTicketData();
  };

  const handleUpdateAssignee = async (agentId: string | null) => {
    await supabase
      .from('support_tickets')
      .update({ assigned_to: agentId, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    setEditingAssignee(false);
    fetchTicketData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCommTypeIcon = (type: string) => {
    switch (type) {
      case 'email_in':
      case 'email_out':
        return <Mail className="w-4 h-4" />;
      case 'call_in':
      case 'call_out':
        return <PhoneCall className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{ticket.ticket_number}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{ticket.description || 'No description provided'}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Communication Log
              </h2>
              <span className="text-gray-400 text-sm">{communications.length} entries</span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-4 rounded-xl ${
                    comm.is_internal ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${comm.is_internal ? 'bg-amber-500/20' : 'bg-teal-500/20'}`}>
                      {getCommTypeIcon(comm.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">{comm.agent?.name || 'System'}</span>
                        <span className="text-gray-500 text-xs">
                          {comm.type.replace('_', ' ')}
                          {comm.is_internal && ' (Internal)'}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          {new Date(comm.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{comm.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="note">Note</option>
                  <option value="email_out">Email (Outbound)</option>
                  <option value="email_in">Email (Inbound)</option>
                  <option value="call_out">Call (Outbound)</option>
                  <option value="call_in">Call (Inbound)</option>
                  <option value="chat">Chat</option>
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50"
                  />
                  <span className="text-gray-400">Internal note</span>
                </label>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a note or log a communication..."
                  rows={3}
                  className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-white">{ticket.customer_name || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300 text-sm">{ticket.customer_email || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300 text-sm">{ticket.customer_phone || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Ticket Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Status</p>
                {editingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button onClick={() => setEditingStatus(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${getStatusColor(ticket.status)} hover:opacity-80 transition-opacity flex items-center gap-2`}
                  >
                    {ticket.status.replace('_', ' ')}
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Assigned To</p>
                {editingAssignee ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={ticket.assigned_to?.id || ''}
                      onChange={(e) => handleUpdateAssignee(e.target.value || null)}
                      className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    <button onClick={() => setEditingAssignee(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingAssignee(true)}
                    className="text-white text-sm flex items-center gap-2 hover:text-teal-400 transition-colors"
                  >
                    {ticket.assigned_to?.name || 'Unassigned'}
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Category</p>
                <p className="text-white text-sm capitalize">{ticket.category}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Source</p>
                <p className="text-white text-sm capitalize">{ticket.source.replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Created</p>
                <p className="text-white text-sm">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>

              {ticket.first_response_at && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">First Response</p>
                  <p className="text-white text-sm">{new Date(ticket.first_response_at).toLocaleString()}</p>
                </div>
              )}

              {tags.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Follow-ups
              </h2>
              <button
                onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showFollowUpForm && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 space-y-3">
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Follow-up note..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFollowUp}
                    disabled={!followUpDate}
                    className="flex-1 py-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 disabled:opacity-50 text-sm font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowFollowUpForm(false)}
                    className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {followUps.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No follow-ups scheduled</p>
              ) : (
                followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className={`p-3 rounded-xl ${
                      followUp.status === 'completed'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : new Date(followUp.due_date) < new Date()
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {new Date(followUp.due_date).toLocaleString()}
                        </p>
                        {followUp.note && (
                          <p className="text-gray-400 text-xs mt-1">{followUp.note}</p>
                        )}
                        {followUp.agent && (
                          <p className="text-gray-500 text-xs mt-1">{followUp.agent.name}</p>
                        )}
                      </div>
                      {followUp.status === 'pending' && (
                        <button
                          onClick={() => handleCompleteFollowUp(followUp.id)}
                          className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {followUp.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
