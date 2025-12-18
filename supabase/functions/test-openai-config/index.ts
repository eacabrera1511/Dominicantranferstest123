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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const config = {
      openai_configured: !!openaiApiKey,
      openai_key_format: openaiApiKey ? (openaiApiKey.startsWith('sk-') ? 'valid' : 'invalid') : 'missing',
      key_length: openaiApiKey ? openaiApiKey.length : 0,
      key_preview: openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : 'missing',
      timestamp: new Date().toISOString(),
    };

    let testResult = null;
    let testError = null;

    if (openaiApiKey) {
      try {
        console.log('Testing OpenAI API with simple completion...');
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: 'Say "OpenAI is working!" if you can read this.' }
            ],
            max_tokens: 20,
          }),
        });

        const result = await testResponse.json();

        if (testResponse.ok) {
          testResult = {
            success: true,
            response: result.choices[0]?.message?.content || 'No response',
            message: 'OpenAI API is working!',
          };
        } else {
          testError = {
            success: false,
            error: result.error?.message || JSON.stringify(result),
            status: testResponse.status,
          };
        }
      } catch (error: any) {
        testError = {
          success: false,
          error: error.message,
        };
      }
    }

    const allConfigured = config.openai_configured && config.openai_key_format === 'valid';

    return new Response(
      JSON.stringify({
        status: allConfigured ? (testResult ? 'ready' : 'configured_but_error') : 'incomplete',
        message: allConfigured
          ? (testResult
              ? 'OpenAI is properly configured and working!'
              : 'OpenAI is configured but API test failed')
          : 'OpenAI configuration is incomplete. The OPENAI_API_KEY is missing.',
        config,
        test: testResult || testError,
        instructions: !allConfigured ? 'The OPENAI_API_KEY secret needs to be configured in Supabase project settings.' : null,
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