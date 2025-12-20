import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const { data: hotelZones, error: zonesError } = await supabase
      .from('hotel_zones')
      .select('*')
      .eq('is_active', true);

    if (zonesError) throw zonesError;

    const response = {
      vehicle_types: vehicleTypes,
      pricing_rules: pricingRules,
      hotel_zones: hotelZones,
      airports: [
        { code: 'PUJ', name: 'Punta Cana International Airport' },
        { code: 'SDQ', name: 'Santo Domingo Las Americas' },
        { code: 'LRM', name: 'La Romana International Airport' },
        { code: 'POP', name: 'Puerto Plata Gregorio Luperon' }
      ],
      zones: [
        { code: 'Zone A', name: 'Bavaro/Punta Cana Beach' },
        { code: 'Zone B', name: 'Cap Cana/Uvero Alto' },
        { code: 'Zone C', name: 'La Romana/Bayahibe' },
        { code: 'Zone D', name: 'Puerto Plata Area' },
        { code: 'Zone E', name: 'Santo Domingo' }
      ]
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch vehicle data' }),
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