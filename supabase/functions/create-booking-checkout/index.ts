import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckoutRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  productName?: string;
  productDescription?: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecret) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Payment system not configured. Please contact support.',
          details: 'STRIPE_SECRET_KEY missing'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'Travelsmart Booking',
        version: '1.0.0',
      },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: CheckoutRequest = await req.json();
    const {
      bookingId,
      amount,
      currency = 'usd',
      productName = 'Airport Transfer',
      productDescription,
      customerEmail,
      customerName,
      successUrl,
      cancelUrl,
      metadata = {},
    } = body;

    console.log('Checkout request received:', { bookingId, amount, currency, successUrl, cancelUrl });

    if (!bookingId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: bookingId, successUrl, cancelUrl'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('Invalid amount received:', { amount, numericAmount });
      return new Response(
        JSON.stringify({
          error: 'Invalid amount. Amount must be a positive number.',
          received: amount
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const unitAmount = Math.round(numericAmount * 100);

    if (unitAmount < 50) {
      console.error('Amount too small for Stripe:', { amount: numericAmount, unitAmount });
      return new Response(
        JSON.stringify({
          error: 'Minimum charge amount is $0.50 USD',
          received: numericAmount
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating Stripe checkout session:', {
      bookingId,
      amount: numericAmount,
      unitAmount,
      currency
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productName,
              description: productDescription || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        booking_id: bookingId,
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        amount: numericAmount.toString(),
        currency: currency.toLowerCase(),
        ...metadata,
      },
    });

    console.log(`Created checkout session ${session.id} for booking ${bookingId}`);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'payment_pending',
        payment_status: 'pending',
        payment_details: {
          stripe_session_id: session.id,
          amount: numericAmount,
          unit_amount: unitAmount,
          currency: currency.toLowerCase(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking with session ID:', updateError);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session',
        type: error.type || 'unknown'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});