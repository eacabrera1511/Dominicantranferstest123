export const verifyGoogleAdsSetup = (): {
  isLoaded: boolean;
  dataLayer: boolean;
  gtagFunction: boolean;
  accountId: string;
  errors: string[];
} => {
  const errors: string[] = [];
  const result = {
    isLoaded: false,
    dataLayer: false,
    gtagFunction: false,
    accountId: 'AW-17810479345',
    errors
  };

  if (typeof window === 'undefined') {
    errors.push('Running in non-browser environment');
    return result;
  }

  if (window.dataLayer) {
    result.dataLayer = true;
  } else {
    errors.push('window.dataLayer is not initialized');
  }

  if (typeof window.gtag === 'function') {
    result.gtagFunction = true;
  } else {
    errors.push('window.gtag function is not defined');
  }

  result.isLoaded = result.dataLayer && result.gtagFunction;

  return result;
};

export const logGoogleAdsStatus = () => {
  const status = verifyGoogleAdsSetup();

  console.group('🎯 Google Ads Tracking Status');
  console.log('Loaded:', status.isLoaded ? '✅' : '❌');
  console.log('DataLayer:', status.dataLayer ? '✅' : '❌');
  console.log('gtag Function:', status.gtagFunction ? '✅' : '❌');
  console.log('Account ID:', status.accountId);

  if (status.errors.length > 0) {
    console.log('Errors:', status.errors);
  }

  if (window.dataLayer) {
    console.log('DataLayer Contents:', window.dataLayer);
  }

  console.groupEnd();

  return status;
};

export const testConversionTracking = (
  value: number = 100,
  transactionId: string = 'TEST-' + Date.now()
) => {
  const status = verifyGoogleAdsSetup();

  if (!status.isLoaded) {
    console.error('❌ Cannot test conversion tracking - gtag not loaded');
    console.log('Errors:', status.errors);
    return false;
  }

  console.log('🧪 Testing conversion tracking...');
  console.log('Value:', value);
  console.log('Transaction ID:', transactionId);

  try {
    window.gtag?.('event', 'conversion', {
      'send_to': 'AW-17810479345',
      'value': value,
      'currency': 'USD',
      'transaction_id': transactionId
    });

    console.log('✅ Test conversion event sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending test conversion:', error);
    return false;
  }
};

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
    dataLayer?: any[];
    gtagLoaded?: boolean;
    verifyGoogleAds?: () => void;
    testGoogleAdsConversion?: (value?: number, transactionId?: string) => void;
  }
}

if (typeof window !== 'undefined') {
  window.verifyGoogleAds = logGoogleAdsStatus;
  window.testGoogleAdsConversion = testConversionTracking;
}
