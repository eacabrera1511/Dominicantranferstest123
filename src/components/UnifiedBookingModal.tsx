import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StripeService } from '../lib/stripe';
import { AirportPickupFlow } from './bookings/AirportPickupFlow';
import { HotelBookingFlow } from './bookings/HotelBookingFlow';
import { CarRentalFlow } from './bookings/CarRentalFlow';
import { TourActivityFlow } from './bookings/TourActivityFlow';
import { FlightBookingFlow } from './bookings/FlightBookingFlow';
import { CustomerInfoStep } from './bookings/CustomerInfoStep';
import { PaymentStep } from './bookings/PaymentStep';
import { SuccessStep } from './bookings/SuccessStep';

interface UnifiedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'hotel' | 'service';
}

export function UnifiedBookingModal({ isOpen, onClose, item, type }: UnifiedBookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setBookingData(null);
      setCustomerInfo(null);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getServiceType = () => {
    if (type === 'hotel') return 'hotel';
    return item.type;
  };

  const handleServiceDetailsComplete = (data: any) => {
    setBookingData(data);
    setStep(2);
  };

  const handleCustomerInfoComplete = (data: any) => {
    setCustomerInfo(data);
    setStep(3);
  };

  const generateBookingReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BK-${timestamp}${random}`;
  };

  const detectStripeRoute = () => {
    const serviceType = getServiceType();
    const pickupLower = bookingData?.pickupAddress?.toLowerCase() || '';
    const dropoffLower = bookingData?.dropoffAddress?.toLowerCase() || '';
    const itemNameLower = item.name?.toLowerCase() || '';
    const locationLower = item.location?.toLowerCase() || '';

    const bavaroKeywords = ['bavaro', 'bávaro'];
    const puntaCanaKeywords = ['punta cana'];
    const airportKeywords = ['puj', 'airport'];
    const allAreaKeywords = [...bavaroKeywords, ...puntaCanaKeywords];

    const hasAreaKeyword = (text: string) =>
      allAreaKeywords.some(keyword => text.includes(keyword));

    const hasAirportKeyword = (text: string) =>
      airportKeywords.some(keyword => text.includes(keyword));

    const hasBavaroKeyword = (text: string) =>
      bavaroKeywords.some(keyword => text.includes(keyword));

    // PUJ Airport to Bavaro/Punta Cana hotels
    if (serviceType === 'airport_transfer') {
      const isFromAirport = hasAirportKeyword(pickupLower) || bookingData?.pickupLocation === 'airport';
      const isToArea = hasAreaKeyword(dropoffLower) || hasAreaKeyword(itemNameLower) || hasAreaKeyword(locationLower);
      const isFromArea = hasAreaKeyword(pickupLower);
      const isToAirport = hasAirportKeyword(dropoffLower);

      if (isFromAirport && isToArea) {
        const dest = hasBavaroKeyword(dropoffLower) || hasBavaroKeyword(itemNameLower) ? 'Bavaro' : 'Punta Cana';
        return { origin: 'PUJ Airport', destination: dest, routeName: `PUJ Airport to ${dest}` };
      }

      if (isFromArea && isToAirport) {
        const orig = hasBavaroKeyword(pickupLower) ? 'Bavaro' : 'Punta Cana';
        return { origin: orig, destination: 'PUJ Airport', routeName: `${orig} to PUJ Airport` };
      }
    }

    // Sedan bookings within Bavaro/Punta Cana area
    if ((serviceType === 'airport_transfer' || serviceType === 'car_rental') &&
        (hasAreaKeyword(pickupLower) || hasAreaKeyword(dropoffLower) ||
         hasAreaKeyword(itemNameLower) || hasAreaKeyword(locationLower))) {

      if (hasBavaroKeyword(pickupLower)) {
        return { origin: 'Bavaro', destination: 'Punta Cana', routeName: 'Bavaro to Punta Cana' };
      } else if (puntaCanaKeywords.some(k => pickupLower.includes(k))) {
        return { origin: 'Punta Cana', destination: 'Bavaro', routeName: 'Punta Cana to Bavaro' };
      } else {
        return { origin: 'PUJ Airport', destination: 'Bavaro', routeName: 'PUJ Airport to Bavaro' };
      }
    }

    return null;
  };

  const handlePaymentComplete = async (paymentData: any) => {
    setLoading(true);

    try {
      const stripeRoute = detectStripeRoute();
      const totalPrice = bookingData.totalPrice || 0;
      const bookingReference = generateBookingReference();

      const pickupDateTime = bookingData.pickupDate ?
        `${bookingData.pickupDate}T${bookingData.pickupTime || '12:00'}:00` :
        bookingData.checkInDate ?
        `${bookingData.checkInDate}T14:00:00` :
        bookingData.departureDate ?
        `${bookingData.departureDate}T${bookingData.departureTime || '12:00'}:00` :
        bookingData.activityDate ?
        `${bookingData.activityDate}T${bookingData.activityTime || '09:00'}:00` :
        new Date().toISOString();

      const pickupLocation = bookingData.pickupAddress ||
                            bookingData.pickupLocation ||
                            bookingData.departureAirport ||
                            stripeRoute?.origin ||
                            item.location ||
                            'Not specified';

      const dropoffLocation = bookingData.dropoffAddress ||
                             bookingData.dropoffLocation ||
                             bookingData.arrivalAirport ||
                             stripeRoute?.destination ||
                             item.location ||
                             'Not specified';

      const bookingInsert = {
        reference: bookingReference,
        booking_type: getServiceType(),
        reference_id: item.id || crypto.randomUUID(),
        customer_name: customerInfo.customerName,
        customer_email: customerInfo.customerEmail,
        customer_phone: customerInfo.customerPhone || '',
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_datetime: pickupDateTime,
        passengers: bookingData.passengers || bookingData.numberOfGuests || bookingData.numberOfPeople || 1,
        vehicle_type: bookingData.vehicleType || bookingData.carType || 'Standard',
        flight_number: bookingData.flightNumber || bookingData.flightCode || null,
        special_requests: customerInfo.specialRequests || bookingData.specialRequests || '',
        total_price: totalPrice,
        price_source: bookingData.priceSource || 'standard',
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: paymentData.method,
        source: 'web',
        details: {
          itemName: item.name,
          itemType: type,
          location: item.location,
          route: stripeRoute?.routeName,
          ...bookingData,
          paymentDetails: paymentData.details,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfNights: bookingData.numberOfNights,
          activityDate: bookingData.activityDate,
          activityTime: bookingData.activityTime,
          departureDate: bookingData.departureDate,
          returnDate: bookingData.returnDate,
          customRate: bookingData.customRate || null,
          priceSource: bookingData.priceSource || 'standard',
        },
      };

      if (stripeRoute && paymentData.method === 'card' && totalPrice > 0) {
        const { data: crmBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingInsert)
          .select('*')
          .single();

        if (bookingError || !crmBooking) {
          console.error('Booking error:', bookingError);
          throw new Error('Failed to create booking');
        }

        try {
          const emailResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-new-booking`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                booking_id: crmBooking.id,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error('Email notification failed:', await emailResponse.text());
          } else {
            console.log('Email notifications sent:', await emailResponse.json());
          }
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
        }

        const checkoutSession = await StripeService.createDynamicCheckout({
          bookingId: crmBooking.id,
          amount: totalPrice,
          currency: 'usd',
          productName: `${bookingData.vehicleType || 'Sedan'} Transfer`,
          productDescription: `${stripeRoute.origin} to ${stripeRoute.destination}${bookingData.priceSource === 'custom' ? ' (Custom Rate)' : ''}`,
          customerEmail: customerInfo.customerEmail,
          customerName: customerInfo.customerName,
          successUrl: `${window.location.origin}?booking_success=true&booking_id=${crmBooking.id}`,
          cancelUrl: `${window.location.origin}?booking_cancelled=true`,
          metadata: {
            route: stripeRoute.routeName,
            vehicle_type: bookingData.vehicleType || 'Sedan',
            price_source: bookingData.priceSource || 'standard',
            custom_rate: bookingData.customRate ? bookingData.customRate.toString() : null,
          },
        });

        if (checkoutSession && checkoutSession.url) {
          const stripeUrl = checkoutSession.url;
          setTimeout(() => {
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = stripeUrl;
              } else {
                window.location.href = stripeUrl;
              }
            } catch {
              window.location.href = stripeUrl;
            }
          }, 100);
          return;
        } else {
          throw new Error('Failed to create Stripe checkout session');
        }
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select('*')
        .single();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        throw bookingError;
      }

      try {
        const emailResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-new-booking`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              booking_id: booking.id,
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error('Email notification failed:', await emailResponse.text());
        } else {
          const emailResult = await emailResponse.json();
          console.log('Email notifications sent:', emailResult);
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      setCompletedBooking(booking);

      const orderData = {
        booking_type: getServiceType(),
        reference_id: item.id || crypto.randomUUID(),
        item_name: item.name,
        quantity: bookingData.quantity || 1,
        unit_price: type === 'hotel' ? item.price_per_night : item.price,
        total_price: bookingData.totalPrice,
        customer_email: customerInfo.customerEmail,
        customer_name: customerInfo.customerName,
        check_in_date: bookingData.checkInDate || bookingData.pickupDate || bookingData.departureDate || bookingData.activityDate || null,
        check_out_date: bookingData.checkOutDate || bookingData.returnDate || null,
        payment_method: paymentData.method,
        payment_details: paymentData.details,
        status: 'confirmed',
        payment_status: 'paid',
        details: {
          phone: customerInfo.customerPhone,
          ...bookingData,
          customerRequests: customerInfo.specialRequests || bookingData.specialRequests,
          location: item.location,
          bookingReference: bookingReference
        }
      };

      await supabase.from('orders').insert(orderData);

      setStep(4);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        if (type === 'hotel') {
          return (
            <HotelBookingFlow
              hotel={item}
              onNext={handleServiceDetailsComplete}
              onBack={onClose}
            />
          );
        } else {
          const serviceType = getServiceType();

          switch (serviceType) {
            case 'airport_transfer':
              return (
                <AirportPickupFlow
                  service={item}
                  onNext={handleServiceDetailsComplete}
                  onBack={onClose}
                />
              );
            case 'car_rental':
              return (
                <CarRentalFlow
                  service={item}
                  onNext={handleServiceDetailsComplete}
                  onBack={onClose}
                />
              );
            case 'attraction':
              return (
                <TourActivityFlow
                  service={item}
                  onNext={handleServiceDetailsComplete}
                  onBack={onClose}
                />
              );
            case 'flight':
              return (
                <FlightBookingFlow
                  service={item}
                  onNext={handleServiceDetailsComplete}
                  onBack={onClose}
                />
              );
            default:
              return (
                <TourActivityFlow
                  service={item}
                  onNext={handleServiceDetailsComplete}
                  onBack={onClose}
                />
              );
          }
        }

      case 2:
        return (
          <CustomerInfoStep
            onNext={handleCustomerInfoComplete}
            onBack={() => setStep(1)}
          />
        );

      case 3:
        return (
          <PaymentStep
            item={item}
            bookingDetails={bookingData}
            totalPrice={bookingData.totalPrice}
            onBack={() => setStep(2)}
            onComplete={handlePaymentComplete}
            loading={loading}
          />
        );

      case 4:
        return (
          <SuccessStep
            item={item}
            bookingData={bookingData}
            customerInfo={customerInfo}
            totalPrice={bookingData.totalPrice}
            completedBooking={completedBooking}
            onClose={onClose}
          />
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step !== 4 ? onClose : undefined}
      />

      <div className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full h-full sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-3xl overflow-hidden z-10 animate-slideUp">
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:border sm:border-white/20 shadow-2xl flex flex-col">
          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >
            <div
              className="p-4 xs:p-5 sm:p-8 pb-6 sm:pb-8 relative min-h-full"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
            >
              {step !== 4 && (
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 xs:top-4 xs:right-4 w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-gray-400 hover:text-white transition-all z-20 backdrop-blur-sm"
                  style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {step !== 4 && (
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
              )}

              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}