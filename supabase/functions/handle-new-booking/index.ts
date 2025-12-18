import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_NOTIFICATION_EMAIL = 'eacabrera1511@gmail.com';

interface NewBookingRequest {
  booking_id: string;
}

async function sendBookingEmails(supabaseUrl: string, bookingId: string): Promise<void> {
  const functionUrl = `${supabaseUrl}/functions/v1/send-booking-email`;
  const authHeader = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;

  console.log(`📧 Sending booking emails for booking ID: ${bookingId}`);

  try {
    console.log('📨 Sending admin notification email to:', ADMIN_NOTIFICATION_EMAIL);
    const adminResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        bookingId: bookingId,
        emailType: 'admin_notification',
        adminEmail: ADMIN_NOTIFICATION_EMAIL,
      }),
    });

    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.error('❌ Admin email response not OK:', adminResponse.status, errorText);
    } else {
      const adminResult = await adminResponse.json();
      console.log('✅ Admin notification email result:', adminResult);
    }
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
  }

  try {
    console.log('📨 Sending customer confirmation email');
    const customerResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        bookingId: bookingId,
        emailType: 'confirmation',
      }),
    });

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('❌ Customer email response not OK:', customerResponse.status, errorText);
    } else {
      const customerResult = await customerResponse.json();
      console.log('✅ Customer confirmation email result:', customerResult);
    }
  } catch (error) {
    console.error('❌ Failed to send customer confirmation email:', error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { booking_id }: NewBookingRequest = await req.json();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    let customer;
    if (booking.customer_email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', booking.customer_email)
        .maybeSingle();

      if (existingCustomer) {
        customer = existingCustomer;

        await supabase
          .from('customers')
          .update({
            total_bookings: (existingCustomer.total_bookings || 0) + 1,
            last_booking_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', existingCustomer.id);
      } else {
        const nameParts = (booking.customer_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            email: booking.customer_email,
            first_name: firstName,
            last_name: lastName,
            phone: booking.customer_phone || '',
            total_bookings: 1,
            last_booking_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        customer = newCustomer;
      }

      if (customer) {
        await supabase
          .from('bookings')
          .update({ customer_id: customer.id })
          .eq('id', booking.id);

        await supabase.from('customer_activity_log').insert({
          customer_id: customer.id,
          activity_type: 'booking_created',
          details: {
            booking_id: booking.id,
            service_type: booking.service_type,
            amount: booking.price,
          },
        });
      }
    }

    await supabase.from('admin_notifications').insert({
      type: 'new_booking',
      message: `New booking received: ${booking.service_type || 'Transfer'}`,
      data: {
        booking_id: booking.id,
        customer_id: customer?.id,
        pickup_datetime: booking.pickup_datetime,
        price: booking.price,
      },
      priority: 'high',
    });

    await sendBookingEmails(supabaseUrl, booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        customer_id: customer?.id,
        notifications_sent: true,
        admin_email_sent_to: ADMIN_NOTIFICATION_EMAIL,
        customer_confirmation_sent_to: booking.customer_email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-new-booking:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});