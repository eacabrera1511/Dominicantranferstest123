import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, Mail, Calendar, Star, Truck, Shield } from 'lucide-react';

interface DriverProfileProps {
  driver: any;
  onUpdate: () => void;
}

export default function DriverProfile({ driver, onUpdate }: DriverProfileProps) {
  const [updating, setUpdating] = useState(false);

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { error } = await supabase
            .from('drivers')
            .update({
              current_location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString(),
              },
            })
            .eq('id', driver.id);

          if (error) throw error;

          alert('Location updated successfully');
          onUpdate();
        } catch (error) {
          console.error('Error updating location:', error);
          alert('Failed to update location');
        } finally {
          setUpdating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Failed to get your location');
        setUpdating(false);
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Profile</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              {driver.photo_url ? (
                <img
                  src={driver.photo_url}
                  alt={`${driver.first_name} ${driver.last_name}`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {driver.first_name} {driver.last_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{driver.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {driver.rating.toFixed(1)} Rating
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({driver.total_trips} trips)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Personal Information</h4>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{driver.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{driver.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Hire Date</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(driver.hire_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Date of Birth</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(driver.date_of_birth)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">License & Credentials</h4>

              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">License Number</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{driver.license_number}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">License Expiry</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(driver.license_expiry)}
                  </p>
                </div>
              </div>

              {driver.license_class && (
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">License Class</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{driver.license_class}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Background Check</p>
                  <p className={`text-sm ${
                    driver.background_check_status === 'approved'
                      ? 'text-green-600 dark:text-green-400'
                      : driver.background_check_status === 'pending'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {driver.background_check_status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {driver.emergency_contact_name && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Name</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {driver.emergency_contact_name}
                  </p>
                </div>
                {driver.emergency_contact_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {driver.emergency_contact_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {driver.languages && driver.languages.length > 0 && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {driver.languages.map((lang: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={updateLocation}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Updating Location...</span>
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  <span>Update My Location</span>
                </>
              )}
            </button>
          </div>

          {driver.notes && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{driver.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
