import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CancellationRequest {
  token: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, reason }: CancellationRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing cancellation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: cancellationRequest, error: requestError } = await supabase
      .from('booking_cancellation_requests')
      .select('*, bookings(*)')
      .eq('cancellation_token', token)
      .maybeSingle();

    if (requestError || !cancellationRequest) {
      console.error('Cancellation request fetch error:', requestError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired cancellation token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cancellationRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          error: `This cancellation request has already been ${cancellationRequest.status}`,
          status: cancellationRequest.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const booking = cancellationRequest.bookings as any;

    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'This booking has already been cancelled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('booking_cancellation_requests')
      .update({
        reason: reason || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        metadata: {
          ...cancellationRequest.metadata,
          submitted_at: new Date().toISOString(),
          reason_provided: !!reason,
        },
      })
      .eq('id', cancellationRequest.id);

    if (updateError) {
      console.error('Error updating cancellation request:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit cancellation request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      await supabase.functions.invoke('send-booking-email', {
        body: {
          bookingId: booking.id,
          emailType: 'admin_notification',
          adminEmail: 'dispatch@travelsmart.com',
        },
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cancellation request submitted successfully',
        booking: {
          reference: booking.reference,
          id: booking.id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in request-cancellation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});