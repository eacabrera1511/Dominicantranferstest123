import { supabase } from './supabase';

export interface CompanySettings {
  id: string;
  company_name: string;
  support_email: string;
  booking_email: string;
  support_phone: string;
  website_url: string;
  address: string;
}

let cachedSettings: CompanySettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCompanySettings(): Promise<CompanySettings> {
  const now = Date.now();

  if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching company settings:', error);
      return getDefaultSettings();
    }

    if (!data) {
      return getDefaultSettings();
    }

    cachedSettings = data;
    cacheTime = now;

    return data;
  } catch (error) {
    console.error('Exception fetching company settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings(): CompanySettings {
  return {
    id: '',
    company_name: 'Dominican Transfers',
    support_email: 'support@dominicantransfers.com',
    booking_email: 'Booking@dominicantransfers.com',
    support_phone: '+31625584645',
    website_url: 'https://dominicantransfers.com',
    address: 'Dominican Republic',
  };
}

export function clearSettingsCache(): void {
  cachedSettings = null;
  cacheTime = 0;
}
