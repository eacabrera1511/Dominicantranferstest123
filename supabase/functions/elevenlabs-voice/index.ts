import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ELEVENLABS_AGENT_ID = "agent_4201kcxcxbege73tvy22a28rt04n";

interface VoiceRequest {
  text?: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  isInBookingFlow?: boolean;
}

const SYSTEM_PROMPT = `SYSTEM ROLE:
You are an INTELLIGENT and HELPFUL AI assistant for a PRIVATE TRANSFER COMPANY in the DOMINICAN REPUBLIC. You can answer ANY question the user asks, whether it's about transfers, the Dominican Republic, general knowledge, or anything else.

--------------------------------------------------
PRIMARY MISSION
--------------------------------------------------

1. ANSWER ANY QUESTION: You can discuss ANY topic - population statistics, history, culture, science, travel tips, recommendations, or anything else the user asks about. Don't limit yourself to just transfer topics.

2. BE HELPFUL: Provide accurate, detailed, and engaging answers to all questions. Use your full knowledge base.

3. SUPPORT BOOKINGS: When appropriate, help users book transfers using the pricing and fleet information below.

4. ALLOW INTERRUPTIONS: Users can ask random questions anytime during a booking flow. Answer their question fully, then remind them they can continue booking when ready.

--------------------------------------------------
CONVERSATION STYLE FOR VOICE
--------------------------------------------------

- Answer ALL questions naturally and conversationally
- Keep responses concise for voice (2-3 sentences typical, max 4-5)
- Use natural speech patterns - contractions, friendly tone
- Avoid long lists or technical jargon
- Provide clear next steps
- Use verbal cues like "Let me help you with that"

--------------------------------------------------
SPECIAL RULE: "SEE PRICES" REQUESTS
--------------------------------------------------

CRITICAL: When a user says "see prices", "show prices", "view prices", "check prices", or similar:
- ALWAYS respond with: "We'll offer you the best pricing, but first I need to know your route. Let's start with where you're traveling from - which airport will you arrive at?"
- This immediately starts the booking flow
- DO NOT provide general pricing information
- DO NOT show a price list
- Always redirect to gathering route information first

--------------------------------------------------
AIRPORT DEFINITIONS
--------------------------------------------------

PUJ = Punta Cana International Airport
SDQ = Santo Domingo Las Américas Airport

--------------------------------------------------
FLEET OVERRIDE — VEHICLE TYPES (AUTHORITATIVE)
--------------------------------------------------

Sedan / Standard Private Transfer
- Passengers: 1–2
- Suitcases: up to 3
- Category: Standard
- Use case: couples, solo travelers

Minivan / Family Transfer
- Passengers: 3–6
- Suitcases: 6–8
- Category: Standard Plus
- Use case: families, small groups

Suburban / Luxury SUV (VIP)
- Passengers: 1–4
- Suitcases: up to 4
- Category: Luxury / VIP
- Use case: executive, premium, black car service

Sprinter / Large Van
- Passengers: 7–12
- Suitcases: 10–14
- Category: Group Premium

Mini Bus
- Passengers: 13+
- Suitcases: Large capacity
- Category: Group

RULE (HARD):
If passenger count OR luggage exceeds vehicle capacity → AUTO-UPGRADE vehicle.
Never downsize vehicles.

--------------------------------------------------
TRANSFER ZONES (AUTHORITATIVE)
--------------------------------------------------

Zone A – Punta Cana / Bávaro
Zone B – Cap Cana
Zone C – Uvero Alto / Macao
Zone D – Bayahibe / La Romana
Zone E – Santo Domingo City

--------------------------------------------------
BASE PRICING — ONE WAY (USD) (OVERRIDE)
--------------------------------------------------

PUJ → HOTEL

Zone A:
Sedan $25 | Minivan $45 | Suburban $65 | Sprinter $110 | Mini Bus $180

Zone B:
Sedan $30 | Minivan $50 | Suburban $75 | Sprinter $120 | Mini Bus $190

Zone C:
Sedan $40 | Minivan $65 | Suburban $90 | Sprinter $135 | Mini Bus $210

Zone D:
Sedan $55 | Minivan $80 | Suburban $110 | Sprinter $160 | Mini Bus $240

SDQ → HOTEL

Zone A:
Sedan $190 | Minivan $230 | Suburban $300 | Sprinter $380 | Mini Bus $520

Zone B:
Sedan $200 | Minivan $250 | Suburban $320 | Sprinter $400 | Mini Bus $550

Zone C:
Sedan $220 | Minivan $270 | Suburban $350 | Sprinter $420 | Mini Bus $580

Zone D:
Sedan $240 | Minivan $290 | Suburban $380 | Sprinter $450 | Mini Bus $620

PUJ ↔ SDQ Direct Transfer:
Sedan $220 | Minivan $260 | Suburban $320 | Sprinter $420 | Mini Bus $600

--------------------------------------------------
ROUNDTRIP RULE (OVERRIDE)
--------------------------------------------------

Roundtrip Price = One-Way × 1.9

--------------------------------------------------
VIP PRICING & UPSELL LOGIC
--------------------------------------------------

VIP_MULTIPLIER = 1.35

Apply VIP pricing when:
- Vehicle is Suburban or higher
- User explicitly requests VIP / luxury
- Hotel is high-end AND comfort is implied

--------------------------------------------------
VOICE BOOKING FLOW
--------------------------------------------------

1. Gather: Arrival airport (PUJ or SDQ)
2. Gather: Destination hotel or address
3. Gather: Number of passengers
4. Gather: Number of suitcases
5. Gather: Travel date and time
6. Gather: One-way or roundtrip
7. Calculate pricing
8. Present options
9. Confirm booking details
10. Collect customer info (name, email, phone)
11. Process payment
12. Send confirmation

Keep each step conversational and natural for voice interaction.

REMEMBER: Keep voice responses SHORT and CONVERSATIONAL - no long paragraphs!`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, conversationId, conversationHistory = [], isInBookingFlow = false }: VoiceRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: credentials } = await supabase
      .from("api_credentials")
      .select("api_key, config")
      .eq("service_name", "elevenlabs")
      .eq("is_active", true)
      .maybeSingle();

    if (!credentials) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: vehicleTypes } = await supabase
      .from("vehicle_types")
      .select("*")
      .order("passenger_capacity");

    const { data: pricingRules } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("is_active", true);

    const vehicleContext = vehicleTypes ?
      `\n\nAVAILABLE VEHICLES:\n${vehicleTypes.map(v =>
        `${v.name} - Passengers: ${v.passenger_capacity}, Luggage: ${v.luggage_capacity}, Base Price: $${v.base_price_usd}`
      ).join('\n')}` : '';

    const pricingContext = pricingRules ?
      `\n\nPRICING RULES:\n${pricingRules.map(p =>
        `${p.route_name}: ${p.vehicle_type} - $${p.price_usd} (${p.trip_type})`
      ).join('\n')}` : '';

    const bookingFlowContext = isInBookingFlow
      ? `\n\nIMPORTANT: The user is currently in the middle of booking a transfer. After answering their question, gently remind them they can say "continue booking" to resume their booking whenever they're ready.`
      : "";

    const fullContext = SYSTEM_PROMPT + vehicleContext + pricingContext + bookingFlowContext;

    const conversationSessionId = conversationId || `voice_${Date.now()}`;

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation`, {
      method: "POST",
      headers: {
        "xi-api-key": credentials.api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: ELEVENLABS_AGENT_ID,
        text: text,
        conversation_id: conversationSessionId,
        override_agent: {
          prompt: {
            prompt: fullContext
          }
        }
      }),
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs API error:", elevenLabsResponse.status, errorText);

      return new Response(
        JSON.stringify({
          error: "Failed to process voice request",
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await elevenLabsResponse.json();
    const aiResponse = data.text || data.message || "I'm here to help! What can I do for you?";
    const audioData = data.audio;

    let base64Audio = null;
    if (audioData) {
      if (typeof audioData === 'string') {
        base64Audio = audioData;
      } else if (audioData instanceof ArrayBuffer || audioData instanceof Uint8Array) {
        base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      }
    }

    if (conversationId) {
      await supabase
        .from("voice_sessions")
        .upsert({
          conversation_id: conversationId,
          session_data: {
            lastMessage: text,
            lastResponse: aiResponse,
            elevenLabsSessionId: conversationSessionId
          },
          mode: "voice",
          updated_at: new Date().toISOString()
        }, { onConflict: "conversation_id" });
    }

    return new Response(
      JSON.stringify({
        text: aiResponse,
        audio: base64Audio,
        success: true,
        audioAvailable: !!base64Audio,
        conversationSessionId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in elevenlabs-voice function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
