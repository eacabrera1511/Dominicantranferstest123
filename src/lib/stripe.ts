import { supabase } from './supabase';

export interface DynamicCheckoutParams {
  bookingId: string;
  amount: number;
  currency?: string;
  productName?: string;
  productDescription?: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PricingResult {
  totalPrice: number;
  basePrice: number;
  distancePrice: number;
  multipliers: Array<{ name: string; multiplier: number }>;
  currency: string;
  routeName?: string;
  vehicleType?: string;
}

export class StripeService {
  private static readonly SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
  private static readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  static async getRoutePrice(
    origin: string,
    destination: string,
    vehicleType: string,
    tripType: 'oneway' | 'roundtrip'
  ): Promise<PricingResult | null> {
    console.log('Getting route price for:', { origin, destination, vehicleType, tripType });

    const airportCodeMap: Record<string, string> = {
      'punta cana': 'PUJ',
      'santo domingo': 'SDQ',
      'la romana': 'LRM',
      'puerto plata': 'POP',
    };

    const vehicleTypeMap: Record<string, string> = {
      'minivan': 'van',
      'minibus': 'bus',
    };

    let originCode = origin.toUpperCase();
    for (const [key, code] of Object.entries(airportCodeMap)) {
      if (origin.toLowerCase().includes(key)) {
        originCode = code;
        break;
      }
    }

    const originNorm = originCode.toLowerCase();
    const destNorm = destination.toLowerCase();
    let vehicleNorm = vehicleType.toLowerCase();

    if (vehicleTypeMap[vehicleNorm]) {
      vehicleNorm = vehicleTypeMap[vehicleNorm];
    }

    console.log('Normalized search:', { originNorm, destNorm, vehicleNorm });

    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*, vehicle_type:vehicle_types!pricing_rules_vehicle_type_id_fkey(name)')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error || !rules) {
      console.error('Error fetching pricing rules:', error);
      return null;
    }

    console.log(`Found ${rules.length} active pricing rules`);

    let matchedRule = null;
    for (const rule of rules) {
      if (!rule.origin || !rule.destination) continue;

      const ruleOrigin = rule.origin.toLowerCase();
      const ruleDest = rule.destination.toLowerCase();

      const originMatches =
        ruleOrigin === originNorm ||
        originNorm.includes(ruleOrigin) ||
        ruleOrigin.includes(originNorm);

      const destMatches =
        destNorm.includes(ruleDest) ||
        ruleDest.includes(destNorm);

      if (!originMatches || !destMatches) continue;

      console.log('Found route match:', { rule: rule.route_name, origin: rule.origin, dest: rule.destination });

      if (rule.vehicle_type_id) {
        const vehicleTypeName = (rule as any).vehicle_type?.name?.toLowerCase();
        console.log('Checking vehicle type:', { ruleVehicle: vehicleTypeName, requestedVehicle: vehicleNorm });

        if (vehicleTypeName === vehicleNorm) {
          matchedRule = rule;
          console.log('Perfect match found!');
          break;
        }
      } else if (rule.vehicle_types && rule.vehicle_types.length > 0) {
        if (rule.vehicle_types.some((v: string) => v.toLowerCase() === vehicleNorm)) {
          matchedRule = rule;
          console.log('Vehicle types array match found!');
          break;
        }
      }
    }

    if (!matchedRule) {
      console.log('No specific rule found, trying base rate...');
      for (const rule of rules) {
        if (rule.rule_type === 'base_rate' && rule.vehicle_types) {
          if (rule.vehicle_types.some((v: string) => v.toLowerCase() === vehicleNorm)) {
            matchedRule = rule;
            console.log('Base rate match found!');
            break;
          }
        }
      }
    }

    if (!matchedRule) {
      console.error('No pricing rule matched for route');
      return null;
    }

    let basePrice = parseFloat(matchedRule.base_price) || 0;
    let totalPrice = basePrice;

    if (tripType === 'roundtrip') {
      totalPrice = totalPrice * 2;
    }

    const surgeMultiplier = parseFloat(matchedRule.surge_multiplier) || 1;
    if (surgeMultiplier !== 1) {
      totalPrice = totalPrice * surgeMultiplier;
    }

    console.log('Price calculated:', { basePrice, totalPrice, tripType });

    return {
      totalPrice: Math.round(totalPrice * 100) / 100,
      basePrice: basePrice,
      distancePrice: 0,
      multipliers: surgeMultiplier !== 1 ? [{ name: 'Surge', multiplier: surgeMultiplier }] : [],
      currency: 'USD',
      routeName: matchedRule.route_name || `${origin} to ${destination}`,
      vehicleType: vehicleType,
    };
  }

  static async createDynamicCheckout(params: DynamicCheckoutParams): Promise<{ url: string; sessionId: string } | null> {
    try {
      console.log('Creating checkout session with params:', {
        bookingId: params.bookingId,
        amount: params.amount,
        currency: params.currency,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      });

      const url = `${this.SUPABASE_FUNCTIONS_URL}/create-booking-checkout`;
      console.log('Calling edge function:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          bookingId: params.bookingId,
          amount: params.amount,
          currency: params.currency || 'usd',
          productName: params.productName || 'Airport Transfer',
          productDescription: params.productDescription,
          customerEmail: params.customerEmail,
          customerName: params.customerName,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          metadata: params.metadata,
        }),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Stripe checkout error:', data);
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        console.error('No checkout URL in response:', data);
        throw new Error('No checkout URL returned');
      }

      return {
        url: data.url,
        sessionId: data.sessionId,
      };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  static formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }
}
