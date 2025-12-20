import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const knowledgeBase = [
  {
    title: "Company Information",
    category: "company",
    chunks: [
      "Dominican Transfers is a premium ground transportation service in the Dominican Republic. Contact: Phone +31625584645, Email support@dominicantransfers.com, Booking email Booking@dominicantransfers.com, Website dominicantransfers.com. We specialize in airport transfers, private transportation, and group transfers."
    ]
  },
  {
    title: "Vehicle Fleet - Sedan",
    category: "vehicles",
    chunks: [
      "Sedan (Standard Private Transfer): Perfect for couples and solo travelers. Capacity: 2 passengers, 3 pieces of luggage. Category: Economy. Base price: $25. Ideal for airport pickups and short transfers. Comfortable and affordable option for small groups."
    ]
  },
  {
    title: "Vehicle Fleet - Minivan",
    category: "vehicles",
    chunks: [
      "Minivan (Family Transfer): Perfect for families and small groups with luggage. Capacity: 6 passengers, 8 pieces of luggage. Category: Comfort. Base price: $45. Spacious and comfortable for families. Most popular choice for family travel."
    ]
  },
  {
    title: "Vehicle Fleet - Suburban VIP",
    category: "vehicles",
    chunks: [
      "Suburban (Luxury SUV VIP): Perfect for executive travelers seeking premium comfort. Capacity: 4 passengers, 4 pieces of luggage. Category: Luxury. Base price: $65. Black car service with premium amenities. Currently limited availability. Premium leather interior and high-end service."
    ]
  },
  {
    title: "Vehicle Fleet - Sprinter",
    category: "vehicles",
    chunks: [
      "Sprinter (Large Van): Perfect for medium to large groups. Capacity: 12 passengers, 14 pieces of luggage. Category: Business. Base price: $110. Premium group transport with ample luggage space. Great for corporate groups and families traveling together."
    ]
  },
  {
    title: "Vehicle Fleet - Mini Bus",
    category: "vehicles",
    chunks: [
      "Mini Bus: Perfect for large groups and events. Capacity: 20 passengers, 25 pieces of luggage. Category: Group. Base price: $180. Maximum capacity for large group transportation. Ideal for weddings, conferences, and group tours."
    ]
  },
  {
    title: "Airports Serviced",
    category: "airports",
    chunks: [
      "We service four major airports in the Dominican Republic: PUJ (Punta Cana International Airport) - main airport serving Punta Cana and eastern Dominican Republic, most popular for tourists. SDQ (Las Américas International Airport) - serves Santo Domingo capital city. LRM (La Romana International Airport) - serves La Romana and Bayahibe. POP (Puerto Plata International Airport) - serves northern coast including Puerto Plata, Sosua, and Cabarete."
    ]
  },
  {
    title: "Zone A - Bavaro and Punta Cana Hotels",
    category: "destinations",
    chunks: [
      "Zone A - Bavaro/Punta Cana: Distance from PUJ Airport 20-30 minutes. Hotels include: Hard Rock Hotel Punta Cana, Royalton Bavaro, Royalton Punta Cana, Majestic Mirage, Majestic Colonial, Majestic Elegance, Barceló Bávaro Palace, Barceló Bávaro Beach, RIU Palace Bavaro, RIU Palace Punta Cana, RIU Republica, Paradisus Palma Real, Paradisus Grand Cana, Melia Caribe Beach, Melia Punta Cana, Lopesan Costa Bávaro, Secrets Royal Beach, Dreams Royal Beach, Occidental Punta Cana, Iberostar Selection Bavaro, Bahia Principe Fantasia, TRS Turquesa, Grand Palladium Bavaro, Ocean Blue & Sand, Vista Sol Punta Cana, Impressive Punta Cana, Los Corales, Ducassi Suites."
    ]
  },
  {
    title: "Zone B - Cap Cana Hotels",
    category: "destinations",
    chunks: [
      "Zone B - Cap Cana: Distance from PUJ Airport 15-20 minutes. Luxury resort area. Hotels include: Sanctuary Cap Cana, Hyatt Zilara Cap Cana, Hyatt Ziva Cap Cana, Eden Roc Cap Cana, TRS Cap Cana, Secrets Cap Cana, Dreams Cap Cana. This is a premium zone with upscale resorts."
    ]
  },
  {
    title: "Zone C - Uvero Alto Hotels",
    category: "destinations",
    chunks: [
      "Zone C - Uvero Alto: Distance from PUJ Airport 45-60 minutes. Hotels include: Dreams Macao Beach, Royalton Splash, Nickelodeon Resort, Finest Punta Cana, Excellence Punta Cana, Breathless Punta Cana, Zoëtry Agua, Live Aqua Punta Cana. More secluded area with beautiful beaches."
    ]
  },
  {
    title: "Zone D - Bayahibe and La Romana Hotels",
    category: "destinations",
    chunks: [
      "Zone D - Bayahibe/La Romana: Distance from PUJ Airport 75-90 minutes. Hotels include: Dreams Dominicus, Sunscape Dominicus, Hilton La Romana, Iberostar Hacienda Dominicus, Catalonia Royal La Romana, Casa de Campo, Viva Wyndham Dominicus. Gateway to Saona Island."
    ]
  },
  {
    title: "Zone E - Santo Domingo Hotels",
    category: "destinations",
    chunks: [
      "Zone E - Santo Domingo: Distance from PUJ Airport 2.5-3 hours. Capital city. Hotels include: JW Marriott Santo Domingo, Intercontinental Real, Barceló Santo Domingo, Sheraton Santo Domingo, El Embajador Royal Hideaway, Hodelpa Nicolas de Ovando, Billini Hotel, Aloft Santo Domingo."
    ]
  },
  {
    title: "Pricing - PUJ to Zone A (Bavaro/Punta Cana)",
    category: "pricing",
    chunks: [
      "PUJ Airport to Bavaro/Punta Cana (Zone A) pricing: Sedan (2 passengers, 3 luggage) $25 one-way. Minivan (6 passengers, 8 luggage) $45 one-way. Suburban VIP (4 passengers, 4 luggage) $65 one-way. Sprinter (12 passengers, 14 luggage) $110 one-way. Mini Bus (20 passengers, 25 luggage) $180 one-way. Distance: 20-30 minutes. Most popular route."
    ]
  },
  {
    title: "Pricing - PUJ to Zone B (Cap Cana)",
    category: "pricing",
    chunks: [
      "PUJ Airport to Cap Cana (Zone B) pricing: Sedan $28 one-way. Minivan $50 one-way. Suburban VIP $75 one-way. Sprinter $120 one-way. Mini Bus $190 one-way. Distance: 15-20 minutes. Closest luxury zone to airport."
    ]
  },
  {
    title: "Pricing - PUJ to Zone C (Uvero Alto)",
    category: "pricing",
    chunks: [
      "PUJ Airport to Uvero Alto (Zone C) pricing: Sedan $52 one-way. Minivan $95 one-way. Suburban VIP $120 one-way. Sprinter $150 one-way. Mini Bus $205 one-way. Distance: 45-60 minutes. More remote, quieter beaches."
    ]
  },
  {
    title: "Pricing - PUJ to Zone D (Bayahibe)",
    category: "pricing",
    chunks: [
      "PUJ Airport to Bayahibe/La Romana (Zone D) pricing: Sedan $55 one-way. Minivan $100 one-way. Suburban VIP $140 one-way. Sprinter $160 one-way. Mini Bus $220 one-way. Distance: 75-90 minutes. Gateway to Saona Island tours."
    ]
  },
  {
    title: "Pricing - PUJ to Zone E (Santo Domingo)",
    category: "pricing",
    chunks: [
      "PUJ Airport to Santo Domingo (Zone E) pricing: Sedan $235 one-way. Minivan $425 one-way. Suburban VIP $580 one-way. Sprinter $660 one-way. Mini Bus $950 one-way. Distance: 2.5-3 hours. Long distance transfer to capital city."
    ]
  },
  {
    title: "Round Trip Pricing",
    category: "pricing",
    chunks: [
      "Round trip pricing calculation: Multiply one-way price by 1.9 to get round trip price. For example: Zone A Minivan one-way $45, round trip $85.50 (45 x 1.9). This saves 5% compared to booking two one-way trips. Round trips must be booked together at time of reservation."
    ]
  },
  {
    title: "Booking Process",
    category: "booking",
    chunks: [
      "Booking process: 1) Select pickup and dropoff locations (airport to hotel or hotel to airport). 2) Choose vehicle type based on passengers and luggage. 3) Select date and time of pickup. 4) Provide customer information: name, email, phone, flight number (if airport pickup). 5) Add optional extras: child seats (free), extra stops ($10 each). 6) Complete payment via Stripe (credit/debit cards). 7) Receive confirmation email with booking details and driver information."
    ]
  },
  {
    title: "Payment and Currency",
    category: "booking",
    chunks: [
      "Payment: We accept all major credit and debit cards via Stripe: Visa, Mastercard, American Express, Discover. Currency: All prices in USD. Payment is secure and processed through Stripe. Full payment required at time of booking. Receipts emailed automatically."
    ]
  },
  {
    title: "Cancellation Policy",
    category: "policies",
    chunks: [
      "Cancellation policy: Free cancellation up to 24 hours before scheduled pickup time. Full refund issued within 5-10 business days. Cancellations within 24 hours are non-refundable. No-shows are non-refundable. To cancel, contact support@dominicantransfers.com or call +31625584645 with booking reference number."
    ]
  },
  {
    title: "Flight Delays and Tracking",
    category: "policies",
    chunks: [
      "Flight tracking: We track all incoming flights automatically. If your flight is delayed, we adjust pickup time at no extra charge. No waiting time fees for flight delays. Driver will be at airport when you land, regardless of delay. We monitor flight status in real-time. Please provide accurate flight number when booking."
    ]
  },
  {
    title: "Meet and Greet Service",
    category: "services",
    chunks: [
      "Meet and Greet: Included free with all airport pickups. Driver meets you at arrivals hall holding sign with your name. Driver will help with luggage. Driver will be clearly identified. If you can't find driver, call support number on confirmation email. Meeting point is always at arrivals hall exit."
    ]
  },
  {
    title: "Child Seats",
    category: "services",
    chunks: [
      "Child seats: Available free of charge upon request. Types available: infant seat (0-12 months), toddler seat (1-4 years), booster seat (4-8 years). Must be requested at time of booking or at least 24 hours in advance. Limited quantity, subject to availability. Specify age and weight of child when requesting."
    ]
  },
  {
    title: "Luggage Policy",
    category: "policies",
    chunks: [
      "Luggage: Each vehicle has specified luggage capacity. Standard suitcase counts as 1 piece. Oversized items (golf clubs, surfboards, car seats) count as 2 pieces. If you exceed luggage capacity, you may need to upgrade to larger vehicle. Extra luggage fees may apply if not disclosed at booking. Always specify total luggage when booking."
    ]
  },
  {
    title: "Waiting Time",
    category: "policies",
    chunks: [
      "Waiting time: Airport pickups include 60 minutes free waiting time from flight landing. Hotel pickups include 15 minutes free waiting time. After free waiting time, $10 per 15 minutes. Driver will call/text if you're delayed. Please be ready at scheduled pickup time for hotel pickups."
    ]
  },
  {
    title: "Extra Stops",
    category: "services",
    chunks: [
      "Extra stops: $10 per additional stop. Examples: Stop at grocery store, pharmacy, ATM, restaurant. Maximum 20 minutes per stop. Must be requested at booking or communicated to driver. Extra stops may extend journey time. Not available on shared transfers (private transfers only)."
    ]
  },
  {
    title: "Service Hours and Availability",
    category: "services",
    chunks: [
      "Service hours: Available 24/7, 365 days per year. We operate around the clock for airport pickups and transfers. Early morning and late night pickups available at no extra charge. Book at least 24 hours in advance for guaranteed availability. Same-day bookings may be available, contact support to check."
    ]
  },
  {
    title: "Common FAQs - General",
    category: "faq",
    chunks: [
      "Common questions: Q: How do I find my driver? A: Driver meets you at arrivals holding sign with your name. Q: What if flight is delayed? A: We track flights, no extra charge for delays. Q: Can I pay cash? A: No, online credit card payment only via Stripe. Q: Do you have WiFi in vehicles? A: Yes, free WiFi in most vehicles. Q: Is gratuity included? A: No, tips not included but appreciated for excellent service."
    ]
  },
  {
    title: "Hotel Finding - Quick Reference",
    category: "faq",
    chunks: [
      "Finding hotel zone: If customer mentions hotel name, search our zone lists. Zone A (most popular): Hard Rock, Royalton, Barceló, RIU, Majestic. Zone B (luxury): Hyatt, Secrets, Dreams Cap Cana, Sanctuary. Zone C (remote): Excellence, Nickelodeon, Royalton Splash. Zone D: Bayahibe area. Zone E: Santo Domingo city hotels. If hotel not listed, ask for address or landmark."
    ]
  },
  {
    title: "Vehicle Selection Guide",
    category: "faq",
    chunks: [
      "Choosing right vehicle: 1-2 people with standard luggage = Sedan ($25). 3-6 people or family with kids = Minivan ($45). Executives or luxury travelers = Suburban VIP ($65). 7-12 people = Sprinter ($110). 13-20 people = Mini Bus ($180). Consider luggage count. Golf bags and oversized items count as 2 pieces. When in doubt, size up for comfort."
    ]
  }
];

async function generateEmbedding(text: string, supabaseUrl: string, supabaseKey: string): Promise<number[]> {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${await response.text()}`);
  }

  const { embedding } = await response.json();
  return embedding;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting knowledge base seed...');

    // Clear existing data
    await supabase.from('knowledge_base_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('knowledge_base_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let totalChunks = 0;

    // Process each document
    for (const doc of knowledgeBase) {
      console.log(`Processing: ${doc.title}`);
      
      // Create document
      const { data: document, error: docError } = await supabase
        .from('knowledge_base_documents')
        .insert({
          title: doc.title,
          category: doc.category,
          source: 'Dominican Transfers Knowledge Base',
        })
        .select()
        .single();

      if (docError) {
        console.error(`Error creating document ${doc.title}:`, docError);
        continue;
      }

      // Process each chunk
      for (let i = 0; i < doc.chunks.length; i++) {
        const chunk = doc.chunks[i];
        console.log(`  Generating embedding for chunk ${i + 1}/${doc.chunks.length}...`);
        
        try {
          const embedding = await generateEmbedding(chunk, supabaseUrl, supabaseKey);
          
          const { error: chunkError } = await supabase
            .from('knowledge_base_chunks')
            .insert({
              document_id: document.id,
              content: chunk,
              embedding: JSON.stringify(embedding),
              chunk_index: i,
              metadata: { category: doc.category, title: doc.title },
            });

          if (chunkError) {
            console.error(`Error inserting chunk:`, chunkError);
          } else {
            totalChunks++;
          }
        } catch (embError) {
          console.error(`Error generating embedding:`, embError);
        }
      }
    }

    console.log(`Completed! Seeded ${totalChunks} chunks from ${knowledgeBase.length} documents.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Seeded ${totalChunks} chunks from ${knowledgeBase.length} documents`,
        totalDocuments: knowledgeBase.length,
        totalChunks 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});