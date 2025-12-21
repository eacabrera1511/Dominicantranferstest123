import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ROUNDTRIP_MULTIPLIER = 1.9;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseKey;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received booking request:', JSON.stringify(body, null, 2));

    const {
      customer_name,
      customer_email,
      customer_phone,
      pickup_location,
      dropoff_location,
      pickup_datetime,
      passengers,
      vehicle_type_id,
      vehicle_name,
      flight_number,
      special_requests,
      trip_type,
      source
    } = body;

    if (!customer_email || !pickup_location || !dropoff_location || !pickup_datetime) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: customer_email, pickup_location, dropoff_location, pickup_datetime'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: vehicleTypes } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true);

    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true);

    const { data: hotelZones } = await supabase
      .from('hotel_zones')
      .select('*')
      .eq('is_active', true);

    const { data: discount } = await supabase
      .from('global_discount_settings')
      .select('discount_percentage')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const discountPercentage = discount?.discount_percentage ? Number(discount.discount_percentage) : 0;
    console.log('Active discount:', discountPercentage, '%');

    const findZone = (location: string): string | null => {
      const lowerLocation = location.toLowerCase();
      if (lowerLocation.includes('puj') || lowerLocation.includes('punta cana airport')) return 'PUJ';
      if (lowerLocation.includes('sdq') || lowerLocation.includes('santo domingo airport') || lowerLocation.includes('las americas')) return 'SDQ';
      if (lowerLocation.includes('lrm') || lowerLocation.includes('la romana airport')) return 'LRM';
      if (lowerLocation.includes('pop') || lowerLocation.includes('puerto plata')) return 'POP';

      for (const zone of hotelZones || []) {
        if (lowerLocation.includes(zone.hotel_name.toLowerCase())) {
          return zone.zone_code;
        }
        for (const term of zone.search_terms || []) {
          if (lowerLocation.includes(term.toLowerCase())) {
            return zone.zone_code;
          }
        }
      }
      return null;
    };

    const originZone = findZone(pickup_location);
    const destinationZone = findZone(dropoff_location);
    console.log('Zones - Origin:', originZone, 'Destination:', destinationZone);

    let selectedVehicle = vehicleTypes?.find(v => 
      v.name.toLowerCase() === (vehicle_name || 'sedan').toLowerCase()
    ) || vehicleTypes?.[0];

    if (vehicle_type_id) {
      const byId = vehicleTypes?.find(v => v.id === vehicle_type_id);
      if (byId) selectedVehicle = byId;
    }
    console.log('Selected vehicle:', selectedVehicle?.name);

    let matchingRule = null;
    const lowerDropoff = dropoff_location.toLowerCase();
    for (const rule of pricingRules || []) {
      if (rule.vehicle_type_id !== selectedVehicle?.id) continue;
      if (rule.origin !== originZone) continue;
      if (rule.destination.toLowerCase() === lowerDropoff ||
          lowerDropoff.includes(rule.destination.toLowerCase()) ||
          rule.destination === destinationZone) {
        matchingRule = rule;
        break;
      }
    }

    if (!matchingRule && originZone && destinationZone) {
      matchingRule = pricingRules?.find(r =>
        r.vehicle_type_id === selectedVehicle?.id &&
        r.origin === originZone &&
        r.destination === destinationZone
      );
    }

    let basePrice = matchingRule?.base_price ? Number(matchingRule.base_price) : selectedVehicle?.minimum_fare || 50;
    console.log('Base price from rule:', basePrice);

    let oneWayPrice = basePrice;
    if (discountPercentage > 0) {
      oneWayPrice = Math.round(basePrice * (1 - discountPercentage / 100));
    }
    console.log('One-way price after discount:', oneWayPrice);

    const isRoundTrip = trip_type === 'round_trip' || trip_type === 'roundtrip';
    const roundTripPrice = Math.round(oneWayPrice * ROUNDTRIP_MULTIPLIER);
    const totalPrice = isRoundTrip ? roundTripPrice : oneWayPrice;
    console.log('Final price after trip type:', totalPrice, '(round trip:', isRoundTrip, ')');

    const originalPrice = isRoundTrip
      ? Math.round(basePrice * ROUNDTRIP_MULTIPLIER)
      : basePrice;

    const bookingData = {
      customer_name: customer_name || 'Voice Booking',
      customer_email,
      customer_phone: customer_phone || null,
      pickup_location,
      dropoff_location,
      pickup_datetime,
      passengers: passengers || 1,
      vehicle_type: selectedVehicle?.name || 'Sedan',
      vehicle_type_id: selectedVehicle?.id || null,
      flight_number: flight_number || null,
      special_requests: special_requests || null,
      total_price: totalPrice,
      payment_status: 'pending',
      payment_method: 'pending',
      status: 'pending',
      source: source || 'voice_agent',
      booking_type: 'transfer',
      price_source: matchingRule ? 'pricing_rules' : 'fallback',
      details: {
        trip_type: isRoundTrip ? 'round_trip' : 'one_way',
        booked_via: 'elevenlabs_voice_agent',
        booking_timestamp: new Date().toISOString(),
        base_price: basePrice,
        original_price: originalPrice,
        discount_applied: discountPercentage > 0 ? discountPercentage : null,
        origin_zone: originZone,
        destination_zone: destinationZone
      }
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      throw bookingError;
    }
    console.log('Booking created:', booking.reference);

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customer_email)
      .maybeSingle();

    if (existingCustomer) {
      await supabase
        .from('customers')
        .update({
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
          total_spent: (parseFloat(existingCustomer.total_spent) || 0) + totalPrice,
          last_booking_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id);
    } else {
      const nameParts = (customer_name || '').split(' ');
      await supabase
        .from('customers')
        .insert([{
          email: customer_email,
          phone: customer_phone || null,
          first_name: nameParts[0] || 'Voice',
          last_name: nameParts.slice(1).join(' ') || 'Customer',
          total_bookings: 1,
          total_spent: totalPrice,
          last_booking_at: new Date().toISOString()
        }]);
    }

    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('website_url')
      .maybeSingle();

    const websiteUrl = companySettings?.website_url || 'https://dominicantransfers.com';
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');

    let checkoutUrl = null;
    let stripeSessionId = null;
    let stripeErrorMessage = null;

    if (!stripeApiKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      stripeErrorMessage = 'Payment system not configured';
    } else if (totalPrice < 1) {
      stripeErrorMessage = 'Price too low for payment';
    } else {
      try {
        const stripe = new Stripe(stripeApiKey, {
          appInfo: { name: 'Dominican Transfers Voice Booking', version: '2.0.0' },
        });

        const unitAmount = Math.round(totalPrice * 100);
        console.log('Creating Stripe session for', unitAmount, 'cents');

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Transfer - ${selectedVehicle?.name || 'Sedan'}`,
                description: `${pickup_location} to ${dropoff_location}`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${websiteUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
          cancel_url: `${websiteUrl}/booking/${booking.id}`,
          customer_email: customer_email,
          metadata: {
            booking_id: booking.id,
            booking_reference: booking.reference,
            customer_email: customer_email,
            customer_name: customer_name || 'Voice Customer',
            amount: totalPrice.toString(),
            currency: 'usd',
            source: 'elevenlabs_voice_agent'
          },
        });

        checkoutUrl = session.url;
        stripeSessionId = session.id;
        console.log('Stripe session created:', stripeSessionId);

        await supabase
          .from('bookings')
          .update({
            stripe_session_id: stripeSessionId,
            payment_url: checkoutUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        stripeErrorMessage = stripeError.message || 'Payment system error';
      }
    }

    let emailSent = false;
    let emailError = null;
    try {
      console.log('Sending payment link email...');
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          emailType: 'payment_link',
          paymentUrl: checkoutUrl
        })
      });

      const emailResult = await emailResponse.json();
      console.log('Email response:', JSON.stringify(emailResult));
      emailSent = emailResult.emailSent === true;
      if (!emailSent) {
        emailError = emailResult.error || emailResult.message || 'Email not sent';
      }
    } catch (e: any) {
      console.error('Email error:', e);
      emailError = e.message;
    }

    try {
      console.log('Sending admin notification...');
      await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          emailType: 'admin_notification',
          adminEmail: 'info@dominicantransfers.com'
        })
      });
    } catch (e) {
      console.error('Admin notification error:', e);
    }

    const responseMessage = checkoutUrl && emailSent
      ? `Booking ${booking.reference} created! Confirmation email sent to ${customer_email}. Total: $${totalPrice} USD.`
      : checkoutUrl
        ? `Booking ${booking.reference} created! Total: $${totalPrice} USD. Payment link generated.`
        : `Booking ${booking.reference} created! Total: $${totalPrice} USD. We will contact you for payment.`;

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          reference: booking.reference,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_datetime: booking.pickup_datetime,
          passengers: booking.passengers,
          vehicle_type: booking.vehicle_type,
          total_price: totalPrice,
          original_price: originalPrice,
          discount_percentage: discountPercentage,
          status: booking.status,
          payment_status: booking.payment_status
        },
        message: responseMessage,
        payment_url: checkoutUrl || null,
        stripe_session_id: stripeSessionId || null,
        email_sent: emailSent,
        email_error: emailError,
        stripe_error: stripeErrorMessage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create booking' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});