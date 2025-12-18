import { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, ArrowUpRight, Clock, User,
  ChevronDown, X, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportAgent {
  id: string;
  name: string;
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
  created_at: string;
  updated_at: string;
  assigned_to: SupportAgent | null;
}

interface TicketListProps {
  currentAgent: SupportAgent;
  onViewTicket: (ticketId: string) => void;
  onCreateTicket: () => void;
}

export function TicketList({ currentAgent, onViewTicket, onCreateTicket }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [agents, setAgents] = useState<SupportAgent[]>([]);

  useEffect(() => {
    fetchTickets();
    fetchAgents();
  }, [statusFilter, priorityFilter, categoryFilter, assigneeFilter]);

  const fetchAgents = async () => {
    const { data } = await supabase.from('support_agents').select('id, name').order('name');
    if (data) setAgents(data);
  };

  const fetchTickets = async () => {
    setLoading(true);

    let query = supabase
      .from('support_tickets')
      .select('*, assigned_to:support_agents(id, name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    if (assigneeFilter === 'mine') {
      query = query.eq('assigned_to', currentAgent.id);
    } else if (assigneeFilter === 'unassigned') {
      query = query.is('assigned_to', null);
    } else if (assigneeFilter !== 'all') {
      query = query.eq('assigned_to', assigneeFilter);
    }

    const { data } = await query;

    if (data) {
      setTickets(data);
    }

    setLoading(false);
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.ticket_number.toLowerCase().includes(query) ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.customer_name?.toLowerCase().includes(query) ||
      ticket.customer_email?.toLowerCase().includes(query)
    );
  });

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

  const exportTickets = () => {
    const headers = ['Ticket #', 'Subject', 'Status', 'Priority', 'Category', 'Customer', 'Email', 'Assigned To', 'Created'];
    const rows = filteredTickets.map(t => [
      t.ticket_number,
      t.subject,
      t.status,
      t.priority,
      t.category,
      t.customer_name,
      t.customer_email,
      t.assigned_to?.name || 'Unassigned',
      new Date(t.created_at).toLocaleDateString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setAssigneeFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || assigneeFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">All Tickets</h1>
          <p className="text-gray-400 mt-1">{filteredTickets.length} tickets found</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportTickets}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onCreateTicket}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, subject, customer name or email..."
              className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              hasActiveFilters
                ? 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                {[statusFilter, priorityFilter, categoryFilter, assigneeFilter].filter(f => f !== 'all').length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="all">All Categories</option>
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="technical">Technical</option>
                <option value="complaint">Complaint</option>
                <option value="inquiry">Inquiry</option>
                <option value="partner">Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="all">All Agents</option>
                <option value="mine">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
          <p className="text-gray-400">No tickets found matching your criteria</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Ticket</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Subject</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Customer</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Priority</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Assigned</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Created</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onViewTicket(ticket.id)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="text-gray-400 text-sm font-mono">{ticket.ticket_number}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-medium truncate max-w-xs">{ticket.subject}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{ticket.category}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white text-sm">{ticket.customer_name || '-'}</p>
                      <p className="text-gray-500 text-xs">{ticket.customer_email || '-'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {ticket.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-teal-400" />
                          </div>
                          <span className="text-gray-300 text-sm">{ticket.assigned_to.name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ArrowUpRight className="w-4 h-4 text-gray-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
