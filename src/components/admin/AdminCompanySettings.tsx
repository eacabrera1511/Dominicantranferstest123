import React, { useState, useEffect } from 'react';
import { Save, Building2, Mail, Phone, Globe, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CompanySettings {
  id: string;
  company_name: string;
  support_email: string;
  booking_email: string;
  support_phone: string;
  website_url: string;
  address: string;
}

export default function AdminCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load company settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: settings.company_name,
          support_email: settings.support_email,
          booking_email: settings.booking_email,
          support_phone: settings.support_phone,
          website_url: settings.website_url,
          address: settings.address,
        })
        .eq('id', settings.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">No company settings found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Company Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your company information that appears throughout the application and in customer emails.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <p
            className={
              message.type === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-500" />
            Company Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website URL
              </label>
              <input
                type="url"
                value={settings.website_url}
                onChange={(e) => handleChange('website_url', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-500" />
            Email Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Email address customers can use to contact support
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Booking Email
              </label>
              <input
                type="email"
                value={settings.booking_email}
                onChange={(e) => handleChange('booking_email', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Email address used as sender for booking confirmation emails
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-sky-500" />
            Contact Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Support Phone Number
            </label>
            <input
              type="tel"
              value={settings.support_phone}
              onChange={(e) => handleChange('support_phone', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="+31625584645"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Include country code (e.g., +31625584645)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={loadSettings}
            className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-200 mb-2">Important Notes</h3>
        <ul className="text-sm text-sky-800 dark:text-sky-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-sky-500 mt-1">•</span>
            <span>Changes to email addresses will affect all future booking confirmations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-500 mt-1">•</span>
            <span>The support phone number is displayed on customer-facing pages and emails</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-500 mt-1">•</span>
            <span>Make sure the booking email is verified in your email service provider (Resend)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
