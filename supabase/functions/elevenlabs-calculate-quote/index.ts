import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ROUNDTRIP_MULTIPLIER = 1.9;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { origin, destination, passengers, luggage, trip_type } = body;

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: vehicleTypes, error: vehicleError } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (vehicleError) throw vehicleError;

    const { data: pricingRules, error: pricingError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (pricingError) throw pricingError;

    const { data: discount } = await supabase
      .from('global_discount_settings')
      .select('discount_percentage')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const discountPercentage = discount?.discount_percentage || 0;

    const quotes = [];

    for (const vehicle of vehicleTypes) {
      if (passengers && vehicle.passenger_capacity < passengers) continue;
      if (luggage && vehicle.luggage_capacity < luggage) continue;

      const matchingRule = pricingRules.find(
        (rule) =>
          rule.vehicle_type_id === vehicle.id &&
          rule.origin?.toLowerCase().includes(origin.toLowerCase()) &&
          rule.destination?.toLowerCase().includes(destination.toLowerCase())
      );

      let price = matchingRule?.base_price || vehicle.minimum_fare || 50;

      if (trip_type === 'round_trip' || trip_type === 'roundtrip') {
        price = price * ROUNDTRIP_MULTIPLIER;
      }

      if (discountPercentage > 0) {
        price = price * (1 - discountPercentage / 100);
      }

      quotes.push({
        vehicle_name: vehicle.name,
        vehicle_id: vehicle.id,
        capacity: vehicle.passenger_capacity,
        luggage_capacity: vehicle.luggage_capacity,
        price: Math.round(price * 100) / 100,
        currency: 'USD',
        trip_type: trip_type || 'one_way',
        discount_applied: discountPercentage > 0 ? `${discountPercentage}%` : null
      });
    }

    quotes.sort((a, b) => a.price - b.price);

    return new Response(
      JSON.stringify({
        origin,
        destination,
        passengers: passengers || 1,
        luggage: luggage || 1,
        trip_type: trip_type || 'one_way',
        quotes,
        discount_percentage: discountPercentage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error calculating quote:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to calculate quote' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});