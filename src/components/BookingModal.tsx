import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Users, CreditCard, Check, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'hotel' | 'service';
}

export function BookingModal({ isOpen, onClose, item, type }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setBookingData({
        checkInDate: '',
        checkOutDate: '',
        guests: 1,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        specialRequests: ''
      });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateTotal = () => {
    if (type === 'hotel') {
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights * item.price_per_night : item.price_per_night;
    }
    return item.price * bookingData.guests;
  };

  const handleBooking = async () => {
    setLoading(true);
    
    try {
      // Create order in database
      const orderData = {
        booking_type: type,
        reference_id: item.id || crypto.randomUUID(),
        item_name: item.name,
        quantity: type === 'hotel' ?
          Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) :
          bookingData.guests,
        unit_price: type === 'hotel' ? item.price_per_night : item.price,
        total_price: calculateTotal(),
        customer_email: bookingData.customerEmail,
        customer_name: bookingData.customerName,
        check_in_date: type === 'hotel' ? bookingData.checkInDate : null,
        check_out_date: type === 'hotel' ? bookingData.checkOutDate : null,
        details: {
          phone: bookingData.customerPhone,
          guests: bookingData.guests,
          special_requests: bookingData.specialRequests,
          location: item.location
        }
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Simulate payment processing (replace with actual payment integration)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid',
          stripe_payment_id: 'sim_' + Math.random().toString(36).substr(2, 9)
        })
        .eq('id', order.id);

      setStep(4); // Success step
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Book {item.name}</h3>
              <p className="text-gray-300 text-sm sm:text-base">{item.location}</p>
            </div>

            {type === 'hotel' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">Check-in Date</label>
                  <input
                    type="date"
                    value={bookingData.checkInDate}
                    onChange={(e) => setBookingData({...bookingData, checkInDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">Check-out Date</label>
                  <input
                    type="date"
                    value={bookingData.checkOutDate}
                    onChange={(e) => setBookingData({...bookingData, checkOutDate: e.target.value})}
                    min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                {type === 'hotel' ? 'Guests' : 'Participants'}
              </label>
              <select
                value={bookingData.guests}
                onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num} {num === 1 ? 'Person' : 'People'}</option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex justify-between items-center text-white">
                <span className="text-base sm:text-lg font-semibold">Total:</span>
                <span className="text-xl sm:text-2xl font-bold">${calculateTotal()}</span>
              </div>
              {type === 'hotel' && bookingData.checkInDate && bookingData.checkOutDate && (
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights × ${item.price_per_night}
                </p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={type === 'hotel' ? !bookingData.checkInDate || !bookingData.checkOutDate : false}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Continue to Details
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Your Details</h3>
              <p className="text-gray-300 text-sm sm:text-base">Please provide your contact information</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={bookingData.customerEmail}
                  onChange={(e) => setBookingData({...bookingData, customerEmail: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-2">Special Requests (Optional)</label>
                <textarea
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Any special requests or notes..."
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Payment</h3>
              <p className="text-gray-300 text-sm sm:text-base">Secure payment with iDEAL or Credit Card</p>
            </div>

            {/* Booking Summary */}
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Booking Summary</h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-gray-300 text-sm sm:text-base">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="flex-shrink-0">${type === 'hotel' ? item.price_per_night : item.price}</span>
                </div>
                {type === 'hotel' && (
                  <div className="flex justify-between text-gray-300 text-sm sm:text-base">
                    <span>{Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                    <span>×{Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300 text-sm sm:text-base">
                  <span>{bookingData.guests} {bookingData.guests === 1 ? 'Guest' : 'Guests'}</span>
                  <span>×{bookingData.guests}</span>
                </div>
                <div className="border-t border-white/10 pt-2 sm:pt-3 flex justify-between text-white font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    iDEAL
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm sm:text-base">iDEAL</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Pay with your Dutch bank</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm sm:text-base">Credit Card</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Visa, Mastercard, Amex</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
              >
                Back
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">Wait...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Complete Booking</span>
                    <span className="sm:hidden">Complete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-gray-300 text-sm sm:text-base">Your booking has been successfully confirmed</p>
            </div>

            <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10 text-left">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Booking Details</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Booking ID:</span>
                  <span className="text-white font-mono text-right">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 flex-shrink-0">Service:</span>
                  <span className="text-white text-right truncate">{item.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 flex-shrink-0">Customer:</span>
                  <span className="text-white text-right truncate">{bookingData.customerName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Total Paid:</span>
                  <span className="text-white font-bold">${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-gray-400 px-2">
              A confirmation email has been sent to {bookingData.customerEmail}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl overflow-hidden z-10 animate-slideUp">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl border-0 sm:border sm:border-white/20 shadow-2xl">
          <div
            className="h-full overflow-y-auto overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >
            <div
              className="p-4 xs:p-5 sm:p-8 pb-6 sm:pb-8 min-h-full"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 xs:top-4 xs:right-4 w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-gray-400 hover:text-white transition-all z-10 backdrop-blur-sm"
                style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-5 xs:mb-6 sm:mb-8 pt-10 xs:pt-12 sm:pt-2">
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <div key={stepNum} className="flex items-center">
                      <div className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] xs:text-xs sm:text-sm font-semibold transition-all ${
                        step >= stepNum
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/10 text-gray-400'
                      }`}>
                        {step > stepNum ? <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> : stepNum}
                      </div>
                      {stepNum < 4 && (
                        <div className={`w-4 xs:w-6 sm:w-8 h-0.5 xs:h-1 mx-0.5 sm:mx-1 rounded-full transition-all ${
                          step > stepNum ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-white/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}