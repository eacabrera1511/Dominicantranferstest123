import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, Truck, LogOut, DollarSign, Settings } from 'lucide-react';
import AgentLogin from './AgentLogin';
import AgentDashboard from './AgentDashboard';
import BookingManagement from './BookingManagement';
import DispatchBoard from './DispatchBoard';

type TabType = 'dashboard' | 'bookings' | 'dispatch' | 'customers';

export default function AgentPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentEmail, setAgentEmail] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleLogin = (email: string) => {
    setAgentEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAgentEmail('');
    setActiveTab('dashboard');
  };

  if (!isLoggedIn) {
    return <AgentLogin onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'dispatch' as TabType, label: 'Dispatch', icon: Truck },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agent Portal</h1>
                <p className="text-xs text-gray-500">Transportation CRM</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{agentEmail}</p>
                <p className="text-xs text-gray-500">Dispatch Agent</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <AgentDashboard />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'dispatch' && <DispatchBoard />}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h2>
            <p className="text-gray-600">Customer CRM interface coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
