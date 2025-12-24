import { useState, useEffect } from 'react';
import {
  LayoutDashboard, DollarSign, LogOut,
  Menu, X, ChevronRight, Shield, Users, Car, UserCog, Calendar,
  UsersIcon, MapPin, Navigation, Instagram, MessageSquare, AlertTriangle, Settings, Database, Search, Eye
} from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { AdminOverview } from './AdminOverview';
import AdminConversionAudit from './AdminConversionAudit';
import LiveVisitors from './LiveVisitors';
import { AdminFinancials } from './AdminFinancials';
import { AdminFleet } from './AdminFleet';
import { AdminDrivers } from './AdminDrivers';
import { AdminBookings } from './AdminBookings';
import { AdminCustomers } from './AdminCustomers';
import { AdminPricing } from './AdminPricing';
import { AdminDispatch } from './AdminDispatch';
import { AdminGallery } from './AdminGallery';
import { AdminChatTranscripts } from './AdminChatTranscripts';
import AdminTroubleshooting from './AdminTroubleshooting';
import AdminCompanySettings from './AdminCompanySettings';
import { AdminRAGKnowledgeBase } from './AdminRAGKnowledgeBase';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminDashboardProps {
  onExit: () => void;
}

type TabType = 'overview' | 'live' | 'conversions' | 'bookings' | 'dispatch' | 'fleet' | 'drivers' | 'customers' | 'pricing' | 'financials' | 'reels' | 'chat' | 'troubleshooting' | 'settings' | 'rag';

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin_session');
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    setLoading(false);
  }, []);

  const handleLogin = (adminUser: AdminUser) => {
    setAdmin(adminUser);
    localStorage.setItem('admin_session', JSON.stringify(adminUser));
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_session');
  };

  const navGroups = [
    {
      title: 'Analytics',
      items: [
        { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
        { id: 'live' as TabType, label: 'Live Visitors', icon: Eye },
        { id: 'conversions' as TabType, label: 'Conversion Audit', icon: Search },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
        { id: 'dispatch' as TabType, label: 'Live Dispatch', icon: Navigation },
        { id: 'chat' as TabType, label: 'Chat Transcripts', icon: MessageSquare },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'fleet' as TabType, label: 'Fleet', icon: Car },
        { id: 'drivers' as TabType, label: 'Drivers', icon: UserCog },
        { id: 'customers' as TabType, label: 'Customers', icon: UsersIcon },
        { id: 'pricing' as TabType, label: 'Pricing', icon: MapPin },
        { id: 'financials' as TabType, label: 'Financials', icon: DollarSign },
      ]
    },
    {
      title: 'Content',
      items: [
        { id: 'reels' as TabType, label: 'Gallery', icon: Instagram },
        { id: 'rag' as TabType, label: 'Knowledge Base', icon: Database },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings' as TabType, label: 'Settings', icon: Settings },
        { id: 'troubleshooting' as TabType, label: 'Troubleshooting', icon: AlertTriangle },
      ]
    }
  ];

  const allNavItems = navGroups.flatMap(group => group.items);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin onLogin={handleLogin} onExit={onExit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-3 xs:p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm truncate max-w-[150px]">Admin Portal</span>
          </div>
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[calc(100vh-120px)]">
              <div className="overflow-y-auto max-h-[calc(100vh-200px)] overscroll-contain">
                <div className="p-2 space-y-4">
                  {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {group.title}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all min-h-[44px] ${
                              activeTab === item.id
                                ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white active:scale-[0.98]'
                            }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-left">{item.label}</span>
                            {activeTab === item.id && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 p-2 bg-slate-900/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all min-h-[44px] active:scale-[0.98]"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-left">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:flex">
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
          <div className="flex items-center gap-3 p-6 pb-4 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm">Admin Dashboard</h2>
              <p className="text-gray-400 text-xs truncate">{admin.email}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
            <div className="space-y-6">
              {navGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                          activeTab === item.id
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="flex-shrink-0 p-3 pt-4 border-t border-white/10 space-y-2 bg-slate-900/30">
            <div className="px-4 py-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{admin.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{admin.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onExit}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Back to Main</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 overflow-y-auto h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'live' && <LiveVisitors />}
            {activeTab === 'conversions' && <AdminConversionAudit />}
            {activeTab === 'bookings' && <AdminBookings />}
            {activeTab === 'dispatch' && <AdminDispatch />}
            {activeTab === 'fleet' && <AdminFleet />}
            {activeTab === 'drivers' && <AdminDrivers />}
            {activeTab === 'customers' && <AdminCustomers />}
            {activeTab === 'chat' && <AdminChatTranscripts />}
            {activeTab === 'rag' && <AdminRAGKnowledgeBase />}
            {activeTab === 'pricing' && <AdminPricing />}
            {activeTab === 'financials' && <AdminFinancials />}
            {activeTab === 'reels' && <AdminGallery />}
            {activeTab === 'settings' && <AdminCompanySettings />}
            {activeTab === 'troubleshooting' && <AdminTroubleshooting />}
          </div>
        </main>
      </div>

      <div className="lg:hidden min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto pt-16 pb-4 px-3 sm:px-4">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'live' && <LiveVisitors />}
          {activeTab === 'conversions' && <AdminConversionAudit />}
          {activeTab === 'bookings' && <AdminBookings />}
          {activeTab === 'dispatch' && <AdminDispatch />}
          {activeTab === 'fleet' && <AdminFleet />}
          {activeTab === 'drivers' && <AdminDrivers />}
          {activeTab === 'customers' && <AdminCustomers />}
          {activeTab === 'chat' && <AdminChatTranscripts />}
          {activeTab === 'rag' && <AdminRAGKnowledgeBase />}
          {activeTab === 'pricing' && <AdminPricing />}
          {activeTab === 'financials' && <AdminFinancials />}
          {activeTab === 'reels' && <AdminGallery />}
          {activeTab === 'settings' && <AdminCompanySettings />}
          {activeTab === 'troubleshooting' && <AdminTroubleshooting />}
        </div>
      </div>
    </div>
  );
}
