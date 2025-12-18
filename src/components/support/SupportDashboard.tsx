import { useState, useEffect } from 'react';
import {
  Ticket, Clock, CheckCircle, AlertTriangle, Users,
  TrendingUp, MessageSquare, Calendar, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportAgent {
  id: string;
  name: string;
}

interface DashboardStats {
  totalOpen: number;
  totalInProgress: number;
  totalPending: number;
  totalResolved: number;
  urgentCount: number;
  avgResponseTime: number;
  resolvedToday: number;
  pendingFollowUps: number;
}

interface RecentTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer_name: string;
  created_at: string;
  assigned_to: SupportAgent | null;
}

interface SupportDashboardProps {
  agent: SupportAgent;
  onViewTicket: (ticketId: string) => void;
}

export function SupportDashboard({ agent, onViewTicket }: SupportDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalOpen: 0,
    totalInProgress: 0,
    totalPending: 0,
    totalResolved: 0,
    urgentCount: 0,
    avgResponseTime: 0,
    resolvedToday: 0,
    pendingFollowUps: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [myTickets, setMyTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [agent.id]);

  const fetchDashboardData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openRes, inProgressRes, pendingRes, resolvedRes, urgentRes, recentRes, myRes, followUpsRes, resolvedTodayRes] = await Promise.all([
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'in_progress'),
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'resolved'),
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('priority', 'urgent').neq('status', 'resolved').neq('status', 'closed'),
      supabase.from('support_tickets').select('*, assigned_to:support_agents(id, name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('support_tickets').select('*, assigned_to:support_agents(id, name)').eq('assigned_to', agent.id).neq('status', 'resolved').neq('status', 'closed').order('created_at', { ascending: false }).limit(5),
      supabase.from('ticket_follow_ups').select('id', { count: 'exact' }).eq('status', 'pending').eq('agent_id', agent.id),
      supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
    ]);

    setStats({
      totalOpen: openRes.count || 0,
      totalInProgress: inProgressRes.count || 0,
      totalPending: pendingRes.count || 0,
      totalResolved: resolvedRes.count || 0,
      urgentCount: urgentRes.count || 0,
      avgResponseTime: 2.5,
      resolvedToday: resolvedTodayRes.count || 0,
      pendingFollowUps: followUpsRes.count || 0,
    });

    if (recentRes.data) setRecentTickets(recentRes.data);
    if (myRes.data) setMyTickets(myRes.data);

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {agent.name.split(' ')[0]}</h1>
        <p className="text-gray-400 mt-1">Here's your support overview for today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Ticket className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Open Tickets</p>
          <p className="text-2xl font-bold text-white">{stats.totalOpen}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">In Progress</p>
          <p className="text-2xl font-bold text-white">{stats.totalInProgress}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Urgent</p>
          <p className="text-2xl font-bold text-red-400">{stats.urgentCount}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Resolved Today</p>
          <p className="text-2xl font-bold text-green-400">{stats.resolvedToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              My Tickets
            </h2>
            <span className="text-gray-400 text-sm">{myTickets.length} active</span>
          </div>

          {myTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tickets assigned to you</p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => onViewTicket(ticket.id)}
                  className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-400 text-xs font-mono">{ticket.ticket_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-white font-medium truncate">{ticket.subject}</p>
                      <p className="text-gray-400 text-sm">{ticket.customer_name}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Recent Tickets
            </h2>
          </div>

          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onViewTicket(ticket.id)}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 text-xs font-mono">{ticket.ticket_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-white font-medium truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{ticket.customer_name}</span>
                      {ticket.assigned_to && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-500">{ticket.assigned_to.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-500/20">
              <TrendingUp className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Response Time</p>
              <p className="text-xl font-bold text-white">{stats.avgResponseTime}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Tickets</p>
              <p className="text-xl font-bold text-white">{stats.totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Follow-ups</p>
              <p className="text-xl font-bold text-white">{stats.pendingFollowUps}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
