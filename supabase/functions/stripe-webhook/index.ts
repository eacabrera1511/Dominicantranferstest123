import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecret || !stripeWebhookSecret) {
      console.error('Missing Stripe configuration:', {
        hasSecretKey: !!stripeSecret,
        hasWebhookSecret: !!stripeWebhookSecret
      });
      return new Response('Stripe not configured', { status: 503, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'Travelsmart Integration',
        version: '1.0.0',
      },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header');
      return new Response('No signature found', { status: 400, headers: corsHeaders });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400, headers: corsHeaders });
    }

    console.log(`Received Stripe event: ${event.type}, id: ${event.id}`);

    EdgeRuntime.waitUntil(handleEvent(event, supabase));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleEvent(event: Stripe.Event, supabase: any) {
  console.log(`Processing event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const {
      id: checkoutSessionId,
      payment_intent: paymentIntent,
      amount_total: amountTotal,
      currency,
      payment_status: paymentStatus,
      metadata,
      customer_email: customerEmail,
    } = session;

    console.log(`Checkout session completed: ${checkoutSessionId}`);
    console.log(`Payment status: ${paymentStatus}`);
    console.log(`Amount: ${amountTotal} ${currency}`);
    console.log(`Metadata:`, metadata);

    if (paymentStatus !== 'paid') {
      console.log('Payment not yet paid, skipping booking update');
      return;
    }

    const bookingId = metadata?.booking_id;

    if (!bookingId) {
      console.error('No booking_id in session metadata');
      return;
    }

    console.log(`Updating booking ${bookingId} after successful payment`);

    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('payment_status, status, reference, source')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching booking ${bookingId}:`, fetchError);
      return;
    }

    if (!existingBooking) {
      console.error(`Booking ${bookingId} not found`);
      return;
    }

    if (existingBooking.payment_status === 'paid') {
      console.log(`Booking ${bookingId} already marked as paid, skipping (idempotent)`);
      return;
    }

    const updateData: any = {
      status: 'confirmed',
      payment_status: 'paid',
      payment_details: {
        stripe_session_id: checkoutSessionId,
        stripe_payment_intent: paymentIntent,
        paid_amount: amountTotal ? amountTotal / 100 : null,
        currency: currency,
        paid_at: new Date().toISOString(),
      },
      workflow_status: 'pending_dispatch',
      updated_at: new Date().toISOString(),
    };

    if (!existingBooking.reference) {
      updateData.reference = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    if (!existingBooking.source) {
      updateData.source = 'web';
    }

    const { error: bookingError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (bookingError) {
      console.error(`Error updating booking ${bookingId}:`, bookingError);
    } else {
      console.log(`Successfully confirmed booking ${bookingId} - payment complete`);

      if (metadata?.incomplete_booking_id) {
        try {
          await supabase
            .from('incomplete_bookings')
            .update({ completed: true })
            .eq('id', metadata.incomplete_booking_id);
          console.log(`Marked incomplete booking ${metadata.incomplete_booking_id} as completed`);
        } catch (incompleteError) {
          console.error('Error marking incomplete booking as completed:', incompleteError);
        }
      }

      try {
        const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-new-booking`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ booking_id: bookingId }),
        });

        const result = await response.json();
        console.log('Sent booking emails and notifications:', result);
      } catch (emailError: any) {
        console.error('Failed to send booking notifications:', emailError);
      }
    }

    try {
      await supabase.rpc('auto_dispatch_booking', { p_booking_id: bookingId }).catch(() => {
        console.log('Auto dispatch RPC not available, skipping');
      });
    } catch (err) {
      console.log('Note: Auto dispatch skipped');
    }

    try {
      const { error: orderError } = await supabase
        .from('stripe_orders')
        .upsert({
          checkout_session_id: checkoutSessionId,
          payment_intent_id: paymentIntent,
          customer_id: session.customer as string || null,
          amount_subtotal: session.amount_subtotal,
          amount_total: amountTotal,
          currency: currency,
          payment_status: paymentStatus,
          status: 'completed',
          metadata: {
            booking_id: bookingId,
            customer_email: customerEmail || metadata?.customer_email,
            customer_name: metadata?.customer_name,
          },
        }, {
          onConflict: 'checkout_session_id'
        });

      if (orderError) {
        console.log('Note: stripe_orders table may not exist:', orderError.message);
      }
    } catch (err) {
      console.log('Note: stripe_orders insert skipped');
    }

    try {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          stripe_payment_id: paymentIntent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('details->>crmBookingId', bookingId);
    } catch (err) {
      console.log('Note: Orders table update skipped');
    }

  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      console.log(`Checkout expired for booking ${bookingId}`);

      await supabase
        .from('bookings')
        .update({
          status: 'payment_expired',
          payment_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('payment_status', 'pending');
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.booking_id;

    if (bookingId) {
      console.log(`Payment failed for booking ${bookingId}`);

      await supabase
        .from('bookings')
        .update({
          status: 'payment_failed',
          payment_status: 'failed',
          payment_details: {
            stripe_payment_intent: paymentIntent.id,
            failure_message: paymentIntent.last_payment_error?.message,
            failed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
    }
  }
}