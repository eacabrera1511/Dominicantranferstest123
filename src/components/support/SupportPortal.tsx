import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Ticket, Calendar, LogOut, Menu, X,
  ChevronRight, Headphones, User, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SupportLogin } from './SupportLogin';
import { SupportDashboard } from './SupportDashboard';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { CreateTicket } from './CreateTicket';

interface SupportAgent {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

interface SupportPortalProps {
  onExit: () => void;
}

type ViewType = 'dashboard' | 'tickets' | 'ticket-detail' | 'create-ticket' | 'follow-ups';

export function SupportPortal({ onExit }: SupportPortalProps) {
  const [agent, setAgent] = useState<SupportAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);

  useEffect(() => {
    const savedAgent = localStorage.getItem('support_session');
    if (savedAgent) {
      setAgent(JSON.parse(savedAgent));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (agent) {
      fetchFollowUps();
    }
  }, [agent]);

  const fetchFollowUps = async () => {
    if (!agent) return;

    const { data } = await supabase
      .from('ticket_follow_ups')
      .select('*, ticket:support_tickets(id, ticket_number, subject, customer_name)')
      .eq('agent_id', agent.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (data) setFollowUps(data);
  };

  const handleLogin = (agentData: SupportAgent) => {
    setAgent(agentData);
    localStorage.setItem('support_session', JSON.stringify(agentData));
  };

  const handleLogout = async () => {
    if (agent) {
      await supabase
        .from('support_agents')
        .update({ status: 'offline' })
        .eq('id', agent.id);
    }
    setAgent(null);
    localStorage.removeItem('support_session');
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveView('ticket-detail');
    setMobileMenuOpen(false);
  };

  const handleCreateTicket = () => {
    setActiveView('create-ticket');
    setMobileMenuOpen(false);
  };

  const handleTicketCreated = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveView('ticket-detail');
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setActiveView('tickets');
  };

  const exportPerformanceReport = async () => {
    if (!agent) return;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [ticketsRes, resolvedRes] = await Promise.all([
      supabase.from('support_tickets').select('*').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('support_tickets').select('*').eq('status', 'resolved').gte('resolved_at', thirtyDaysAgo.toISOString()),
    ]);

    const totalTickets = ticketsRes.data?.length || 0;
    const resolvedTickets = resolvedRes.data?.length || 0;

    const report = [
      'Support Performance Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Agent: ${agent.name}`,
      '',
      'Summary (Last 30 Days)',
      `Total Tickets Created: ${totalTickets}`,
      `Tickets Resolved: ${resolvedTickets}`,
      `Resolution Rate: ${totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0}%`,
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets' as ViewType, label: 'All Tickets', icon: Ticket },
    { id: 'follow-ups' as ViewType, label: 'Follow-ups', icon: Calendar, badge: followUps.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return <SupportLogin onLogin={handleLogin} onExit={onExit} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <SupportDashboard agent={agent} onViewTicket={handleViewTicket} />;
      case 'tickets':
        return (
          <TicketList
            currentAgent={agent}
            onViewTicket={handleViewTicket}
            onCreateTicket={handleCreateTicket}
          />
        );
      case 'ticket-detail':
        return selectedTicketId ? (
          <TicketDetail
            ticketId={selectedTicketId}
            currentAgent={agent}
            onBack={handleBackToList}
          />
        ) : null;
      case 'create-ticket':
        return (
          <CreateTicket
            currentAgent={agent}
            onBack={() => setActiveView('tickets')}
            onCreated={handleTicketCreated}
          />
        );
      case 'follow-ups':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">My Follow-ups</h1>
              <p className="text-gray-400 mt-1">Pending follow-ups assigned to you</p>
            </div>

            {followUps.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending follow-ups</p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 divide-y divide-white/10">
                {followUps.map((followUp) => (
                  <button
                    key={followUp.id}
                    onClick={() => handleViewTicket(followUp.ticket.id)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 text-xs font-mono">
                            {followUp.ticket.ticket_number}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            new Date(followUp.due_date) < new Date()
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {new Date(followUp.due_date) < new Date() ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-white font-medium">{followUp.ticket.subject}</p>
                        <p className="text-gray-400 text-sm">{followUp.ticket.customer_name}</p>
                        {followUp.note && (
                          <p className="text-gray-500 text-sm mt-2">{followUp.note}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-sm">
                          {new Date(followUp.due_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(followUp.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Support</span>
          </div>
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-b border-white/10 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>

      <div className="hidden lg:flex">
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm">Support Portal</h2>
              <p className="text-gray-400 text-xs truncate">{agent.department.replace('_', ' ')}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id || (activeView === 'ticket-detail' && item.id === 'tickets') || (activeView === 'create-ticket' && item.id === 'tickets')
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="px-4 py-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{agent.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportPerformanceReport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export Report</span>
            </button>
            <button
              onClick={onExit}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="font-medium">Back to Main</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-6">
          {renderView()}
        </main>
      </div>

      <div className="lg:hidden pt-16 p-4">
        {renderView()}
      </div>
    </div>
  );
}
