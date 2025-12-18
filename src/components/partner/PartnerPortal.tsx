import { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Calendar, Settings, LogOut, Menu, X, ChevronRight, Receipt, Zap, Package, Mail, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PartnerDashboard } from './PartnerDashboard';
import { PartnerListings } from './PartnerListings';
import { PartnerBookings } from './PartnerBookings';
import { PartnerSettings } from './PartnerSettings';
import { PartnerLogin } from './PartnerLogin';
import { PartnerAccounting } from './PartnerAccounting';
import { PartnerAPIIntegrations } from './PartnerAPIIntegrations';
import { PartnerAvailability } from './PartnerAvailability';
import { PartnerMessages } from './PartnerMessages';
import { PartnerCredentials } from './PartnerCredentials';

export interface Partner {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  description: string;
  logo_url: string;
  status: string;
  verified: boolean;
  commission_rate: number;
  city: string;
  country: string;
  created_at: string;
}

interface PartnerPortalProps {
  onExit: () => void;
}

type TabType = 'dashboard' | 'listings' | 'bookings' | 'messages' | 'availability' | 'integrations' | 'accounting' | 'credentials' | 'settings';

export function PartnerPortal({ onExit }: PartnerPortalProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedPartner = localStorage.getItem('partner_session');
    if (savedPartner) {
      setPartner(JSON.parse(savedPartner));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (data && !error) {
      setPartner(data);
      localStorage.setItem('partner_session', JSON.stringify(data));
    }
    setLoading(false);
    return { data, error };
  };

  const handleLogout = () => {
    setPartner(null);
    localStorage.removeItem('partner_session');
  };

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings' as TabType, label: 'Listings', icon: Building2 },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'messages' as TabType, label: 'Messages', icon: Mail },
    { id: 'availability' as TabType, label: 'Availability', icon: Package },
    { id: 'integrations' as TabType, label: 'Integrations', icon: Zap },
    { id: 'accounting' as TabType, label: 'Accounting', icon: Receipt },
    { id: 'credentials' as TabType, label: 'Credentials', icon: Shield },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return <PartnerLogin onLogin={handleLogin} onExit={onExit} />;
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
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">
              🏢
            </div>
            <span className="text-white font-semibold text-sm truncate max-w-[150px]">
              {partner.business_name}
            </span>
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
                {navItems.map((item, index) => (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all min-h-[44px] ${
                        activeTab === item.id
                          ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white active:scale-[0.98]'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-left">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                    {index < navItems.length - 1 && (
                      <div className="mx-3 my-1 h-px bg-white/5" />
                    )}
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/10" />

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all min-h-[44px] active:scale-[0.98]"
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">
              🏢
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-sm truncate">{partner.business_name}</h2>
              <p className="text-gray-400 text-xs truncate">{partner.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-2 pt-4 border-t border-white/10">
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
          {activeTab === 'dashboard' && <PartnerDashboard partner={partner} />}
          {activeTab === 'listings' && <PartnerListings partner={partner} />}
          {activeTab === 'bookings' && <PartnerBookings partner={partner} />}
          {activeTab === 'messages' && <PartnerMessages partner={partner} />}
          {activeTab === 'availability' && <PartnerAvailability partner={partner} />}
          {activeTab === 'integrations' && <PartnerAPIIntegrations partner={partner} />}
          {activeTab === 'accounting' && <PartnerAccounting partner={partner} />}
          {activeTab === 'credentials' && <PartnerCredentials partner={partner} />}
          {activeTab === 'settings' && <PartnerSettings partner={partner} onUpdate={setPartner} />}
        </main>
      </div>

      <div className="lg:hidden pt-16 p-3 xs:p-4">
        {activeTab === 'dashboard' && <PartnerDashboard partner={partner} />}
        {activeTab === 'listings' && <PartnerListings partner={partner} />}
        {activeTab === 'bookings' && <PartnerBookings partner={partner} />}
        {activeTab === 'messages' && <PartnerMessages partner={partner} />}
        {activeTab === 'availability' && <PartnerAvailability partner={partner} />}
        {activeTab === 'integrations' && <PartnerAPIIntegrations partner={partner} />}
        {activeTab === 'accounting' && <PartnerAccounting partner={partner} />}
        {activeTab === 'credentials' && <PartnerCredentials partner={partner} />}
        {activeTab === 'settings' && <PartnerSettings partner={partner} onUpdate={setPartner} />}
      </div>
    </div>
  );
}
