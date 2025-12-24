import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface QuoteRequest {
  from_address: string;
  to_address: string;
  pickup_datetime: string;
  vehicle_type: string;
  passenger_count?: number;
  luggage_count?: number;
  customer_id?: string;
  corporate_account_id?: string;
  trip_type?: 'one-way' | 'round-trip';
}


Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const quoteRequest: QuoteRequest = await req.json();

    // Validate required fields
    if (!quoteRequest.from_address || !quoteRequest.to_address || !quoteRequest.vehicle_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: from_address, to_address, vehicle_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ROUNDTRIP_MULTIPLIER = 1.9;
    const tripType = quoteRequest.trip_type || 'one-way';

    // Extract airport code from address (PUJ, SDQ, LRM, POP)
    const airportMatch = quoteRequest.from_address.match(/\b(PUJ|SDQ|LRM|POP)\b/i);
    const origin = airportMatch ? airportMatch[0].toUpperCase() : quoteRequest.from_address;

    // Use destination as-is for matching
    const destination = quoteRequest.to_address;

    // Get vehicle type from database by name
    const { data: vehicleType } = await supabase
      .from('vehicle_types')
      .select('id, name')
      .ilike('name', quoteRequest.vehicle_type)
      .eq('is_active', true)
      .maybeSingle();

    if (!vehicleType) {
      return new Response(
        JSON.stringify({ error: `Vehicle type '${quoteRequest.vehicle_type}' not found` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching pricing rule
    const { data: pricingRule } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('vehicle_type_id', vehicleType.id)
      .eq('is_active', true)
      .maybeSingle();

    let base_price = 0;
    let total_price = 0;
    const rules_applied: string[] = [];

    if (pricingRule) {
      base_price = Number(pricingRule.base_price);
      rules_applied.push(pricingRule.id);

      // Apply roundtrip multiplier if needed
      let calculatedPrice = base_price;
      if (tripType === 'round-trip') {
        calculatedPrice = Math.round(base_price * ROUNDTRIP_MULTIPLIER);
      }

      // Apply global discount if active (unless route prohibits discounts)
      if (pricingRule.no_discount_allowed) {
        total_price = calculatedPrice;
      } else {
        const { data: activeDiscount } = await supabase
          .from('global_discount_settings')
          .select('discount_percentage')
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .or('end_date.is.null,end_date.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeDiscount && activeDiscount.discount_percentage > 0) {
          const discountMultiplier = 1 - (Number(activeDiscount.discount_percentage) / 100);
          total_price = Math.round(calculatedPrice * discountMultiplier);
        } else {
          total_price = calculatedPrice;
        }
      }
    } else {
      // No pricing rule found - return error
      return new Response(
        JSON.stringify({
          error: `No pricing rule found for route ${origin} to ${destination} with vehicle ${vehicleType.name}`,
          available_routes: `Check pricing_rules table for available routes`
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const distance_miles = 0;
    const duration_minutes = 0;

    // Generate quote number
    const quote_number = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Calculate expiry (24 hours from now)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    return new Response(
      JSON.stringify({
        success: true,
        quote: {
          quote_number,
          from_address: quoteRequest.from_address,
          to_address: quoteRequest.to_address,
          origin,
          destination,
          vehicle_type: vehicleType.name,
          vehicle_type_id: vehicleType.id,
          pickup_datetime: quoteRequest.pickup_datetime,
          trip_type: tripType,
          base_price,
          total_price,
          passenger_count: quoteRequest.passenger_count || 1,
          pricing_rule_id: pricingRule?.id,
          expires_at: expires_at.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error calculating quote:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
