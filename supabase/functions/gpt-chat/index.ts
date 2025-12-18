import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  isInBookingFlow?: boolean;
}

const FALLBACK_RESPONSES: Record<string, string> = {
  weather: "The Dominican Republic enjoys tropical weather year-round! Expect temperatures between 77-86F (25-30C). The dry season (December-April) is perfect for beach visits, while the rainy season (May-November) brings brief afternoon showers. Pack light clothes, sunscreen, and a light rain jacket!",
  beach: "The DR has some of the Caribbean's most beautiful beaches! Punta Cana offers powdery white sand and turquoise waters. Bavaro Beach is perfect for families, while Cap Cana has more secluded luxury spots. Puerto Plata's northern coast has golden sand beaches with great surfing.",
  food: "Dominican cuisine is delicious! Try 'La Bandera' - the national dish of rice, beans, and meat. Don't miss mofongo (mashed plantains), tostones (fried plantains), and fresh seafood. Wash it down with Presidente beer or mamajuana, a local herbal drink!",
  activities: "There's so much to do! Visit Saona Island for pristine beaches, explore Santo Domingo's historic Colonial Zone (UNESCO site), go zip-lining in Puerto Plata, swim in natural cenotes, or take a catamaran cruise. Golf lovers will find world-class courses!",
  safety: "The tourist areas are generally very safe! Stick to reputable tour operators and transportation services. Our private transfers ensure you travel safely from the airport to your resort. Keep valuables secure and use common sense, just like traveling anywhere.",
  currency: "The Dominican Peso (DOP) is the local currency, but US dollars are widely accepted in tourist areas. Credit cards work at most hotels and restaurants. ATMs are available, but let your bank know you're traveling. Tip in local currency when possible!",
  language: "Spanish is the official language, but English is widely spoken in tourist areas, especially at resorts and with tour operators. Our drivers speak English! Learning a few Spanish phrases like 'Hola' (hello) and 'Gracias' (thank you) is always appreciated.",
  airportPickup: "Once you book your transfer, a professional driver will meet you at the airport in the arrivals hall, just after customs. They'll hold a sign with your name or company logo. Flight arrivals are monitored in real time, and if your flight is delayed, your driver will adjust the pickup time at no extra charge. Drivers wait up to 60 minutes after landing. Service is available 24/7 from all major DR airports (PUJ, SDQ, STI, LRM, POP). All vehicles are modern, air-conditioned, and comfortable!",
  driverMeet: "The driver meets you in the arrivals hall right after customs. You'll receive exact meeting instructions before arrival, including what sign to look for and how to identify your driver. If you can't locate your driver, contact the emergency phone number or WhatsApp provided in your confirmation email.",
  flightDelay: "Flight arrivals are monitored in real time. If your flight is delayed, your driver will automatically adjust the pickup time at no extra charge. Drivers typically wait up to 60 minutes after landing for international flights. If you experience delays at immigration or baggage claim, you can contact the support number provided.",
  pricing: "Prices are fixed and confirmed at booking - no hidden fees or surprise charges. Most transfers are charged per vehicle (not per person), making it cost-effective for families and groups. Round-trip transfers can be booked together. Tipping is not mandatory but appreciated (10-15% typical). All vehicles are modern, fully air-conditioned, and include child seats upon request.",
  default: "The Dominican Republic is a beautiful Caribbean destination with stunning beaches, rich culture, warm people, and delicious food! It's perfect for relaxation, adventure, or a mix of both. When you're ready to book your airport transfer, just let me know!"
};

function getSmartResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('airport') && (lower.includes('pickup') || lower.includes('transfer') || lower.includes('work') || lower.includes('process') || lower.includes('land') || lower.includes('arrival'))) {
    return FALLBACK_RESPONSES.airportPickup;
  }
  if ((lower.includes('driver') || lower.includes('meet')) && (lower.includes('where') || lower.includes('find') || lower.includes('wait') || lower.includes('airport'))) {
    return FALLBACK_RESPONSES.driverMeet;
  }
  if ((lower.includes('flight') || lower.includes('plane')) && (lower.includes('delay') || lower.includes('late') || lower.includes('wait'))) {
    return FALLBACK_RESPONSES.flightDelay;
  }
  if ((lower.includes('price') || lower.includes('pricing') || lower.includes('cost') || lower.includes('fee')) && (lower.includes('fixed') || lower.includes('per') || lower.includes('hidden') || lower.includes('tip'))) {
    return FALLBACK_RESPONSES.pricing;
  }
  if (lower.includes('weather') || lower.includes('climate') || lower.includes('temperature') || lower.includes('rain') || lower.includes('hot') || lower.includes('cold')) {
    return FALLBACK_RESPONSES.weather;
  }
  if (lower.includes('beach') || lower.includes('sand') || lower.includes('ocean') || lower.includes('swim') || lower.includes('coast')) {
    return FALLBACK_RESPONSES.beach;
  }
  if (lower.includes('food') || lower.includes('eat') || lower.includes('restaurant') || lower.includes('cuisine') || lower.includes('drink') || lower.includes('beer')) {
    return FALLBACK_RESPONSES.food;
  }
  if (lower.includes('do') || lower.includes('activit') || lower.includes('tour') || lower.includes('visit') || lower.includes('see') || lower.includes('attraction')) {
    return FALLBACK_RESPONSES.activities;
  }
  if (lower.includes('safe') || lower.includes('danger') || lower.includes('security') || lower.includes('crime')) {
    return FALLBACK_RESPONSES.safety;
  }
  if (lower.includes('money') || lower.includes('currency') || lower.includes('dollar') || lower.includes('peso') || lower.includes('pay') || lower.includes('tip') || lower.includes('atm')) {
    return FALLBACK_RESPONSES.currency;
  }
  if (lower.includes('language') || lower.includes('spanish') || lower.includes('english') || lower.includes('speak')) {
    return FALLBACK_RESPONSES.language;
  }

  return FALLBACK_RESPONSES.default;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory = [], isInBookingFlow = false }: ChatRequest = await req.json();

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.log("No OpenAI API key configured, using smart fallback responses");
      return new Response(
        JSON.stringify({
          response: getSmartResponse(message),
          success: true,
          source: "fallback"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const bookingFlowContext = isInBookingFlow
      ? `\n\nIMPORTANT: The user is currently in the middle of booking a transfer. After answering their question, gently remind them they can say "continue booking" to resume their booking whenever they're ready. Don't be pushy, just helpful.`
      : `\n\nIf the user seems interested in booking a transfer, let them know they can say "book a transfer" or "I'm ready to book" whenever they want to start.`;

    const systemPrompt = `SYSTEM ROLE:
You are an INTELLIGENT and HELPFUL AI assistant for a PRIVATE TRANSFER COMPANY in the DOMINICAN REPUBLIC. You can answer ANY question the user asks, whether it's about transfers, the Dominican Republic, general knowledge, or anything else.

--------------------------------------------------
PRIMARY MISSION
--------------------------------------------------

1. ANSWER ANY QUESTION: You can discuss ANY topic - population statistics, history, culture, science, travel tips, recommendations, or anything else the user asks about. Don't limit yourself to just transfer topics.

2. BE HELPFUL: Provide accurate, detailed, and engaging answers to all questions. Use your full knowledge base.

3. SUPPORT BOOKINGS: When appropriate, help users book transfers using the pricing and fleet information below.

4. ALLOW INTERRUPTIONS: Users can ask random questions anytime during a booking flow. Answer their question fully, then remind them they can continue booking when ready.

--------------------------------------------------
CONVERSATION STYLE
--------------------------------------------------

- Answer ALL questions naturally and conversationally
- Provide accurate information on ANY topic
- Don't force transfer/booking topics into unrelated conversations
- Only mention transfers when relevant or when the user shows interest
- If in a booking flow, briefly mention they can continue after answering their question

--------------------------------------------------
SPECIAL RULE: "SEE PRICES" REQUESTS
--------------------------------------------------

CRITICAL: When a user says "see prices", "show prices", "view prices", "check prices", or similar:
- ALWAYS respond with: "We will offer you the best pricing, but first I need to know your route. Let's start with where you're traveling from - which airport will you arrive at?"
- This immediately starts the booking flow
- DO NOT provide general pricing information
- DO NOT show a price list
- Always redirect to gathering route information first

--------------------------------------------------
TRANSFER BUSINESS EXPERTISE (USE WHEN RELEVANT)
--------------------------------------------------

You must:
- Redirect "see prices" requests to booking flow (see special rule above)
- Answer specific pricing questions only when route details are provided
- Support the booking flow without breaking it
- Automatically select the correct vehicle
- Calculate one-way and roundtrip pricing
- Apply VIP, surge, and upgrade logic
- Suggest better vehicle or pricing options when relevant
- Respect luggage capacity strictly
- Support multi-language chat (EN / ES / DE / NL)
- Provide intelligent fallback suggestions

You are allowed and expected to:
- Suggest vehicle upgrades
- Suggest VIP service when appropriate
- Suggest cost-saving options when available
- Suggest changes if user input is illogical or incomplete

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
AUTO VEHICLE SELECTION & SUGGESTION LOGIC
--------------------------------------------------

IF passengers <= 2 AND suitcases <= 3 → Sedan
IF passengers <= 6 AND suitcases <= 8 → Minivan
IF VIP keywords detected (VIP, luxury, black car, executive, premium) → Suburban
IF passengers > 6 AND <= 12 → Sprinter
IF passengers > 12 → Mini Bus

If passengers fit multiple vehicles:
- Suggest the cheapest valid option by default
- Offer an optional upgrade (Suburban / VIP) when appropriate

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

Always explain VIP benefits briefly:
- Premium vehicle
- More space
- Priority service

--------------------------------------------------
DYNAMIC SURGE PRICING
--------------------------------------------------

Apply surge ONLY when conditions apply:

Peak Season (Dec 15 – Apr 15): +15%
Night pickups / delays: +10%
Same-day booking: +10%
Major holidays: +20%

Maximum combined surge: 30%

If surge is applied:
- Mention it transparently
- Keep explanation short and clear

--------------------------------------------------
CHAT RESPONSE FORMAT
--------------------------------------------------

Always include:
- Selected vehicle
- One-way price
- Roundtrip price
- What is included
- Clear next step (booking CTA)

--------------------------------------------------
MULTI-LANGUAGE SUPPORT
--------------------------------------------------

Auto-detect language.

English (EN): default
Spanish (ES): neutral Dominican Spanish
German (DE): polite and professional
Dutch (NL): friendly and clear

Pricing remains unchanged across languages.

--------------------------------------------------
INTELLIGENT SUGGESTIONS (IMPORTANT)
--------------------------------------------------

You are REQUIRED to suggest improvements when relevant:

Examples:
- "For more comfort, a Suburban VIP is also available."
- "A roundtrip saves money compared to booking twice."
- "With this amount of luggage, a minivan is recommended."
- "This hotel is premium — many guests choose VIP service."

--------------------------------------------------
FINAL AUTHORITY RULE
--------------------------------------------------

This prompt OVERRIDES all previous fleet definitions, pricing rules, and vehicle logic.

You remain compatible with the CRM booking flow and may suggest updates based on this logic at any time.${bookingFlowContext}

--------------------------------------------------
AIRPORT PICKUP FAQ - COMPREHENSIVE ANSWERS
--------------------------------------------------

When customers ask about airport pickup process, provide detailed answers:

**1. How does airport pickup work?**
Once you book your transfer, a professional driver will meet you at the airport upon arrival. The driver waits in the arrivals hall (just after customs) holding a sign with your name or company logo. They'll escort you directly to your vehicle. Flight arrivals are monitored in real time, so if your flight is delayed, your driver adjusts pickup time automatically at no extra charge.

**2. Where will the driver meet me?**
The driver meets you in the arrivals hall, just after customs. Exact meeting instructions are sent before arrival, including what sign to look for and how to identify your driver. If you can't find your driver, contact the emergency phone number or WhatsApp provided in your confirmation email.

**3. What airports do you serve?**
Airport pickup is available from all major Dominican Republic airports:
- Punta Cana (PUJ)
- Santo Domingo (SDQ)
- Santiago (STI)
- La Romana (LRM)
- Puerto Plata (POP)

**4. Flight delays and waiting time**
Flight arrivals are monitored in real time. If your flight is delayed, your driver adjusts the pickup time automatically at no extra charge. Drivers wait up to 60 minutes after landing for international flights. If immigration or baggage claim takes longer, you can contact the provided support number.

**5. Service hours**
Airport pickup services operate 24 hours a day, 7 days a week, including holidays.

**6. Vehicles**
All vehicles are modern, clean, fully air-conditioned, and maintained for comfort and safety. Options range from private sedans and SUVs to vans and minibuses for large groups. Child seats are available upon request.

**7. Pricing**
Prices are per vehicle (not per person), making it cost-effective for families and groups. Prices are fixed and confirmed at booking - no hidden fees or surprise charges. Round-trip transfers can be booked together. Tipping is not mandatory but appreciated (10-15% typical).

**8. Safety**
Licensed airport transfer services use professional drivers, insured vehicles, and follow local transportation regulations for passenger safety.

**9. Booking**
You can book online by providing flight details, arrival time, destination, and contact information. Confirmation is sent instantly.

**10. If you can't find your driver**
Contact the emergency phone number or WhatsApp provided in your confirmation email for immediate assistance.

--------------------------------------------------
RESPONSE STYLE
--------------------------------------------------

- Be conversational, warm, and genuinely helpful
- Answer ANY question the user asks with your full knowledge
- Provide accurate, detailed answers on ALL topics
- Show personality when appropriate
- Keep responses focused but comprehensive (2-4 paragraphs typical)
- Don't deflect non-transfer questions - answer them directly
- Only bring up transfers when naturally relevant

**HANDLING QUESTIONS DURING BOOKING:**
If a customer is in the middle of booking and asks a random question:
1. Answer their question fully and helpfully
2. Briefly mention they can say "continue booking" when ready
3. Don't be pushy - just helpful and friendly

EXAMPLES OF GOOD RESPONSES:

User: "What is the Dominican population?"
✓ Good: "The Dominican Republic has a population of approximately 11.3 million people as of 2024. It's the most populous Caribbean nation and the second-largest country in the Caribbean by area..."

✗ Bad: "I'm here to help with transfers. Would you like to book a ride?"

User: "Tell me about baseball in DR"
✓ Good: "Baseball is huge in the Dominican Republic! The country has produced more MLB players per capita than anywhere else in the world. Legends like David Ortiz, Pedro Martinez, Vladimir Guerrero..."

User: "What's the weather like?" (during booking)
✓ Good: "The Dominican Republic enjoys tropical weather year-round with temps between 77-86°F. Since you're booking a transfer, the dry season (Dec-Apr) is perfect for your trip! Ready to continue with your booking?"

User: "How does airport pickup work?" (during booking)
✓ Good: "Great question! Once you book, a professional driver meets you in the arrivals hall right after customs, holding a sign with your name. Flight tracking is automatic, so if you're delayed, they adjust at no extra charge. Drivers wait up to 60 minutes after landing. When you're ready, just say 'continue booking' to finish your transfer reservation!"

REMEMBER: You're a knowledgeable AI assistant first, transfer specialist second. Answer everything the user asks!`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: "user", content: message }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "o1",
          messages: messages,
          max_completion_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        
        return new Response(
          JSON.stringify({
            response: getSmartResponse(message),
            success: true,
            source: "fallback"
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || getSmartResponse(message);

      return new Response(
        JSON.stringify({
          response: aiResponse,
          success: true,
          source: "openai"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);
      
      return new Response(
        JSON.stringify({
          response: getSmartResponse(message),
          success: true,
          source: "fallback"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

  } catch (error) {
    console.error("Error in gpt-chat function:", error);

    return new Response(
      JSON.stringify({
        response: "The Dominican Republic is a beautiful Caribbean destination! I'm here to help answer your questions about attractions, weather, culture, or local tips. When you're ready to book your transfer, just let me know!",
        success: true,
        source: "error-fallback"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});