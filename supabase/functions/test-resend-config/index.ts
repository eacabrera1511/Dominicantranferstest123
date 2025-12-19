import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Dominican Transfers <Booking@dominicantransfers.com>';

    const config = {
      resend_configured: !!resendApiKey,
      resend_key_format: resendApiKey ? (resendApiKey.startsWith('re_') ? 'valid' : 'invalid') : 'missing',
      from_email: resendFromEmail,
      timestamp: new Date().toISOString(),
    };

    let testEmailResult = null;
    let testEmailError = null;

    if (resendApiKey) {
      try {
        console.log('Testing Resend API with test email...');
        const testResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: ['eacabrera1511@gmail.com'],
            subject: 'Test Email - Dominican Transfers Configuration',
            html: `<h1>Test Email Successful</h1>
                   <p>This is a test email from Dominican Transfers.</p>
                   <p>Time: ${new Date().toISOString()}</p>
                   <p>If you receive this, your email configuration is working!</p>`,
          }),
        });

        const testResult = await testResponse.json();

        if (testResponse.ok) {
          testEmailResult = {
            success: true,
            id: testResult.id,
            message: 'Test email sent successfully!',
          };
        } else {
          testEmailError = {
            success: false,
            error: testResult.message || testResult.error?.message || JSON.stringify(testResult),
            status: testResponse.status,
          };
        }
      } catch (error: any) {
        testEmailError = {
          success: false,
          error: error.message,
        };
      }
    }

    const allConfigured = config.resend_configured && config.resend_key_format === 'valid';

    return new Response(
      JSON.stringify({
        status: allConfigured ? (testEmailResult ? 'ready' : 'configured_but_error') : 'incomplete',
        message: allConfigured
          ? (testEmailResult
              ? 'Resend is properly configured and test email sent successfully!'
              : 'Resend is configured but test email failed')
          : 'Resend configuration is incomplete. Check the missing items below.',
        config,
        testEmail: testEmailResult || testEmailError,
        instructions: !allConfigured ? 'Configure RESEND_API_KEY and RESEND_FROM_EMAIL in Supabase secrets' : null,
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
