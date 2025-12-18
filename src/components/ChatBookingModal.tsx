import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Car, Users, Briefcase, MapPin, Calendar, Clock,
  User, Mail, Phone, CreditCard, CheckCircle, Plane, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BookingAction } from '../lib/travelAgent';

interface ChatBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingAction;
  onComplete: (reference: string) => void;
}

const AIRPORT_NAMES: Record<string, string> = {
  PUJ: 'Punta Cana International Airport (PUJ)',
  SDQ: 'Santo Domingo Las Americas Airport (SDQ)',
  LRM: 'La Romana Airport (LRM)',
  POP: 'Puerto Plata Gregorio Luperon Airport (POP)',
};

const VEHICLE_OPTIONS = [
  { value: 'Sedan', label: 'Sedan (1-2 pax, 3 bags)', basePrice: 25 },
  { value: 'Minivan', label: 'Minivan (3-6 pax, 6-8 bags)', basePrice: 45 },
  { value: 'Suburban', label: 'Suburban VIP (1-4 pax, 4 bags)', basePrice: 65 },
  { value: 'Sprinter', label: 'Sprinter Van (7-12 pax, 10-14 bags)', basePrice: 110 },
  { value: 'Mini Bus', label: 'Mini Bus (13+ passengers)', basePrice: 180 },
];

export function ChatBookingModal({ isOpen, onClose, bookingData, onComplete }: ChatBookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const [transferDetails, setTransferDetails] = useState({
    pickupDate: '',
    pickupTime: '',
    flightNumber: '',
    returnDate: '',
    returnTime: '',
    returnFlightNumber: '',
    vehicleType: 'Sedan',
    customRate: '',
    useCustomRate: false,
  });

  const [isRoundTripSelected, setIsRoundTripSelected] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cash'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setReference('');
      setIsRoundTripSelected(bookingData.tripType === 'Round trip');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, bookingData.tripType]);

  if (!isOpen) return null;

  const calculateTotalPrice = () => {
    if (transferDetails.useCustomRate && transferDetails.customRate) {
      const customPrice = parseFloat(transferDetails.customRate);
      return isNaN(customPrice) ? bookingData.price : customPrice;
    }

    const selectedVehicle = VEHICLE_OPTIONS.find(v => v.value === transferDetails.vehicleType);
    const basePrice = selectedVehicle ? selectedVehicle.basePrice : bookingData.price;
    return isRoundTripSelected ? basePrice * 1.9 : basePrice;
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingRef = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create or get customer
      let customerId: string | null = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerInfo.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const nameParts = customerInfo.name.trim().split(' ');
        const firstName = nameParts[0] || customerInfo.name;
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            email: customerInfo.email,
            phone: customerInfo.phone,
            first_name: firstName,
            last_name: lastName,
            customer_type: 'individual'
          })
          .select('id')
          .single();

        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      // Create pickup datetime
      const pickupDatetime = `${transferDetails.pickupDate}T${transferDetails.pickupTime}:00`;
      const finalPrice = calculateTotalPrice();

      // Create booking in bookings table
      const newBooking = {
        booking_type: 'airport_transfer',
        reference_id: crypto.randomUUID(),
        reference: bookingRef,
        source: 'chat',
        customer_id: customerId,
        pickup_address: `${AIRPORT_NAMES[bookingData.airport]}`,
        dropoff_address: bookingData.hotel,
        pickup_datetime: pickupDatetime,
        vehicle_type: transferDetails.vehicleType,
        passenger_count: bookingData.passengers,
        luggage_count: bookingData.suitcases,
        special_requests: customerInfo.specialRequests || null,
        price: finalPrice,
        price_source: transferDetails.useCustomRate ? 'custom' : 'standard',
        payment_status: 'paid',
        status: 'confirmed',
        workflow_status: 'pending_assignment',
        details: {
          bookingReference: bookingRef,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          airport: bookingData.airport,
          airportName: AIRPORT_NAMES[bookingData.airport],
          hotel: bookingData.hotel,
          region: bookingData.region,
          vehicle: transferDetails.vehicleType,
          passengers: bookingData.passengers,
          suitcases: bookingData.suitcases,
          tripType: isRoundTripSelected ? 'Round trip' : 'One-way',
          pickupDate: transferDetails.pickupDate,
          pickupTime: transferDetails.pickupTime,
          flightNumber: transferDetails.flightNumber || null,
          returnDate: isRoundTripSelected ? transferDetails.returnDate : null,
          returnTime: isRoundTripSelected ? transferDetails.returnTime : null,
          returnFlightNumber: isRoundTripSelected ? transferDetails.returnFlightNumber : null,
          specialRequests: customerInfo.specialRequests || null,
          customRate: transferDetails.useCustomRate ? parseFloat(transferDetails.customRate) : null,
          priceSource: transferDetails.useCustomRate ? 'custom' : 'standard',
        },
        payment_details: {
          method: paymentMethod,
          amount: finalPrice,
          currency: 'USD',
          simulatedPaymentId: `sim_${paymentMethod}_${Math.random().toString(36).substr(2, 9)}`,
          paidAt: new Date().toISOString()
        }
      };

      const { data: createdBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select()
        .single();

      if (bookingError || !createdBooking) {
        console.error('Booking creation error:', bookingError);
        throw bookingError;
      }

      // Also create order record for compatibility
      const orderData = {
        booking_type: 'airport_transfer',
        reference_id: crypto.randomUUID(),
        item_name: `${transferDetails.vehicleType} Transfer - ${bookingData.airport} to ${bookingData.hotel}`,
        quantity: 1,
        unit_price: finalPrice,
        total_price: finalPrice,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        check_in_date: transferDetails.pickupDate,
        check_out_date: isRoundTripSelected ? transferDetails.returnDate : null,
        payment_method: paymentMethod,
        status: 'confirmed',
        payment_status: 'paid',
        stripe_payment_id: `sim_${paymentMethod}_${Math.random().toString(36).substr(2, 9)}`,
        details: {
          phone: customerInfo.phone,
          airport: bookingData.airport,
          airportName: AIRPORT_NAMES[bookingData.airport],
          hotel: bookingData.hotel,
          region: bookingData.region,
          vehicle: transferDetails.vehicleType,
          passengers: bookingData.passengers,
          suitcases: bookingData.suitcases,
          tripType: isRoundTripSelected ? 'Round trip' : 'One-way',
          pickupTime: transferDetails.pickupTime,
          flightNumber: transferDetails.flightNumber,
          returnDate: isRoundTripSelected ? transferDetails.returnDate : null,
          returnTime: isRoundTripSelected ? transferDetails.returnTime : null,
          returnFlightNumber: isRoundTripSelected ? transferDetails.returnFlightNumber : null,
          specialRequests: customerInfo.specialRequests,
          bookingReference: bookingRef,
          customRate: transferDetails.useCustomRate ? parseFloat(transferDetails.customRate) : null,
          priceSource: transferDetails.useCustomRate ? 'custom' : 'standard',
        }
      };

      await supabase.from('orders').insert(orderData);

      // Send booking confirmation emails
      try {
        const newBookingResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-new-booking`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: createdBooking.id,
            }),
          }
        );

        if (!newBookingResponse.ok) {
          console.warn('Failed to send booking emails');
        }
      } catch (emailError) {
        console.warn('Email send error:', emailError);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      setReference(bookingRef);
      setStep(4);
      onComplete(bookingRef);
    } catch (error) {
      console.error('Booking error:', error);
      alert('There was an error creating your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/20 rounded-lg px-3 py-3 min-[480px]:px-3 min-[480px]:py-2.5 text-white text-sm min-[480px]:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 placeholder-gray-500 [color-scheme:dark]";
  const inputWithIconClass = "w-full bg-white/5 border border-white/20 rounded-lg pl-9 pr-3 py-3 min-[480px]:pl-9 min-[480px]:pr-2.5 min-[480px]:py-2.5 text-white text-sm min-[480px]:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 placeholder-gray-500 [color-scheme:dark]";
  const labelClass = "block text-gray-400 text-[10px] min-[480px]:text-xs mb-0.5 min-[480px]:mb-1";
  const iconClass = "absolute left-2 min-[480px]:left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 min-[480px]:w-4 min-[480px]:h-4 text-gray-400";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleTransferSubmit} className="p-3 min-[480px]:p-4 md:p-6 space-y-3 min-[480px]:space-y-4">
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-lg p-2.5 min-[480px]:p-3 border border-teal-500/20">
              <div className="flex items-center justify-between mb-1.5 min-[480px]:mb-2">
                <div className="flex items-center gap-1.5 text-xs min-[480px]:text-sm">
                  <Car className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-white font-medium">{bookingData.airport}</span>
                  <span className="text-gray-500">to</span>
                  <span className="text-white font-medium truncate max-w-[100px] min-[480px]:max-w-[140px]">{bookingData.hotel}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] min-[480px]:text-xs text-gray-400">
                <span>{bookingData.passengers} pax</span>
                <span>{bookingData.suitcases} bags</span>
                <span className="text-teal-400">Select vehicle below</span>
              </div>
            </div>

            <div className="space-y-3 min-[480px]:space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoundTripSelected(false)}
                  className={`py-2 min-[480px]:py-2.5 px-3 rounded-lg border-2 transition-all font-medium text-xs min-[480px]:text-sm ${
                    !isRoundTripSelected
                      ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  One-way
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoundTripSelected(true)}
                  className={`py-2 min-[480px]:py-2.5 px-3 rounded-lg border-2 transition-all font-medium text-xs min-[480px]:text-sm ${
                    isRoundTripSelected
                      ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Round trip
                </button>
              </div>

              <div>
                <h3 className="text-white font-medium text-xs min-[480px]:text-sm mb-2">Arrival Details</h3>
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
                  <div className="w-full min-w-0">
                    <label className={labelClass}>
                      <span className="hidden min-[480px]:inline">Pickup Date *</span>
                      <span className="inline min-[480px]:hidden">Date *</span>
                    </label>
                    <div className="relative w-full">
                      <Calendar className={iconClass} />
                      <input
                        type="date"
                        value={transferDetails.pickupDate}
                        onChange={(e) => setTransferDetails({ ...transferDetails, pickupDate: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        aria-label="Pickup date"
                        className={`${inputWithIconClass} max-w-full box-border text-xs sm:text-sm`}
                      />
                    </div>
                  </div>
                  <div className="w-full min-w-0">
                    <label className={labelClass}>
                      <span className="hidden min-[480px]:inline">Pickup Time *</span>
                      <span className="inline min-[480px]:hidden">Time *</span>
                    </label>
                    <div className="relative w-full">
                      <Clock className={iconClass} />
                      <input
                        type="time"
                        value={transferDetails.pickupTime}
                        onChange={(e) => setTransferDetails({ ...transferDetails, pickupTime: e.target.value })}
                        required
                        aria-label="Pickup time"
                        className={`${inputWithIconClass} max-w-full box-border text-xs sm:text-sm`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <label className={labelClass}>Flight Number (optional)</label>
                  <div className="relative">
                    <Plane className={iconClass} />
                    <input
                      type="text"
                      value={transferDetails.flightNumber}
                      onChange={(e) => setTransferDetails({ ...transferDetails, flightNumber: e.target.value })}
                      placeholder="e.g., AA1234"
                      className={inputWithIconClass}
                    />
                  </div>
                </div>
              </div>

              {isRoundTripSelected && (
                <div className="pt-2 border-t border-white/10">
                  <h3 className="text-white font-medium text-xs min-[480px]:text-sm mb-2">Return Details</h3>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
                    <div className="w-full min-w-0">
                      <label className={labelClass}>
                        <span className="hidden min-[480px]:inline">Return Date *</span>
                        <span className="inline min-[480px]:hidden">Date *</span>
                      </label>
                      <div className="relative w-full">
                        <Calendar className={iconClass} />
                        <input
                          type="date"
                          value={transferDetails.returnDate}
                          onChange={(e) => setTransferDetails({ ...transferDetails, returnDate: e.target.value })}
                          required={isRoundTripSelected}
                          min={transferDetails.pickupDate || new Date().toISOString().split('T')[0]}
                          aria-label="Return date"
                          className={`${inputWithIconClass} max-w-full box-border text-xs sm:text-sm`}
                        />
                      </div>
                    </div>
                    <div className="w-full min-w-0">
                      <label className={labelClass}>
                        <span className="hidden min-[480px]:inline">Return Time *</span>
                        <span className="inline min-[480px]:hidden">Time *</span>
                      </label>
                      <div className="relative w-full">
                        <Clock className={iconClass} />
                        <input
                          type="time"
                          value={transferDetails.returnTime}
                          onChange={(e) => setTransferDetails({ ...transferDetails, returnTime: e.target.value })}
                          required={isRoundTripSelected}
                          aria-label="Return time"
                          className={`${inputWithIconClass} max-w-full box-border text-xs sm:text-sm`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className={labelClass}>Return Flight (optional)</label>
                    <div className="relative">
                      <Plane className={iconClass} />
                      <input
                        type="text"
                        value={transferDetails.returnFlightNumber}
                        onChange={(e) => setTransferDetails({ ...transferDetails, returnFlightNumber: e.target.value })}
                        placeholder="e.g., AA5678"
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <h3 className="text-white font-medium text-xs min-[480px]:text-sm mb-2">Vehicle Selection</h3>
                <div className="relative">
                  <Car className={iconClass} />
                  <select
                    value={transferDetails.vehicleType}
                    onChange={(e) => setTransferDetails({ ...transferDetails, vehicleType: e.target.value })}
                    className={inputWithIconClass}
                  >
                    {VEHICLE_OPTIONS.map(vehicle => (
                      <option key={vehicle.value} value={vehicle.value} className="bg-slate-800">
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-2.5 min-[480px]:p-3 border border-white/10">
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 min-[480px]:w-4 min-[480px]:h-4 text-green-400" />
                    <span className="text-white text-xs min-[480px]:text-sm font-medium">Have a Better Rate?</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={transferDetails.useCustomRate}
                      onChange={(e) => setTransferDetails({...transferDetails, useCustomRate: e.target.checked, customRate: ''})}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 min-[480px]:w-11 min-[480px]:h-6 bg-white/20 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 min-[480px]:w-5 min-[480px]:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
                {transferDetails.useCustomRate && (
                  <div className="animate-fadeIn">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferDetails.customRate}
                      onChange={(e) => setTransferDetails({...transferDetails, customRate: e.target.value})}
                      placeholder="Enter your rate (USD)"
                      className={inputClass}
                    />
                    <p className="text-green-400 text-[10px] mt-1.5">Enter the rate you found elsewhere and we'll match it!</p>
                  </div>
                )}
              </div>

              <div className="bg-teal-500/10 rounded-lg p-2.5 min-[480px]:p-3 border border-teal-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-white text-xs min-[480px]:text-sm font-medium">Total Price:</span>
                  <span className="text-base min-[480px]:text-lg font-bold text-teal-400">${calculateTotalPrice().toFixed(2)}</span>
                </div>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  {transferDetails.useCustomRate && transferDetails.customRate ? (
                    <span className="text-green-400">Custom rate applied</span>
                  ) : (
                    <>
                      {transferDetails.vehicleType} - {isRoundTripSelected ? 'Round trip (x1.9)' : 'One-way'}
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={transferDetails.useCustomRate && (!transferDetails.customRate || parseFloat(transferDetails.customRate) <= 0)}
              className="w-full py-2.5 min-[480px]:py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs min-[480px]:text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Continue to Contact Info
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleCustomerSubmit} className="p-3 min-[480px]:p-4 md:p-6 space-y-3 min-[480px]:space-y-4">
            <h3 className="text-white font-medium flex items-center gap-1.5 text-xs min-[480px]:text-sm">
              <User className="w-3.5 h-3.5 min-[480px]:w-4 min-[480px]:h-4 text-teal-400" />
              Contact Information
            </h3>

            <div className="space-y-2 min-[480px]:space-y-3">
              <div>
                <label className={labelClass}>Full Name *</label>
                <div className="relative">
                  <User className={iconClass} />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                    placeholder="John Smith"
                    className={inputWithIconClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address *</label>
                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    required
                    placeholder="john@email.com"
                    className={inputWithIconClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Phone Number *</label>
                <div className="relative">
                  <Phone className={iconClass} />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    required
                    placeholder="+1 555 123 4567"
                    className={inputWithIconClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Special Requests (optional)</label>
                <textarea
                  value={customerInfo.specialRequests}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, specialRequests: e.target.value })}
                  placeholder="Child seat, wheelchair, extra stops..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 min-[480px]:py-3 rounded-lg bg-white/5 border border-white/20 text-white text-xs min-[480px]:text-sm font-medium hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 min-[480px]:py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs min-[480px]:text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handlePaymentSubmit} className="p-3 min-[480px]:p-4 md:p-6 space-y-3 min-[480px]:space-y-4">
            <h3 className="text-white font-medium flex items-center gap-1.5 text-xs min-[480px]:text-sm">
              <CreditCard className="w-3.5 h-3.5 min-[480px]:w-4 min-[480px]:h-4 text-teal-400" />
              Payment - ${calculateTotalPrice().toFixed(2)} USD
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['card', 'paypal', 'cash'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 min-[480px]:py-2.5 px-2 rounded-lg border transition-all active:scale-[0.98] ${
                    paymentMethod === method
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] min-[480px]:text-xs font-medium capitalize">{method === 'card' ? 'Card' : method}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-2 min-[480px]:space-y-3">
                <div>
                  <label className={labelClass}>Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Expiry</label>
                    <input
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>CVC</label>
                    <input
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      placeholder="123"
                      maxLength={4}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Name on Card</label>
                  <input
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    placeholder="JOHN SMITH"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="bg-white/5 rounded-lg p-3 min-[480px]:p-4 text-center">
                <p className="text-gray-400 text-xs min-[480px]:text-sm mb-2">You will be redirected to PayPal.</p>
                <div className="text-base min-[480px]:text-lg font-bold text-white">${calculateTotalPrice().toFixed(2)} USD</div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 min-[480px]:p-3">
                <p className="text-amber-400 text-[10px] min-[480px]:text-xs">Pay cash to your driver upon arrival. Please have the exact amount ready in USD.</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 min-[480px]:py-3 rounded-lg bg-white/5 border border-white/20 text-white text-xs min-[480px]:text-sm font-medium hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 min-[480px]:py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs min-[480px]:text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Complete'
                )}
              </button>
            </div>
          </form>
        );

      case 4:
        return (
          <div className="p-3 min-[480px]:p-4 md:p-6 text-center space-y-3 min-[480px]:space-y-4">
            <div className="w-12 h-12 min-[480px]:w-14 min-[480px]:h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 min-[480px]:w-7 min-[480px]:h-7 text-green-400" />
            </div>

            <div>
              <h3 className="text-base min-[480px]:text-lg font-bold text-white mb-0.5">Booking Confirmed!</h3>
              <p className="text-gray-400 text-xs min-[480px]:text-sm">Your transfer has been booked.</p>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 min-[480px]:p-3">
              <p className="text-gray-400 text-[10px] min-[480px]:text-xs mb-0.5">Booking Reference</p>
              <p className="text-sm min-[480px]:text-base font-bold text-teal-400 font-mono break-all">{reference}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 min-[480px]:p-3 text-left space-y-1.5 text-[10px] min-[480px]:text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 flex-shrink-0">Transfer:</span>
                <span className="text-white text-right truncate">{bookingData.airport} to {bookingData.hotel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 flex-shrink-0">Date:</span>
                <span className="text-white text-right">{transferDetails.pickupDate} at {transferDetails.pickupTime}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 flex-shrink-0">Vehicle:</span>
                <span className="text-white">{transferDetails.vehicleType}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 flex-shrink-0">Total Paid:</span>
                <span className="text-teal-400 font-semibold">${calculateTotalPrice().toFixed(2)} USD</span>
              </div>
            </div>

            <p className="text-gray-400 text-[10px] min-[480px]:text-xs">
              Confirmation sent to <span className="text-white break-all">{customerInfo.email}</span>
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 min-[480px]:py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs min-[480px]:text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = ['Transfer Details', 'Contact Info', 'Payment', 'Confirmation'];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end min-[480px]:items-center justify-center min-[480px]:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full min-[480px]:max-w-md md:max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl min-[480px]:rounded-2xl border border-white/10 shadow-2xl max-h-[85vh] min-[480px]:max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-2.5 min-[480px]:p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm min-[480px]:text-base font-bold text-white truncate">Book Airport Transfer</h2>
            {step < 4 && (
              <p className="text-gray-400 text-[10px] min-[480px]:text-xs">Step {step} of 3 - {stepTitles[step - 1]}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 min-[480px]:w-8 min-[480px]:h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2 active:scale-95"
          >
            <X className="w-3.5 h-3.5 min-[480px]:w-4 min-[480px]:h-4" />
          </button>
        </div>

        {step < 4 && (
          <div className="px-3 min-[480px]:px-4 pt-2 min-[480px]:pt-3 flex-shrink-0">
            <div className="flex gap-1 min-[480px]:gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-0.5 min-[480px]:h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-teal-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {renderStep()}
        </div>
      </div>
    </div>,
    document.body
  );
}
