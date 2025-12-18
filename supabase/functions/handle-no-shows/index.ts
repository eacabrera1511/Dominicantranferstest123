import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: potentialNoShows, error } = await supabase
      .from('bookings')
      .select(`
        *,
        assignment:trip_assignments(*)
      `)
      .in('workflow_status', ['assigned', 'confirmed', 'driver_en_route'])
      .lt('pickup_datetime', thirtyMinutesAgo)
      .eq('payment_status', 'paid')
      .neq('workflow_status', 'no_show')
      .neq('workflow_status', 'cancelled');

    if (error) throw error;

    let processedCount = 0;
    const noShowBookings = [];

    for (const booking of potentialNoShows || []) {
      const assignment = Array.isArray(booking.assignment) ? booking.assignment[0] : booking.assignment;
      
      if (!assignment || !['arrived', 'in_progress', 'completed'].includes(assignment.status)) {
        await supabase
          .from('bookings')
          .update({ workflow_status: 'no_show' })
          .eq('id', booking.id);

        if (assignment) {
          await supabase
            .from('trip_assignments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: 'Customer no-show',
            })
            .eq('id', assignment.id);

          await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', assignment.vehicle_id);
        }

        if (booking.customer_id) {
          await supabase.rpc('increment_no_show_count', {
            customer_uuid: booking.customer_id,
          }).catch(() => {
            supabase
              .from('customers')
              .update({ no_show_count: supabase.raw('no_show_count + 1') })
              .eq('id', booking.customer_id);
          });

          await supabase.from('customer_activity_log').insert({
            customer_id: booking.customer_id,
            activity_type: 'no_show',
            details: {
              booking_id: booking.id,
              pickup_time: booking.pickup_datetime,
            },
          });

          await supabase.from('payment_transactions').insert({
            booking_id: booking.id,
            customer_id: booking.customer_id,
            amount: -50.00,
            payment_method: 'penalty',
            transaction_type: 'no_show_fee',
            status: 'pending',
          });
        }

        await supabase.from('admin_notifications').insert({
          type: 'no_show_detected',
          message: `Customer no-show detected for booking ${booking.id}`,
          data: {
            booking_id: booking.id,
            customer_id: booking.customer_id,
            pickup_time: booking.pickup_datetime,
          },
          priority: 'high',
        });

        noShowBookings.push(booking.id);
        processedCount++;
      }
    }

    await supabase.from('automation_logs').insert({
      automation_name: 'handle-no-shows',
      trigger_type: 'scheduled',
      execution_status: 'success',
      records_processed: processedCount,
      errors_count: 0,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        no_shows_detected: processedCount,
        booking_ids: noShowBookings,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-no-shows:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
