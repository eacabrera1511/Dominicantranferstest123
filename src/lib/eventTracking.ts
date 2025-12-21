import { supabase } from './supabase';

interface TrackEventParams {
  eventName: string;
  eventCategory: string;
  eventValue?: number;
  metadata?: Record<string, any>;
}

let sessionId: string | null = null;
let deviceId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
  }
  return sessionId;
}

function getDeviceId(): string {
  if (!deviceId) {
    deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
  }
  return deviceId;
}

function getUTMParams(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || sessionStorage.getItem('utm_source'),
    utm_medium: params.get('utm_medium') || sessionStorage.getItem('utm_medium'),
    utm_campaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign'),
    utm_term: params.get('utm_term') || sessionStorage.getItem('utm_term'),
    utm_content: params.get('utm_content') || sessionStorage.getItem('utm_content'),
    gclid: params.get('gclid') || sessionStorage.getItem('gclid')
  };
}

function saveUTMParams() {
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'].forEach(param => {
    const value = params.get(param);
    if (value) {
      sessionStorage.setItem(param, value);
    }
  });
}

saveUTMParams();

export async function trackEvent({ eventName, eventCategory, eventValue, metadata }: TrackEventParams) {
  try {
    const utmParams = getUTMParams();

    const eventData = {
      event_name: eventName,
      event_category: eventCategory,
      event_value: eventValue || null,
      session_id: getSessionId(),
      device_id: getDeviceId(),
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      gclid: utmParams.gclid,
      metadata: metadata || null
    };

    await supabase.from('user_events').insert(eventData);

    console.log(`📊 Event tracked: ${eventName}`, eventData);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

export async function trackPageView(isLanding = false) {
  try {
    const utmParams = getUTMParams();

    const pageViewData = {
      session_id: getSessionId(),
      visitor_session_id: getSessionId(),
      device_id: getDeviceId(),
      page_url: window.location.href,
      page_title: document.title,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      is_landing_page: isLanding,
      user_agent: navigator.userAgent,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      gclid: utmParams.gclid,
      viewed_at: new Date().toISOString()
    };

    await supabase.from('page_views').insert(pageViewData);

    await updateActiveSession();

    console.log('📄 Page view tracked:', pageViewData);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

export async function updateActiveSession() {
  try {
    const utmParams = getUTMParams();

    const sessionData = {
      session_id: getSessionId(),
      device_id: getDeviceId(),
      current_page_url: window.location.href,
      current_page_title: document.title,
      last_active_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      gclid: utmParams.gclid
    };

    const { data: existing } = await supabase
      .from('active_sessions')
      .select('id, page_views_count')
      .eq('session_id', getSessionId())
      .maybeSingle();

    if (existing) {
      await supabase
        .from('active_sessions')
        .update({
          current_page_url: sessionData.current_page_url,
          current_page_title: sessionData.current_page_title,
          last_active_at: sessionData.last_active_at,
          page_views_count: (existing.page_views_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', getSessionId());
    } else {
      await supabase.from('active_sessions').insert({
        ...sessionData,
        landing_page: window.location.href,
        started_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating active session:', error);
  }
}

export async function trackConversionEvent(type: string, value: number, bookingReference: string, bookingId?: string) {
  try {
    const utmParams = getUTMParams();

    const conversionData = {
      conversion_type: type,
      conversion_value: value,
      currency: 'USD',
      transaction_id: bookingReference,
      booking_id: bookingId || null,
      booking_reference: bookingReference,
      session_id: getSessionId(),
      device_id: getDeviceId(),
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      google_ads_account: 'AW-17810479345',
      sent_to_google: type === 'purchase',
      payment_confirmed: true,
      payment_confirmed_at: new Date().toISOString(),
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      gclid: utmParams.gclid
    };

    await supabase.from('conversion_events').insert(conversionData);

    console.log(`💰 Conversion tracked: ${type}`, conversionData);
  } catch (error) {
    console.error('Error tracking conversion event:', error);
  }
}

export function initializeTracking() {
  const isNewSession = !sessionStorage.getItem('session_started');

  if (isNewSession) {
    sessionStorage.setItem('session_started', 'true');
    trackPageView(true);
  } else {
    trackPageView(false);
  }

  setInterval(() => {
    updateActiveSession();
  }, 30000);

  window.addEventListener('beforeunload', () => {
    updateActiveSession();
  });
}

export { getSessionId, getDeviceId };
