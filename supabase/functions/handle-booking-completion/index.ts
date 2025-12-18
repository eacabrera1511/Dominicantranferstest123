import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompletionRequest {
  assignment_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { assignment_id }: CompletionRequest = await req.json();

    const { data: assignment, error: assignmentError } = await supabase
      .from('trip_assignments')
      .select(`
        *,
        booking:bookings(*),
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('id', assignment_id)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Assignment not found');
    }

    await supabase
      .from('bookings')
      .update({
        workflow_status: 'completed',
      })
      .eq('id', assignment.booking_id);

    const taxRate = 0.15;
    const subtotal = assignment.booking.price;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        booking_id: assignment.booking.id,
        customer_id: assignment.booking.customer_id,
        assignment_id: assignment.id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'sent',
        line_items: [
          {
            description: assignment.booking.service_type || 'Transportation Service',
            quantity: 1,
            unit_price: subtotal,
            total: subtotal,
          },
        ],
      })
      .select()
      .single();

    if (assignment.booking.customer_id) {
      await supabase
        .from('customers')
        .update({
          total_bookings: supabase.raw('total_bookings + 1'),
          total_spent: supabase.raw('total_spent + ?', [subtotal]),
          last_booking_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', assignment.booking.customer_id);

      await supabase.from('review_requests').insert({
        booking_id: assignment.booking.id,
        customer_id: assignment.booking.customer_id,
        driver_id: assignment.driver_id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await supabase.from('customer_activity_log').insert({
        customer_id: assignment.booking.customer_id,
        activity_type: 'trip_completed',
        details: {
          booking_id: assignment.booking.id,
          driver_id: assignment.driver_id,
          completion_time: assignment.dropoff_completed_at,
          amount: subtotal,
        },
      });
    }

    if (assignment.booking.partner_id) {
      await supabase
        .from('partner_transactions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('booking_id', assignment.booking.id)
        .eq('transaction_type', 'commission_pending');
    }

    await supabase
      .from('vehicles')
      .update({
        mileage: supabase.raw('mileage + 50'),
      })
      .eq('id', assignment.vehicle_id);

    await supabase
      .from('bookings')
      .update({
        completion_email_sent: true,
      })
      .eq('id', assignment.booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: assignment.booking.id,
        invoice_id: invoice?.id,
        review_request_created: true,
        workflow_status: 'completed',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-booking-completion:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
