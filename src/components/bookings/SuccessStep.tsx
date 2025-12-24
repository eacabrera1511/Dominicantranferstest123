import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { fireGoogleAdsConversion } from '../../lib/googleAdsConversion';

interface SuccessStepProps {
  item: any;
  bookingData: any;
  customerInfo: any;
  totalPrice: number;
  completedBooking?: any;
  onClose: () => void;
}

export function SuccessStep({ item, bookingData, customerInfo, totalPrice, completedBooking, onClose }: SuccessStepProps) {
  const bookingReference = completedBooking?.reference || `BK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

  useEffect(() => {
    if (completedBooking && bookingReference) {
      const tracked = fireGoogleAdsConversion({
        value: totalPrice,
        currency: 'EUR',
        transactionId: bookingReference,
        source: 'checkout',
        preventDuplicates: true
      });

      if (tracked) {
        console.log('✅ Conversion tracked successfully from SuccessStep');
      }
    } else if (!completedBooking) {
      console.warn('⚠️ No completed booking data for conversion tracking');
    }
  }, [completedBooking, totalPrice, bookingReference]);

  return (
    <div className="text-center space-y-3 xs:space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-scaleIn">
        <Check className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-green-400" />
      </div>

      <div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Booking Confirmed!</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">Your booking has been successfully confirmed</p>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10 text-left">
        <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Booking Details</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Booking Reference:</span>
            <span className="text-white font-mono text-right">{bookingReference}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 flex-shrink-0">Service:</span>
            <span className="text-white text-right truncate">{item.name}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 flex-shrink-0">Customer:</span>
            <span className="text-white text-right truncate">{customerInfo.customerName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Email:</span>
            <span className="text-white text-right truncate">{customerInfo.customerEmail}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Total Paid:</span>
            <span className="text-white font-bold">${totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <p className="text-blue-300 text-xs sm:text-sm">
          A confirmation email has been sent to <span className="font-semibold">{customerInfo.customerEmail}</span> with all the details.
        </p>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
      >
        Close
      </button>
    </div>
  );
}