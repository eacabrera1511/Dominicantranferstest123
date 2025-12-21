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
    const origin = body.origin || body.pickup_location;
    const destination = body.destination || body.dropoff_location;
    const { passengers, luggage, trip_type } = body;

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin/pickup_location and destination/dropoff_location are required' }),
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

    const { data: hotelZones } = await supabase
      .from('hotel_zones')
      .select('*')
      .eq('is_active', true);

    const findZone = (location: string): string | null => {
      const lowerLocation = location.toLowerCase();

      if (lowerLocation.includes('puj') || lowerLocation.includes('punta cana airport')) {
        return 'PUJ';
      }
      if (lowerLocation.includes('sdq') || lowerLocation.includes('santo domingo')) {
        return 'SDQ';
      }
      if (lowerLocation.includes('lrm') || lowerLocation.includes('la romana airport')) {
        return 'LRM';
      }

      for (const zone of hotelZones || []) {
        if (lowerLocation.includes(zone.hotel_name.toLowerCase())) {
          return zone.zone_code;
        }
        for (const term of zone.search_terms) {
          if (lowerLocation.includes(term.toLowerCase())) {
            return zone.zone_code;
          }
        }
      }

      if (lowerLocation.includes('bavaro') || lowerLocation.includes('zone a')) {
        return 'Zone A';
      }
      if (lowerLocation.includes('cap cana') || lowerLocation.includes('zone b')) {
        return 'Zone B';
      }
      if (lowerLocation.includes('uvero alto') || lowerLocation.includes('zone c')) {
        return 'Zone C';
      }
      if (lowerLocation.includes('bayahibe') || lowerLocation.includes('la romana') || lowerLocation.includes('zone d')) {
        return 'Zone D';
      }

      return null;
    };

    const originZone = findZone(origin);
    const destinationZone = findZone(destination);

    const quotes = [];

    for (const vehicle of vehicleTypes) {
      if (passengers && vehicle.passenger_capacity < passengers) continue;
      if (luggage && vehicle.luggage_capacity < luggage) continue;

      let matchingRule = pricingRules.find(
        (rule) =>
          rule.vehicle_type_id === vehicle.id &&
          rule.origin === originZone &&
          (rule.destination === destinationZone ||
           rule.destination?.toLowerCase().includes(destination.toLowerCase()))
      );

      if (!matchingRule && originZone && destinationZone) {
        matchingRule = pricingRules.find(
          (rule) =>
            rule.vehicle_type_id === vehicle.id &&
            rule.origin === originZone &&
            rule.destination === destinationZone
        );
      }

      if (!matchingRule && originZone) {
        matchingRule = pricingRules.find(
          (rule) =>
            rule.vehicle_type_id === vehicle.id &&
            rule.origin === originZone
        );
      }

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
        discount_applied: discountPercentage > 0 ? `${discountPercentage}%` : null,
        origin_zone: originZone,
        destination_zone: destinationZone
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