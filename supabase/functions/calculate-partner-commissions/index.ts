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

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const { data: completedTrips, error } = await supabase
      .from('trip_assignments')
      .select(`
        id,
        booking_id,
        dropoff_completed_at,
        booking:bookings!inner (
          id,
          price,
          partner_id,
          customer_id,
          partner:partners (
            id,
            commission_rate,
            payment_terms
          )
        )
      `)
      .eq('status', 'completed')
      .gte('dropoff_completed_at', `${yesterdayDate}T00:00:00Z`)
      .lt('dropoff_completed_at', `${yesterdayDate}T23:59:59Z`)
      .not('booking.partner_id', 'is', null);

    if (error) throw error;

    let processedCount = 0;
    const commissionsByPartner: Record<string, any> = {};

    for (const trip of completedTrips || []) {
      const booking = trip.booking;
      if (!booking.partner_id || !booking.partner) continue;

      const existingTransaction = await supabase
        .from('partner_transactions')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('transaction_type', 'commission_approved')
        .maybeSingle();

      if (existingTransaction.data) continue;

      const commissionRate = booking.partner.commission_rate;
      const grossAmount = booking.price;
      const commissionAmount = grossAmount * (commissionRate / 100);
      const platformFee = grossAmount * 0.03;
      const netAmount = commissionAmount - platformFee;

      await supabase.from('partner_transactions').insert({
        partner_id: booking.partner_id,
        booking_id: booking.id,
        transaction_type: 'commission_approved',
        amount: commissionAmount,
        platform_fee: platformFee,
        status: 'approved',
        transaction_date: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      });

      await supabase
        .from('partners')
        .update({
          total_earnings: supabase.raw('total_earnings + ?', [netAmount]),
          pending_payout: supabase.raw('pending_payout + ?', [netAmount]),
          total_bookings: supabase.raw('total_bookings + 1'),
        })
        .eq('id', booking.partner_id);

      if (!commissionsByPartner[booking.partner_id]) {
        commissionsByPartner[booking.partner_id] = {
          bookings_count: 0,
          total_revenue: 0,
          commission_earned: 0,
          platform_fees: 0,
        };
      }

      commissionsByPartner[booking.partner_id].bookings_count += 1;
      commissionsByPartner[booking.partner_id].total_revenue += grossAmount;
      commissionsByPartner[booking.partner_id].commission_earned += commissionAmount;
      commissionsByPartner[booking.partner_id].platform_fees += platformFee;

      processedCount++;
    }

    for (const [partnerId, stats] of Object.entries(commissionsByPartner)) {
      await supabase
        .from('partner_daily_stats')
        .upsert({
          partner_id: partnerId,
          date: yesterdayDate,
          ...stats,
        }, {
          onConflict: 'partner_id,date',
        });

      const { data: partner } = await supabase
        .from('partners')
        .select('pending_payout')
        .eq('id', partnerId)
        .single();

      if (partner && partner.pending_payout >= 100) {
        const { data: unpaidTransactions } = await supabase
          .from('partner_transactions')
          .select('id, net_amount')
          .eq('partner_id', partnerId)
          .eq('status', 'approved')
          .is('payout_id', null);

        if (unpaidTransactions && unpaidTransactions.length > 0) {
          const totalAmount = unpaidTransactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
          const transactionIds = unpaidTransactions.map(t => t.id);

          const { data: payout } = await supabase
            .from('partner_payouts')
            .insert({
              partner_id: partnerId,
              payout_date: new Date().toISOString().split('T')[0],
              amount: totalAmount,
              status: 'pending',
              included_transactions: transactionIds,
            })
            .select()
            .single();

          if (payout) {
            await supabase
              .from('partner_transactions')
              .update({ payout_id: payout.id })
              .in('id', transactionIds);
          }
        }
      }
    }

    await supabase.from('automation_logs').insert({
      automation_name: 'calculate-partner-commissions',
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
        date: yesterdayDate,
        trips_processed: processedCount,
        partners_affected: Object.keys(commissionsByPartner).length,
        commissions_by_partner: commissionsByPartner,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-partner-commissions:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
