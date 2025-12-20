import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

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
        message: `Booking created successfully! Reference: ${booking.reference}`,
        payment_required: true,
        payment_url: `${supabaseUrl.replace('.supabase.co', '')}/booking/${booking.id}`
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