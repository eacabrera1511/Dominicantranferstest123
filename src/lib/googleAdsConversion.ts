/**
 * Google Ads Conversion Tracking Utility
 * Handles conversion tracking with duplicate prevention and proper transaction ID management
 */

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
    dataLayer?: any[];
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

const GOOGLE_ADS_ACCOUNT = 'AW-17810479345';
const CONVERSION_LABEL = 'RUZcCMvc7dYbEPGx2axC';
const CONVERSION_ID = `${GOOGLE_ADS_ACCOUNT}/${CONVERSION_LABEL}`;

const trackedConversions = new Set<string>();

interface ConversionOptions {
  value: number;
  currency?: 'EUR' | 'USD';
  transactionId: string;
  source?: 'chat' | 'checkout' | 'payment' | 'click';
  preventDuplicates?: boolean;
}

/**
 * Fire a Google Ads conversion event
 * @param options Conversion tracking options
 * @returns true if conversion was tracked, false if skipped (duplicate)
 */
export function fireGoogleAdsConversion(options: ConversionOptions): boolean {
  const {
    value,
    currency = 'EUR',
    transactionId,
    source = 'unknown',
    preventDuplicates = true
  } = options;

  // Check if gtag is loaded
  if (!window.gtag) {
    console.error('❌ Google Ads gtag not loaded - conversion not tracked');
    return false;
  }

  // Prevent duplicate conversions
  if (preventDuplicates && trackedConversions.has(transactionId)) {
    console.warn('⚠️ Duplicate conversion prevented:', {
      transactionId,
      source,
      previouslyTracked: true
    });
    return false;
  }

  // Mark as tracked
  if (preventDuplicates) {
    trackedConversions.add(transactionId);

    // Also store in sessionStorage to persist across page reloads
    const tracked = JSON.parse(sessionStorage.getItem('tracked_conversions') || '[]');
    if (!tracked.includes(transactionId)) {
      tracked.push(transactionId);
      sessionStorage.setItem('tracked_conversions', JSON.stringify(tracked));
    }
  }

  // Fire the conversion
  try {
    window.gtag('event', 'conversion', {
      'send_to': CONVERSION_ID,
      'value': value,
      'currency': currency,
      'transaction_id': transactionId
    });

    console.log('🎯 Google Ads Conversion Tracked:', {
      conversionId: CONVERSION_ID,
      value,
      currency,
      transactionId,
      source,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('❌ Error firing Google Ads conversion:', error);
    return false;
  }
}

/**
 * Fire a click conversion (when user clicks booking/payment button)
 * @param url Optional URL to navigate to after conversion
 * @returns false (to prevent default link behavior)
 */
export function fireClickConversion(url?: string): boolean {
  if (!window.gtag) {
    console.error('❌ Google Ads gtag not loaded');
    if (url) window.location.href = url;
    return false;
  }

  const callback = function () {
    if (typeof url !== 'undefined') {
      window.location.href = url;
    }
  };

  try {
    window.gtag('event', 'conversion', {
      'send_to': CONVERSION_ID,
      'value': 1.0,
      'currency': 'EUR',
      'event_callback': callback
    });

    console.log('🎯 Click Conversion Tracked:', {
      conversionId: CONVERSION_ID,
      url: url || 'button click',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error firing click conversion:', error);
    if (url) window.location.href = url;
  }

  return false;
}

/**
 * Check if a conversion has already been tracked for this transaction
 * @param transactionId The booking reference or transaction ID
 * @returns true if already tracked
 */
export function isConversionTracked(transactionId: string): boolean {
  // Check in-memory set
  if (trackedConversions.has(transactionId)) {
    return true;
  }

  // Check sessionStorage
  const tracked = JSON.parse(sessionStorage.getItem('tracked_conversions') || '[]');
  return tracked.includes(transactionId);
}

/**
 * Clear all tracked conversions (for testing purposes only)
 * DO NOT use in production unless you know what you're doing
 */
export function clearTrackedConversions(): void {
  trackedConversions.clear();
  sessionStorage.removeItem('tracked_conversions');
  console.log('🧹 Cleared all tracked conversions');
}

/**
 * Get all tracked conversion IDs
 * @returns Array of transaction IDs that have been tracked
 */
export function getTrackedConversions(): string[] {
  return Array.from(trackedConversions);
}

/**
 * Verify Google Ads is properly loaded
 * @returns Object with verification status
 */
export function verifyGoogleAdsSetup(): {
  gtagLoaded: boolean;
  dataLayerExists: boolean;
  conversionId: string;
  accountId: string;
  conversionLabel: string;
} {
  const status = {
    gtagLoaded: typeof window.gtag === 'function',
    dataLayerExists: Array.isArray(window.dataLayer),
    conversionId: CONVERSION_ID,
    accountId: GOOGLE_ADS_ACCOUNT,
    conversionLabel: CONVERSION_LABEL
  };

  console.log('🔍 Google Ads Setup Verification:', status);

  return status;
}

// Initialize: Load previously tracked conversions from sessionStorage
(function initializeTrackedConversions() {
  try {
    const tracked = JSON.parse(sessionStorage.getItem('tracked_conversions') || '[]');
    tracked.forEach((id: string) => trackedConversions.add(id));

    if (tracked.length > 0) {
      console.log(`📊 Loaded ${tracked.length} previously tracked conversions`);
    }
  } catch (error) {
    console.error('Error loading tracked conversions:', error);
  }
})();

// Export constants for reference
export const GOOGLE_ADS_CONFIG = {
  ACCOUNT_ID: GOOGLE_ADS_ACCOUNT,
  CONVERSION_LABEL: CONVERSION_LABEL,
  CONVERSION_ID: CONVERSION_ID
} as const;
