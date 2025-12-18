import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const config = {
      stripe_configured: !!stripeKey,
      stripe_key_format: stripeKey ? (stripeKey.startsWith('sk_test_') ? 'test' : stripeKey.startsWith('sk_live_') ? 'live' : 'invalid') : 'missing',
      webhook_configured: !!webhookSecret,
      webhook_format: webhookSecret ? (webhookSecret.startsWith('whsec_') ? 'valid' : 'invalid') : 'missing',
      timestamp: new Date().toISOString(),
    };

    const allConfigured = config.stripe_configured &&
                          config.webhook_configured &&
                          config.stripe_key_format !== 'invalid' &&
                          config.webhook_format === 'valid';

    return new Response(
      JSON.stringify({
        status: allConfigured ? 'ready' : 'incomplete',
        message: allConfigured
          ? 'Stripe is properly configured and ready to accept payments'
          : 'Stripe configuration is incomplete. Check the missing items below.',
        config,
        instructions: !allConfigured ? 'See STRIPE_SETUP.md for configuration instructions' : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 'error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});