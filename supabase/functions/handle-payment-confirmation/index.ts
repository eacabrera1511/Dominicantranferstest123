import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentConfirmation {
  booking_id: string;
  payment_method: string;
  amount_paid: number;
  stripe_payment_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payment: PaymentConfirmation = await req.json();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, customer:customers(*)')
      .eq('id', payment.booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        workflow_status: 'awaiting_assignment',
      })
      .eq('id', booking.id);

    await supabase.from('payment_transactions').insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      amount: payment.amount_paid,
      payment_method: payment.payment_method,
      stripe_payment_id: payment.stripe_payment_id,
      status: 'completed',
      transaction_date: new Date().toISOString(),
    });

    if (booking.customer_id) {
      await supabase
        .from('customers')
        .update({
          total_spent: supabase.raw('total_spent + ?', [payment.amount_paid]),
        })
        .eq('id', booking.customer_id);

      await supabase.from('customer_activity_log').insert({
        customer_id: booking.customer_id,
        activity_type: 'payment_received',
        details: {
          booking_id: booking.id,
          amount: payment.amount_paid,
          method: payment.payment_method,
        },
      });
    }

    if (booking.partner_id) {
      const { data: partner } = await supabase
        .from('partners')
        .select('commission_rate')
        .eq('id', booking.partner_id)
        .single();

      if (partner) {
        const commissionAmount = payment.amount_paid * (partner.commission_rate / 100);
        const platformFee = payment.amount_paid * 0.03;

        await supabase.from('partner_transactions').insert({
          partner_id: booking.partner_id,
          booking_id: booking.id,
          transaction_type: 'commission_pending',
          amount: commissionAmount,
          platform_fee: platformFee,
          status: 'pending',
        });
      }
    }

    const pickupTime = new Date(booking.pickup_datetime);
    const now = new Date();
    const hoursUntilPickup = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilPickup <= 24 && hoursUntilPickup > 0) {
      await fetch(`${supabaseUrl}/functions/v1/auto-dispatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: booking.id }),
      }).catch(() => {});
    }

    await supabase.from('admin_notifications').insert({
      type: 'payment_received',
      message: `Payment received for booking ${booking.id}`,
      data: {
        booking_id: booking.id,
        amount: payment.amount_paid,
        customer_id: booking.customer_id,
      },
      priority: 'normal',
    });

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        workflow_status: 'awaiting_assignment',
        auto_dispatch_triggered: hoursUntilPickup <= 24,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-payment-confirmation:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
