import { useState, useEffect } from 'react';
import {
  LayoutDashboard, DollarSign, LogOut,
  Menu, X, ChevronRight, Shield, Users, Car, UserCog, Calendar,
  UsersIcon, MapPin, Navigation, Instagram, MessageSquare, AlertTriangle
} from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { AdminOverview } from './AdminOverview';
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

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminDashboardProps {
  onExit: () => void;
}

type TabType = 'overview' | 'bookings' | 'dispatch' | 'fleet' | 'drivers' | 'customers' | 'pricing' | 'financials' | 'reels' | 'chat' | 'troubleshooting';

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

  const navItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'dispatch' as TabType, label: 'Live Dispatch', icon: Navigation },
    { id: 'fleet' as TabType, label: 'Fleet', icon: Car },
    { id: 'drivers' as TabType, label: 'Drivers', icon: UserCog },
    { id: 'customers' as TabType, label: 'Customers', icon: UsersIcon },
    { id: 'chat' as TabType, label: 'Chat Transcripts', icon: MessageSquare },
    { id: 'pricing' as TabType, label: 'Pricing', icon: MapPin },
    { id: 'financials' as TabType, label: 'Financials', icon: DollarSign },
    { id: 'reels' as TabType, label: 'Gallery', icon: Instagram },
    { id: 'troubleshooting' as TabType, label: 'Troubleshooting', icon: AlertTriangle },
  ];

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
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="p-2">
                {navItems.map((item) => (
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
              <div className="border-t border-white/10 p-2">
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
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm">Admin Dashboard</h2>
              <p className="text-gray-400 text-xs truncate">{admin.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10 space-y-2">
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
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'bookings' && <AdminBookings />}
          {activeTab === 'dispatch' && <AdminDispatch />}
          {activeTab === 'fleet' && <AdminFleet />}
          {activeTab === 'drivers' && <AdminDrivers />}
          {activeTab === 'customers' && <AdminCustomers />}
          {activeTab === 'chat' && <AdminChatTranscripts />}
          {activeTab === 'pricing' && <AdminPricing />}
          {activeTab === 'financials' && <AdminFinancials />}
          {activeTab === 'reels' && <AdminGallery />}
          {activeTab === 'troubleshooting' && <AdminTroubleshooting />}
        </main>
      </div>

      <div className="lg:hidden pt-16 p-4">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'bookings' && <AdminBookings />}
        {activeTab === 'dispatch' && <AdminDispatch />}
        {activeTab === 'fleet' && <AdminFleet />}
        {activeTab === 'drivers' && <AdminDrivers />}
        {activeTab === 'customers' && <AdminCustomers />}
        {activeTab === 'chat' && <AdminChatTranscripts />}
        {activeTab === 'pricing' && <AdminPricing />}
        {activeTab === 'financials' && <AdminFinancials />}
        {activeTab === 'reels' && <AdminGallery />}
        {activeTab === 'troubleshooting' && <AdminTroubleshooting />}
      </div>
    </div>
  );
}
