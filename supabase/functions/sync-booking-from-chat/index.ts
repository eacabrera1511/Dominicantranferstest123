import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatBooking {
  conversation_id: string;
  booking_type: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;
  vehicle_type: string;
  passenger_count?: number;
  luggage_count?: number;
  special_requests?: string;
  price?: number;
  details?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const chatBooking: ChatBooking = await req.json();

    if (!chatBooking.customer_email || !chatBooking.customer_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customer_email, customer_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', chatBooking.customer_email)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      const { data: bookingCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      await supabase
        .from('customers')
        .update({
          total_bookings: (bookingCount as any)?.count || 0,
          last_booking_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    } else {
      const nameParts = chatBooking.customer_name.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: chatBooking.customer_email,
          phone: chatBooking.customer_phone || null,
          first_name: firstName,
          last_name: lastName,
          customer_type: 'individual',
          total_bookings: 1,
          last_booking_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (customerError) {
        throw customerError;
      }

      customerId = newCustomer.id;

      await supabase
        .from('customer_preferences')
        .insert({
          customer_id: customerId,
          preferred_vehicle_types: chatBooking.vehicle_type ? [chatBooking.vehicle_type] : [],
        });
    }

    const bookingReference = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const bookingData: any = {
      conversation_id: chatBooking.conversation_id,
      booking_type: chatBooking.booking_type || 'airport_transfer',
      reference: bookingReference,
      source: 'chat',
      customer_id: customerId,
      pickup_address: chatBooking.pickup_address,
      dropoff_address: chatBooking.dropoff_address,
      pickup_datetime: chatBooking.pickup_datetime,
      vehicle_type: chatBooking.vehicle_type,
      passenger_count: chatBooking.passenger_count || 1,
      luggage_count: chatBooking.luggage_count || 0,
      special_requests: chatBooking.special_requests || null,
      price: chatBooking.price || 0,
      details: chatBooking.details || {},
      status: 'pending',
      workflow_status: 'pending',
      payment_status: 'pending',
    };

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('conversation_id', chatBooking.conversation_id)
      .maybeSingle();

    let bookingId: string;
    if (existingBooking) {
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', existingBooking.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      bookingId = updatedBooking.id;
    } else {
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }
      bookingId = newBooking.id;
    }

    const orderData = {
      booking_type: chatBooking.booking_type || 'airport_transfer',
      reference_id: bookingId,
      item_name: `${chatBooking.vehicle_type || 'Transfer'} - ${chatBooking.pickup_address} to ${chatBooking.dropoff_address}`,
      quantity: 1,
      unit_price: chatBooking.price || 0,
      total_price: chatBooking.price || 0,
      customer_email: chatBooking.customer_email,
      customer_name: chatBooking.customer_name,
      details: {
        pickup_address: chatBooking.pickup_address,
        dropoff_address: chatBooking.dropoff_address,
        pickup_datetime: chatBooking.pickup_datetime,
        vehicle_type: chatBooking.vehicle_type,
        passenger_count: chatBooking.passenger_count,
        luggage_count: chatBooking.luggage_count,
      },
      status: 'pending',
      payment_status: 'pending',
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customerId,
        booking_id: bookingId,
        booking_reference: bookingReference,
        order_id: order?.id,
        message: 'Booking synced to CRM successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing booking from chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});