import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, Menu, X } from 'lucide-react';
import DriverDashboard from './DriverDashboard';
import DriverAssignments from './DriverAssignments';
import DriverProfile from './DriverProfile';
import ActiveTrip from './ActiveTrip';

interface DriverPortalProps {
  onLogout: () => void;
}

export default function DriverPortal({ onLogout }: DriverPortalProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'assignments' | 'active-trip' | 'profile'>('dashboard');
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);

  useEffect(() => {
    loadDriverData();
    subscribeToAssignments();
  }, []);

  const loadDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onLogout();
        return;
      }

      const { data: driverData, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !driverData) {
        alert('Driver account not found');
        onLogout();
        return;
      }

      setDriver(driverData);

      const { data: activeAssignmentData } = await supabase
        .from('trip_assignments')
        .select(`
          *,
          booking:bookings(*),
          vehicle:vehicles(*)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress'])
        .maybeSingle();

      if (activeAssignmentData) {
        setActiveAssignment(activeAssignmentData);
        setCurrentView('active-trip');
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAssignments = () => {
    const subscription = supabase
      .channel('driver_assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_assignments',
          filter: `driver_id=eq.${driver?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadDriverData();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Driver Portal
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('assignments')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'assignments'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Assignments
              </button>
              {activeAssignment && (
                <button
                  onClick={() => setCurrentView('active-trip')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 animate-pulse"
                >
                  Active Trip
                </button>
              )}
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'profile'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Profile
              </button>
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {driver?.first_name} {driver?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {driver?.status === 'active' ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-yellow-600">{driver?.status}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentView('assignments');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Assignments
              </button>
              {activeAssignment && (
                <button
                  onClick={() => {
                    setCurrentView('active-trip');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                >
                  Active Trip
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentView('profile');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <DriverDashboard driver={driver} />}
        {currentView === 'assignments' && <DriverAssignments driver={driver} />}
        {currentView === 'active-trip' && activeAssignment && (
          <ActiveTrip assignment={activeAssignment} driver={driver} onComplete={loadDriverData} />
        )}
        {currentView === 'profile' && <DriverProfile driver={driver} onUpdate={loadDriverData} />}
      </main>
    </div>
  );
}
