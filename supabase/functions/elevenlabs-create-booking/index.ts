import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
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
      total_price,
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

    const bookingData = {
      customer_name: customer_name || 'Voice Booking',
      customer_email,
      customer_phone: customer_phone || null,
      pickup_location,
      dropoff_location,
      pickup_datetime,
      passengers: passengers || 1,
      vehicle_type: vehicle_name || 'Sedan',
      vehicle_type_id: vehicle_type_id || null,
      flight_number: flight_number || null,
      special_requests: special_requests || null,
      total_price: total_price || 0,
      payment_status: 'pending',
      payment_method: 'pending',
      status: 'pending',
      source: source || 'voice_agent',
      booking_type: 'transfer',
      details: {
        trip_type: trip_type || 'one_way',
        booked_via: 'elevenlabs_voice_agent',
        booking_timestamp: new Date().toISOString()
      }
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) throw bookingError;

    let customer = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customer_email)
      .maybeSingle();

    if (existingCustomer) {
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .update({
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
          total_spent: (parseFloat(existingCustomer.total_spent) || 0) + parseFloat(total_price || 0),
          last_booking_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();
      customer = updatedCustomer;
    } else {
      const nameParts = (customer_name || '').split(' ');
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert([{
          email: customer_email,
          phone: customer_phone || null,
          first_name: nameParts[0] || 'Voice',
          last_name: nameParts.slice(1).join(' ') || 'Customer',
          total_bookings: 1,
          total_spent: parseFloat(total_price || 0),
          last_booking_at: new Date().toISOString()
        }])
        .select()
        .single();
      customer = newCustomer;
    }

    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('website_url')
      .single();

    const websiteUrl = companySettings?.website_url || 'https://dominicantransfers.com';
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');

    let checkoutUrl = null;
    let stripeSessionId = null;
    let stripeErrorMessage = null;

    if (!stripeApiKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      stripeErrorMessage = 'Payment system not configured';
    } else if (!total_price || total_price <= 0) {
      console.error('❌ Invalid total_price:', total_price);
      stripeErrorMessage = 'Invalid booking amount';
    } else {
      try {
        console.log('💳 Creating Stripe checkout session inline...');
        console.log('💰 Amount:', total_price, 'USD');

        const stripe = new Stripe(stripeApiKey, {
          appInfo: {
            name: 'Dominican Transfers Voice Booking',
            version: '1.0.0',
          },
        });

        const unitAmount = Math.round(total_price * 100);

        if (unitAmount < 50) {
          throw new Error('Minimum charge amount is $0.50 USD');
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Transfer - ${vehicle_name}`,
                description: `${pickup_location} → ${dropoff_location}`,
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
            amount: total_price.toString(),
            currency: 'usd',
            source: 'elevenlabs_voice_agent',
            trip_type: trip_type || 'one_way'
          },
        });

        checkoutUrl = session.url;
        stripeSessionId = session.id;

        console.log('✅ Stripe session created:', stripeSessionId);
        console.log('💳 Payment URL:', checkoutUrl);

        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            stripe_session_id: stripeSessionId,
            payment_url: checkoutUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error('❌ Failed to update booking with Stripe session:', updateError);
        } else {
          console.log('✅ Booking updated with payment URL');
        }
      } catch (stripeError: any) {
        console.error('❌ Stripe checkout error:', stripeError);
        stripeErrorMessage = stripeError.message || 'Payment system error';
      }
    }

    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          emailType: 'confirmation'
        })
      });

      if (!emailResponse.ok) {
        const emailErrorData = await emailResponse.json();
        console.error('Email sending failed:', emailErrorData);
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending booking email:', emailError);
    }

    const responseMessage = checkoutUrl
      ? `Booking ${booking.reference} created successfully! A confirmation email with payment link has been sent to ${customer_email}`
      : `Booking ${booking.reference} created! ${stripeErrorMessage ? 'Payment link will be sent separately. Error: ' + stripeErrorMessage : 'Payment link will be sent via email.'}`;

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
          total_price: booking.total_price,
          status: booking.status,
          payment_status: booking.payment_status
        },
        message: responseMessage,
        payment_required: true,
        payment_url: checkoutUrl || null,
        stripe_session_id: stripeSessionId || null,
        payment_link_generated: !!checkoutUrl,
        stripe_error: stripeErrorMessage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
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