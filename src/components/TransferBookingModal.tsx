import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Car, Users, Briefcase, MapPin, Calendar, ArrowRight,
  User, Mail, Phone, CreditCard, CheckCircle, Plane, Shield, Sparkles,
  ArrowLeftRight, ChevronRight, ChevronLeft, Check, Loader2, Crown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BookingAction } from '../lib/travelAgent';
import { StripeService } from '../lib/stripe';
import { trackConversionEvent } from '../lib/eventTracking';
import { fireGoogleAdsConversion } from '../lib/googleAdsConversion';

interface TransferBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingAction;
  onComplete: (reference: string) => void;
}

interface VehicleOption {
  id: string;
  name: string;
  capacity: number;
  luggage: number;
  basePrice: number;
  description: string;
}

const AIRPORT_NAMES: Record<string, string> = {
  PUJ: 'Punta Cana International Airport',
  SDQ: 'Santo Domingo Las Americas Airport',
  LRM: 'La Romana International Airport',
  POP: 'Puerto Plata Gregorio Luperon Airport',
};

const ROUNDTRIP_MULTIPLIER = 1.9;

const VEHICLE_DESCRIPTIONS: Record<string, string> = {
  'Sedan': 'Comfortable sedan for small groups',
  'SUV': 'Spacious SUV with extra room',
  'Van': 'Perfect for families and groups',
  'Minibus': 'Ideal for large groups',
  'Luxury SUV': 'Premium VIP experience',
};

const VEHICLE_ICONS: Record<string, string> = {
  'Sedan': 'sedan',
  'SUV': 'suv',
  'Van': 'van',
  'Minibus': 'bus',
  'Luxury SUV': 'luxury',
};

export function TransferBookingModal({ isOpen, onClose, bookingData, onComplete }: TransferBookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [incompleteBookingId, setIncompleteBookingId] = useState<string | null>(null);

  const [selectedTripType, setSelectedTripType] = useState<'oneway' | 'roundtrip'>(
    bookingData?.tripType === 'Round trip' ? 'roundtrip' : 'oneway'
  );

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [recommendedVehicleName, setRecommendedVehicleName] = useState<string>('');

  const [transferDetails, setTransferDetails] = useState({
    pickupDate: '',
    pickupTime: '',
    flightNumber: '',
    returnDate: '',
    returnTime: '',
    returnFlightNumber: '',
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const [childSeats, setChildSeats] = useState(0);
  const CHILD_SEAT_PRICE = 12; // Industry standard price per child seat

  // Beverage options with industry-standard pricing
  const BEVERAGES = [
    { id: 'water', name: 'Water', price: 2 },
    { id: 'soda', name: 'Soda', price: 3 },
    { id: 'juice', name: 'Juice', price: 4 },
    { id: 'beer', name: 'Beer', price: 5 },
  ];

  const [selectedBeverages, setSelectedBeverages] = useState<Record<string, number>>({});

  const [paymentMethod, setPaymentMethod] = useState<'card'>('card');

  const calculatedPrice = useCallback(() => {
    if (!selectedVehicle) return 0;
    const basePrice = selectedVehicle.basePrice;
    const childSeatsTotal = childSeats * CHILD_SEAT_PRICE;

    // Calculate total beverages cost
    const beveragesTotal = Object.entries(selectedBeverages).reduce((total, [id, quantity]) => {
      const beverage = BEVERAGES.find(b => b.id === id);
      return total + (beverage ? beverage.price * quantity : 0);
    }, 0);

    if (selectedTripType === 'roundtrip') {
      // For round trips, both the base price and child seats are doubled
      // Beverages are also doubled for round trips
      return Math.round(basePrice * ROUNDTRIP_MULTIPLIER) + (childSeatsTotal * 2) + (beveragesTotal * 2);
    }
    return basePrice + childSeatsTotal + beveragesTotal;
  }, [selectedVehicle, selectedTripType, childSeats, selectedBeverages]);

  const fetchVehiclesAndPricing = useCallback(async () => {
    if (!bookingData) return;

    setLoadingVehicles(true);
    try {
      const { data: pricingRules, error } = await supabase
        .from('pricing_rules')
        .select(`
          id,
          base_price,
          vehicle_type_id,
          vehicle_types!inner (
            id,
            name,
            max_passengers,
            max_luggage
          )
        `)
        .eq('origin', bookingData.airport)
        .eq('destination', bookingData.region)
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (error) throw error;

      if (pricingRules && pricingRules.length > 0) {
        const vehicleOptions: VehicleOption[] = pricingRules.map((rule: any) => ({
          id: rule.vehicle_type_id,
          name: rule.vehicle_types.name,
          capacity: rule.vehicle_types.max_passengers,
          luggage: rule.vehicle_types.max_luggage,
          basePrice: Number(rule.base_price),
          description: VEHICLE_DESCRIPTIONS[rule.vehicle_types.name] || 'Professional transfer service',
        }));

        setVehicles(vehicleOptions);
        setRecommendedVehicleName(bookingData.vehicle);

        const preselectedIndex = vehicleOptions.findIndex(v => v.name === bookingData.vehicle);
        if (preselectedIndex >= 0) {
          setSelectedVehicle(vehicleOptions[preselectedIndex]);
        } else {
          const suitableVehicle = vehicleOptions.find(v =>
            v.capacity >= bookingData.passengers && v.luggage >= bookingData.suitcases
          ) || vehicleOptions[0];
          setSelectedVehicle(suitableVehicle);
        }
      } else {
        const fallbackVehicles: VehicleOption[] = [
          { id: '1', name: 'Sedan', capacity: 3, luggage: 3, basePrice: bookingData.price || 80, description: VEHICLE_DESCRIPTIONS['Sedan'] },
          { id: '2', name: 'SUV', capacity: 5, luggage: 5, basePrice: Math.round((bookingData.price || 80) * 1.25), description: VEHICLE_DESCRIPTIONS['SUV'] },
          { id: '3', name: 'Van', capacity: 7, luggage: 7, basePrice: Math.round((bookingData.price || 80) * 1.6), description: VEHICLE_DESCRIPTIONS['Van'] },
        ];
        setVehicles(fallbackVehicles);
        setSelectedVehicle(fallbackVehicles[0]);
        setRecommendedVehicleName(bookingData.vehicle);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      const fallback: VehicleOption = {
        id: '0',
        name: bookingData.vehicle,
        capacity: bookingData.passengers,
        luggage: bookingData.suitcases,
        basePrice: bookingData.price || 0,
        description: VEHICLE_DESCRIPTIONS[bookingData.vehicle] || 'Professional transfer',
      };
      setVehicles([fallback]);
      setSelectedVehicle(fallback);
      setRecommendedVehicleName(bookingData.vehicle);
    } finally {
      setLoadingVehicles(false);
    }
  }, [bookingData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setReference('');
      setLoading(false);
      setSelectedTripType(bookingData?.tripType === 'Round trip' ? 'roundtrip' : 'oneway');
      setTransferDetails({
        pickupDate: '',
        pickupTime: '',
        flightNumber: '',
        returnDate: '',
        returnTime: '',
        returnFlightNumber: '',
      });

      // Load saved customer info from localStorage
      const savedCustomerInfo = localStorage.getItem('dominican_transfers_customer_info');
      if (savedCustomerInfo) {
        try {
          setCustomerInfo(JSON.parse(savedCustomerInfo));
        } catch (e) {
          setCustomerInfo({
            name: '',
            email: '',
            phone: '',
            specialRequests: '',
          });
        }
      } else {
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          specialRequests: '',
        });
      }

      setChildSeats(0);
      setSelectedBeverages({});
      setPaymentMethod('card');
      setTimeout(() => setAnimateIn(true), 50);
      fetchVehiclesAndPricing();
    } else {
      document.body.style.overflow = 'unset';
      setAnimateIn(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fetchVehiclesAndPricing]);

  // Save customer info to localStorage when it changes
  useEffect(() => {
    if (customerInfo.name || customerInfo.email || customerInfo.phone) {
      localStorage.setItem('dominican_transfers_customer_info', JSON.stringify(customerInfo));
    }
  }, [customerInfo]);

  // Track conversion when booking is completed (step 5)
  useEffect(() => {
    if (step === 5 && reference) {
      const finalPrice = calculatedPrice();

      const tracked = fireGoogleAdsConversion({
        value: finalPrice,
        currency: 'EUR',
        transactionId: reference,
        source: 'chat',
        preventDuplicates: true
      });

      if (tracked) {
        console.log('✅ Conversion tracked successfully from TransferBookingModal');
      }

      trackConversionEvent('purchase', finalPrice, reference).catch(err => {
        console.error('Error tracking conversion to database:', err);
      });
    }
  }, [step, reference, calculatedPrice]);

  // Handle resume incomplete booking from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('resume');

    if (resumeId && isOpen) {
      supabase
        .from('incomplete_bookings')
        .select('*')
        .eq('id', resumeId)
        .eq('completed', false)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error && !data.completed) {
            setIncompleteBookingId(data.id);
            setCustomerInfo({
              name: data.customer_name,
              email: data.email,
              phone: data.phone || '',
              specialRequests: '',
            });

            const bookingData = data.booking_data as any;
            if (bookingData) {
              setSelectedTripType(bookingData.tripType);
              setChildSeats(bookingData.childSeats || 0);
              setSelectedBeverages(bookingData.beverages || {});
              setTransferDetails({
                pickupDate: bookingData.pickupDate || '',
                pickupTime: bookingData.pickupTime || '',
                flightNumber: bookingData.flightNumber || '',
                returnDate: bookingData.returnDate || '',
                returnTime: bookingData.returnTime || '',
                returnFlightNumber: bookingData.returnFlightNumber || '',
              });
              setStep(4);
            }

            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
    }
  }, [isOpen]);

  // Format phone number with area code detection
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');

    // If starts with common DR area codes (809, 829, 849), format as DR number
    if (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849')) {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      if (cleaned.length <= 10) return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    // US/Canada format (starts with 1 or 10 digits)
    if (cleaned.startsWith('1') && cleaned.length > 1) {
      const withoutCountry = cleaned.slice(1);
      if (withoutCountry.length <= 3) return `+1 (${withoutCountry}`;
      if (withoutCountry.length <= 6) return `+1 (${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3)}`;
      if (withoutCountry.length <= 10) return `+1 (${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
      return `+1 (${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6, 10)}`;
    }

    // Standard 10-digit formatting
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;

    // International format - just add + prefix if not present
    if (cleaned.length > 10) {
      return '+' + cleaned;
    }

    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerInfo({ ...customerInfo, phone: formatted });
  };

  const handleVehicleSelect = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle);
  };

  const handleTripTypeChange = (type: 'oneway' | 'roundtrip') => {
    setSelectedTripType(type);
  };

  if (!isOpen) return null;

  const isRoundTrip = selectedTripType === 'roundtrip';
  const finalPrice = calculatedPrice();

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem('dominican_transfers_customer_info', JSON.stringify(customerInfo));

    try {
      const bookingDataToSave = {
        vehicleId: selectedVehicle?.id,
        vehicleName: selectedVehicle?.name,
        tripType: selectedTripType,
        airport: bookingData.airport,
        region: bookingData.region,
        hotel: bookingData.hotel || bookingData.region,
        passengers: bookingData.passengers,
        suitcases: bookingData.suitcases,
        pickupDate: transferDetails.pickupDate,
        pickupTime: transferDetails.pickupTime,
        flightNumber: transferDetails.flightNumber,
        returnDate: transferDetails.returnDate,
        returnTime: transferDetails.returnTime,
        returnFlightNumber: transferDetails.returnFlightNumber,
        childSeats: childSeats,
        beverages: selectedBeverages,
      };

      const { data: incompleteBooking, error } = await supabase
        .from('incomplete_bookings')
        .insert({
          email: customerInfo.email,
          customer_name: customerInfo.name,
          phone: customerInfo.phone,
          booking_data: bookingDataToSave,
          calculated_price: calculatedPrice(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving incomplete booking:', error);
      } else if (incompleteBooking) {
        setIncompleteBookingId(incompleteBooking.id);
      }
    } catch (error) {
      console.error('Error in handleCustomerSubmit:', error);
    }

    setStep(4);
  };

  const handleStripeCheckout = async () => {
    if (finalPrice <= 0) {
      alert('Unable to calculate price for this route.');
      return;
    }

    setLoading(true);
    try {
      const bookingRef = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const nameParts = customerInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      let customerId: string;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerInfo.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from('customers')
          .update({
            phone: customerInfo.phone,
            last_booking_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: customerInfo.email,
            phone: customerInfo.phone,
            first_name: firstName,
            last_name: lastName,
            customer_type: 'individual',
            vip_status: false,
            total_bookings: 0,
            total_spent: 0,
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          throw new Error('Failed to create customer');
        }
        customerId = newCustomer.id;
      }

      const pickupDateTime = `${transferDetails.pickupDate}T${transferDetails.pickupTime}:00`;
      const airportName = AIRPORT_NAMES[bookingData.airport] || bookingData.airport;
      const tripTypeLabel = isRoundTrip ? 'Round trip' : 'One way';

      const { data: crmBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          reference: bookingRef,
          booking_type: 'airport_transfer',
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          pickup_location: airportName,
          dropoff_location: bookingData.hotel,
          pickup_datetime: pickupDateTime,
          vehicle_type: selectedVehicle?.name || bookingData.vehicle,
          passengers: bookingData.passengers,
          flight_number: transferDetails.flightNumber,
          special_requests: customerInfo.specialRequests,
          child_seats: childSeats,
          child_seat_price: childSeats * CHILD_SEAT_PRICE * (selectedTripType === 'roundtrip' ? 2 : 1),
          beverages: selectedBeverages,
          beverages_price: Object.entries(selectedBeverages).reduce((total, [id, qty]) => {
            const bev = BEVERAGES.find(b => b.id === id);
            return total + (bev ? bev.price * qty : 0);
          }, 0) * (selectedTripType === 'roundtrip' ? 2 : 1),
          total_price: finalPrice,
          status: 'pending',
          payment_status: 'pending',
          source: 'chat',
          price_source: 'standard',
          original_price: selectedVehicle?.basePrice || finalPrice,
          details: {
            bookingReference: bookingRef,
            airport: bookingData.airport,
            airportName: airportName,
            region: bookingData.region,
            tripType: tripTypeLabel,
            suitcases: bookingData.suitcases,
            returnDate: transferDetails.returnDate,
            returnTime: transferDetails.returnTime,
            returnFlightNumber: transferDetails.returnFlightNumber,
            paymentMethod: 'stripe',
            roundtripMultiplier: isRoundTrip ? ROUNDTRIP_MULTIPLIER : 1,
          },
        })
        .select('id')
        .single();

      if (bookingError || !crmBooking) {
        throw new Error('Failed to create booking');
      }

      const baseUrl = window.location.origin;

      const checkoutSession = await StripeService.createDynamicCheckout({
        bookingId: crmBooking.id,
        amount: finalPrice,
        currency: 'usd',
        productName: `${selectedVehicle?.name || bookingData.vehicle} Transfer`,
        productDescription: `${airportName} to ${bookingData.hotel} - ${tripTypeLabel}`,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        successUrl: `${baseUrl}?payment=success&ref=${bookingRef}`,
        cancelUrl: `${baseUrl}?payment=cancelled`,
        metadata: {
          booking_reference: bookingRef,
          route: `${bookingData.airport} to ${bookingData.hotel}`,
          vehicle_type: selectedVehicle?.name || bookingData.vehicle,
          incomplete_booking_id: incompleteBookingId || '',
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
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Payment error: ${errorMessage}. Please try again.`);
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'card' && finalPrice > 0) {
      await handleStripeCheckout();
      return;
    }

    if (paymentMethod === 'card' && finalPrice <= 0) {
      alert('Price not available. Please refresh.');
      return;
    }

    setLoading(true);

    try {
      const bookingRef = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const pickupDateTime = `${transferDetails.pickupDate}T${transferDetails.pickupTime}:00`;
      const airportName = AIRPORT_NAMES[bookingData.airport] || bookingData.airport;
      const tripTypeLabel = isRoundTrip ? 'Round trip' : 'One way';

      const { data: crmBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          reference: bookingRef,
          booking_type: 'airport_transfer',
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          pickup_location: airportName,
          dropoff_location: bookingData.hotel,
          pickup_datetime: pickupDateTime,
          vehicle_type: selectedVehicle?.name || bookingData.vehicle,
          passengers: bookingData.passengers,
          flight_number: transferDetails.flightNumber,
          special_requests: customerInfo.specialRequests,
          child_seats: childSeats,
          child_seat_price: childSeats * CHILD_SEAT_PRICE * (selectedTripType === 'roundtrip' ? 2 : 1),
          beverages: selectedBeverages,
          beverages_price: Object.entries(selectedBeverages).reduce((total, [id, qty]) => {
            const bev = BEVERAGES.find(b => b.id === id);
            return total + (bev ? bev.price * qty : 0);
          }, 0) * (selectedTripType === 'roundtrip' ? 2 : 1),
          total_price: finalPrice,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: paymentMethod,
          source: 'chat',
          price_source: 'standard',
          original_price: selectedVehicle?.basePrice || finalPrice,
          details: {
            bookingReference: bookingRef,
            airport: bookingData.airport,
            airportName: airportName,
            region: bookingData.region,
            tripType: tripTypeLabel,
            suitcases: bookingData.suitcases,
            returnDate: transferDetails.returnDate,
            returnTime: transferDetails.returnTime,
            returnFlightNumber: transferDetails.returnFlightNumber,
            paymentMethod: paymentMethod,
            roundtripMultiplier: isRoundTrip ? ROUNDTRIP_MULTIPLIER : 1,
          },
        })
        .select('id')
        .single();

      if (bookingError || !crmBooking) {
        console.error('Booking error:', bookingError);
        throw new Error('Failed to create booking');
      }

      const orderData = {
        booking_type: 'airport_transfer',
        reference_id: crypto.randomUUID(),
        item_name: `${selectedVehicle?.name || bookingData.vehicle} Transfer - ${bookingData.airport} to ${bookingData.hotel}`,
        quantity: 1,
        unit_price: finalPrice,
        total_price: finalPrice,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        check_in_date: transferDetails.pickupDate,
        check_out_date: isRoundTrip ? transferDetails.returnDate : null,
        payment_method: paymentMethod,
        status: 'confirmed',
        payment_status: 'paid',
        stripe_payment_id: `sim_${paymentMethod}_${Math.random().toString(36).substr(2, 9)}`,
        details: {
          phone: customerInfo.phone,
          airport: bookingData.airport,
          airportName: airportName,
          hotel: bookingData.hotel,
          region: bookingData.region,
          vehicle: selectedVehicle?.name || bookingData.vehicle,
          passengers: bookingData.passengers,
          suitcases: bookingData.suitcases,
          tripType: tripTypeLabel,
          pickupTime: transferDetails.pickupTime,
          flightNumber: transferDetails.flightNumber,
          returnDate: transferDetails.returnDate,
          returnTime: transferDetails.returnTime,
          returnFlightNumber: transferDetails.returnFlightNumber,
          specialRequests: customerInfo.specialRequests,
          bookingReference: bookingRef,
          crmBookingId: crmBooking.id,
        }
      };

      await supabase.from('orders').insert(orderData);

      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-dispatch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: crmBooking.id,
              vehicle_type: selectedVehicle?.name || bookingData.vehicle,
              pickup_datetime: pickupDateTime,
            }),
          }
        );
      } catch (dispatchError) {
        console.warn('Auto-dispatch error:', dispatchError);
      }

      if (incompleteBookingId) {
        await supabase
          .from('incomplete_bookings')
          .update({ completed: true })
          .eq('id', incompleteBookingId);
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      setReference(bookingRef);
      setStep(5);
      onComplete(bookingRef);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleList = () => {
    if (loadingVehicles) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      );
    }

    if (vehicles.length === 0) {
      return (
        <div className="text-center py-6 text-white/50 text-sm">
          No vehicles available for this route
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {vehicles.map((vehicle) => {
          const vehiclePrice = selectedTripType === 'roundtrip'
            ? Math.round(vehicle.basePrice * ROUNDTRIP_MULTIPLIER)
            : vehicle.basePrice;
          const isSelected = selectedVehicle?.id === vehicle.id;
          const isLuxury = vehicle.name === 'Luxury SUV';
          const isRecommended = vehicle.name === recommendedVehicleName && isLuxury;
          const isSuitable = vehicle.capacity >= bookingData.passengers && vehicle.luggage >= bookingData.suitcases;

          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => handleVehicleSelect(vehicle)}
              className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                isSelected
                  ? isLuxury
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              } ${isRecommended ? 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' : ''}`}
            >
              {isRecommended && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5 animate-pulse" />
              )}

              <div className="relative flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? isLuxury
                      ? 'bg-gradient-to-br from-amber-500/30 to-yellow-600/30'
                      : 'bg-blue-500/20'
                    : 'bg-white/10'
                }`}>
                  {isLuxury ? (
                    <Crown className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-white/50'}`} />
                  ) : (
                    <Car className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-white/50'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold text-sm ${
                      isSelected
                        ? isLuxury ? 'text-amber-400' : 'text-blue-400'
                        : 'text-white'
                    }`}>
                      {vehicle.name}
                    </h4>
                    {isRecommended && (
                      <span className="text-base" title="Hot Choice">🔥</span>
                    )}
                    {!isSuitable && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-medium">
                        Small
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${isSelected ? 'text-white/60' : 'text-white/40'}`}>
                    {vehicle.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`flex items-center gap-1 text-xs ${isSelected ? 'text-white/70' : 'text-white/40'}`}>
                      <Users className="w-3 h-3" /> {vehicle.capacity}
                    </span>
                    <span className={`flex items-center gap-1 text-xs ${isSelected ? 'text-white/70' : 'text-white/40'}`}>
                      <Briefcase className="w-3 h-3" /> {vehicle.luggage}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${
                    isSelected
                      ? isLuxury ? 'text-amber-400' : 'text-white'
                      : 'text-white/70'
                  }`}>
                    ${vehiclePrice}
                  </div>
                  {selectedTripType === 'roundtrip' && (
                    <div className="text-emerald-400 text-[10px]">round trip</div>
                  )}
                </div>

                {isSelected && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isLuxury ? 'bg-amber-500' : 'bg-blue-500'
                  }`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Plane className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-white/50 text-[10px]">From</span>
                </div>
                <p className="text-white font-medium text-xs truncate">{bookingData.airport}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/50 text-[10px]">To</span>
                </div>
                <p className="text-white font-medium text-xs truncate">{bookingData.hotel}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium">Select Vehicle</label>
              {renderVehicleList()}
            </div>

            <div className="space-y-2">
              <label className="block text-white/60 text-xs font-medium">Trip Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTripTypeChange('oneway')}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                    selectedTripType === 'oneway'
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ChevronRight className={`w-4 h-4 ${selectedTripType === 'oneway' ? 'text-blue-400' : 'text-white/40'}`} />
                    <span className={`text-xs font-semibold ${selectedTripType === 'oneway' ? 'text-blue-400' : 'text-white/60'}`}>One Way</span>
                    {selectedVehicle && (
                      <span className={`text-base font-bold ${selectedTripType === 'oneway' ? 'text-white' : 'text-white/40'}`}>
                        ${selectedVehicle.basePrice}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleTripTypeChange('roundtrip')}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                    selectedTripType === 'roundtrip'
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ArrowLeftRight className={`w-4 h-4 ${selectedTripType === 'roundtrip' ? 'text-emerald-400' : 'text-white/40'}`} />
                    <span className={`text-xs font-semibold ${selectedTripType === 'roundtrip' ? 'text-emerald-400' : 'text-white/60'}`}>Round Trip</span>
                    {selectedVehicle && (
                      <span className={`text-base font-bold ${selectedTripType === 'roundtrip' ? 'text-white' : 'text-white/40'}`}>
                        ${Math.round(selectedVehicle.basePrice * ROUNDTRIP_MULTIPLIER)}
                      </span>
                    )}
                  </div>
                  {selectedTripType === 'roundtrip' && (
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                      SAVE 5%
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Arrival Details
              </h4>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
                <div className="w-full min-w-0">
                  <label className="block text-white/60 text-[10px] sm:text-xs mb-1.5">
                    <span className="hidden min-[480px]:inline">Pickup Date</span>
                    <span className="inline min-[480px]:hidden">Date</span>
                  </label>
                  <input
                    type="date"
                    value={transferDetails.pickupDate}
                    onChange={(e) => setTransferDetails({ ...transferDetails, pickupDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    aria-label="Pickup date"
                    className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="w-full min-w-0">
                  <label className="block text-white/60 text-[10px] sm:text-xs mb-1.5">
                    <span className="hidden min-[480px]:inline">Pickup Time</span>
                    <span className="inline min-[480px]:hidden">Time</span>
                  </label>
                  <input
                    type="time"
                    value={transferDetails.pickupTime}
                    onChange={(e) => setTransferDetails({ ...transferDetails, pickupTime: e.target.value })}
                    required
                    aria-label="Pickup time"
                    className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-[10px] mb-1.5">Flight Number (optional)</label>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={transferDetails.flightNumber}
                    onChange={(e) => setTransferDetails({ ...transferDetails, flightNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g., AA1234"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className={`space-y-3 overflow-hidden transition-all duration-500 ease-out ${
                isRoundTrip ? 'max-h-[500px] opacity-100 pt-3 border-t border-white/10' : 'max-h-0 opacity-0'
              }`}>
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Return Details
                </h4>

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
                  <div className="w-full min-w-0">
                    <label className="block text-white/60 text-[10px] sm:text-xs mb-1.5">
                      <span className="hidden min-[480px]:inline">Return Date</span>
                      <span className="inline min-[480px]:hidden">Date</span>
                    </label>
                    <input
                      type="date"
                      value={transferDetails.returnDate}
                      onChange={(e) => setTransferDetails({ ...transferDetails, returnDate: e.target.value })}
                      required={isRoundTrip}
                      min={transferDetails.pickupDate || new Date().toISOString().split('T')[0]}
                      aria-label="Return date"
                      className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-white/60 text-[10px] sm:text-xs mb-1.5">
                      <span className="hidden min-[480px]:inline">Return Time</span>
                      <span className="inline min-[480px]:hidden">Time</span>
                    </label>
                    <input
                      type="time"
                      value={transferDetails.returnTime}
                      onChange={(e) => setTransferDetails({ ...transferDetails, returnTime: e.target.value })}
                      required={isRoundTrip}
                      aria-label="Return time"
                      className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-[10px] mb-1.5">Return Flight (optional)</label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={transferDetails.returnFlightNumber}
                      onChange={(e) => setTransferDetails({ ...transferDetails, returnFlightNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g., AA5678"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-[10px]">Total Price</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white">${finalPrice}</span>
                    <span className="text-white/40 text-xs">USD</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[10px]">{selectedVehicle?.name}</p>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {selectedVehicle?.capacity}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Briefcase className="w-3 h-3" /> {selectedVehicle?.luggage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingVehicles || !selectedVehicle}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-white text-lg font-semibold">Enhance Your Journey</h3>
              <p className="text-white/50 text-sm mt-1">Add extras for a more comfortable experience</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base mb-1">Child Safety Seats</h4>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Industry-standard safety seats for your children
                    </p>
                    <p className="text-blue-400 font-bold text-sm mt-2">${CHILD_SEAT_PRICE} per seat</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setChildSeats(Math.max(0, childSeats - 1))}
                    className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={childSeats === 0}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-white">{childSeats}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {childSeats > 0 ? `+$${childSeats * CHILD_SEAT_PRICE * (selectedTripType === 'roundtrip' ? 2 : 1)}` : 'None selected'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChildSeats(Math.min(4, childSeats + 1))}
                    className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={childSeats === 4}
                  >
                    +
                  </button>
                </div>
                {selectedTripType === 'roundtrip' && childSeats > 0 && (
                  <p className="text-xs text-white/60 mt-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Price includes seats for both trips
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base mb-1">Complimentary Beverages</h4>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Enjoy refreshments during your journey
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {BEVERAGES.map((beverage) => {
                    const quantity = selectedBeverages[beverage.id] || 0;
                    const totalPrice = beverage.price * quantity * (selectedTripType === 'roundtrip' ? 2 : 1);
                    return (
                      <div key={beverage.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="mb-3">
                          <p className="text-white text-sm font-semibold">{beverage.name}</p>
                          <p className="text-amber-400 text-xs font-bold mt-0.5">${beverage.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBeverages(prev => ({
                              ...prev,
                              [beverage.id]: Math.max(0, (prev[beverage.id] || 0) - 1)
                            }))}
                            className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-30"
                            disabled={quantity === 0}
                          >
                            −
                          </button>
                          <div className="flex-1 text-center">
                            <span className="text-white text-lg font-bold">{quantity}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBeverages(prev => ({
                              ...prev,
                              [beverage.id]: Math.min(8, (prev[beverage.id] || 0) + 1)
                            }))}
                            className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-30"
                            disabled={quantity === 8}
                          >
                            +
                          </button>
                        </div>
                        {quantity > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-xs text-white/60 text-center">
                              Total: <span className="text-amber-400 font-bold">${totalPrice}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.values(selectedBeverages).some(q => q > 0) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/80 font-semibold">
                      Beverages Total: <span className="text-amber-400">+${Object.entries(selectedBeverages).reduce((total, [id, qty]) => {
                        const bev = BEVERAGES.find(b => b.id === id);
                        return total + (bev ? bev.price * qty : 0);
                      }, 0) * (selectedTripType === 'roundtrip' ? 2 : 1)}</span>
                    </p>
                    {selectedTripType === 'roundtrip' && (
                      <p className="text-xs text-white/50 mt-1">Includes beverages for both trips</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/20 rounded-xl p-4 shadow-lg">
                <p className="text-white/50 text-xs uppercase tracking-wider font-medium mb-3">Price Summary</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Base Transfer</span>
                    <span className="text-white font-semibold">
                      ${selectedTripType === 'roundtrip'
                        ? Math.round((selectedVehicle?.basePrice || 0) * ROUNDTRIP_MULTIPLIER)
                        : selectedVehicle?.basePrice}
                    </span>
                  </div>

                  {childSeats > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400/90 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Child Seats
                      </span>
                      <span className="text-blue-400 font-semibold">
                        +${childSeats * CHILD_SEAT_PRICE * (selectedTripType === 'roundtrip' ? 2 : 1)}
                      </span>
                    </div>
                  )}

                  {Object.values(selectedBeverages).some(q => q > 0) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-400/90 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Beverages
                      </span>
                      <span className="text-amber-400 font-semibold">
                        +${Object.entries(selectedBeverages).reduce((total, [id, qty]) => {
                          const bev = BEVERAGES.find(b => b.id === id);
                          return total + (bev ? bev.price * qty : 0);
                        }, 0) * (selectedTripType === 'roundtrip' ? 2 : 1)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-white/20 flex items-center justify-between">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">${calculatedPrice()}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChildSeats(0);
                  setSelectedBeverages({});
                  setStep(3);
                }}
                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-white/30 text-white/60 hover:text-white/80 transition-all text-sm font-medium"
              >
                No thanks, continue without extras
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 text-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleCustomerSubmit} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white text-base font-semibold">Contact Information</h3>
              <p className="text-white/50 text-xs">How can we reach you?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                    placeholder="John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    required
                    placeholder="john@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder="(809) 555-1234 or +1 (555) 123-4567"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Auto-formats Dominican (809/829/849) and US/international numbers
                </p>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5">Special Requests (optional)</label>
                <textarea
                  value={customerInfo.specialRequests}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, specialRequests: e.target.value })}
                  placeholder="Child seat, wheelchair access..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        );

      case 4:
        return (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="text-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white text-base font-semibold">Review & Pay</h3>
              <p className="text-white/50 text-xs">Verify your booking details</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/20 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Booking Summary</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{customerInfo.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Secure</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-start gap-2 pb-2.5 border-b border-white/5">
                  <Car className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{selectedVehicle?.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      {bookingData.airport} → {bookingData.hotel}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1">
                      {transferDetails.pickupDate} • {transferDetails.pickupTime}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">
                      {selectedVehicle?.name} ({selectedTripType === 'roundtrip' ? 'Round Trip' : 'One Way'})
                    </span>
                    <span className="text-white font-medium text-xs">
                      ${selectedTripType === 'roundtrip'
                        ? Math.round((selectedVehicle?.basePrice || 0) * ROUNDTRIP_MULTIPLIER)
                        : selectedVehicle?.basePrice}
                    </span>
                  </div>

                  {childSeats > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-blue-400" />
                        Child Seats × {childSeats}
                        {selectedTripType === 'roundtrip' && <span className="text-white/40 text-[10px]">(both trips)</span>}
                      </span>
                      <span className="text-white font-medium text-xs">
                        ${childSeats * CHILD_SEAT_PRICE * (selectedTripType === 'roundtrip' ? 2 : 1)}
                      </span>
                    </div>
                  )}

                  {Object.entries(selectedBeverages).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
                    const beverage = BEVERAGES.find(b => b.id === id);
                    if (!beverage) return null;
                    const totalBevPrice = beverage.price * qty * (selectedTripType === 'roundtrip' ? 2 : 1);
                    return (
                      <div key={id} className="flex items-center justify-between">
                        <span className="text-white/60 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {beverage.name} × {qty * (selectedTripType === 'roundtrip' ? 2 : 1)}
                          {selectedTripType === 'roundtrip' && <span className="text-white/40 text-[10px]">(both trips)</span>}
                        </span>
                        <span className="text-white font-medium text-xs">
                          ${totalBevPrice}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2.5 mt-2.5 border-t-2 border-dashed border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Total Amount</p>
                      <p className="text-white/40 text-[10px] mt-0.5">All fees included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${finalPrice}</p>
                      <p className="text-emerald-400 text-[10px] font-medium">USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-3.5 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === 'card'
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'card' ? 'bg-blue-500/30' : 'bg-white/10'
                  }`}>
                    <CreditCard className={`w-4 h-4 ${paymentMethod === 'card' ? 'text-blue-400' : 'text-white/60'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${paymentMethod === 'card' ? 'text-blue-400' : 'text-white'}`}>
                      Pay with Card
                    </p>
                    <p className={`text-xs ${paymentMethod === 'card' ? 'text-blue-400/70' : 'text-white/50'}`}>
                      Secure Stripe checkout
                    </p>
                  </div>
                  {paymentMethod === 'card' && <CheckCircle className="w-5 h-5 text-blue-400" />}
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || (paymentMethod === 'card' && finalPrice <= 0)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {paymentMethod === 'card' ? 'Pay Now' : 'Complete'}
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        );

      case 5:
        return (
          <div className="text-center space-y-5 py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 absolute top-0 right-1/4 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1">Booking Confirmed!</h3>
              <p className="text-white/60 text-sm">Your transfer is all set</p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-white/50 text-xs mb-1">Confirmation Number</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{reference}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 text-left space-y-2 border border-white/10 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Route</span>
                <span className="text-white font-medium truncate ml-2">{bookingData.airport} → {bookingData.hotel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Date</span>
                <span className="text-white font-medium">{transferDetails.pickupDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Vehicle</span>
                <span className="text-white font-medium">{selectedVehicle?.name}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between">
                <span className="text-white/50">Total</span>
                <span className="text-emerald-400 font-bold">${finalPrice} USD</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5">
              <p className="text-blue-400 text-xs">
                Confirmation sent to {customerInfo.email}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={step !== 4 ? onClose : undefined}
      />

      <div
        className={`relative w-full sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-all duration-500 ease-out ${
          animateIn ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 sm:scale-95'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Book Transfer</h2>
              {step < 4 && (
                <p className="text-white/50 text-[10px]">Step {step} of 3</p>
              )}
            </div>
          </div>

          {step !== 4 && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {step < 4 && (
          <div className="px-3 pt-2">
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    s < step ? 'bg-emerald-500' : s === step ? 'bg-blue-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {renderStep()}
        </div>
      </div>
    </div>,
    document.body
  );
}
