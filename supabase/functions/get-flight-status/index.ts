import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FlightRequest {
  flight_number: string;
  date?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { flight_number, date }: FlightRequest = await req.json();

    if (!flight_number) {
      return new Response(
        JSON.stringify({ error: "flight_number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: integrations, error: integrationError } = await supabaseClient
      .from("api_integrations")
      .select("*")
      .in("integration_name", ["flightstats", "aviationstack"])
      .eq("is_active", true)
      .maybeSingle();

    if (integrationError || !integrations || !integrations.api_key) {
      return new Response(
        JSON.stringify({
          error: "Flight tracking API not configured. Please configure FlightStats or Aviation Stack in admin settings.",
          configured: false,
          flight_number,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let flightData;

    if (integrations.integration_name === "aviationstack") {
      const url = `${integrations.endpoint_url}/flights?access_key=${integrations.api_key}&flight_iata=${flight_number}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Aviation Stack API error");
      }

      if (data.data && data.data.length > 0) {
        const flight = data.data[0];
        flightData = {
          flight_number: flight.flight.iata,
          airline: flight.airline.name,
          status: flight.flight_status,
          departure: {
            airport: flight.departure.airport,
            iata: flight.departure.iata,
            scheduled: flight.departure.scheduled,
            estimated: flight.departure.estimated,
            actual: flight.departure.actual,
          },
          arrival: {
            airport: flight.arrival.airport,
            iata: flight.arrival.iata,
            scheduled: flight.arrival.scheduled,
            estimated: flight.arrival.estimated,
            actual: flight.arrival.actual,
          },
          aircraft: flight.aircraft?.registration || null,
          delay: flight.departure.delay || 0,
        };
      }
    } else if (integrations.integration_name === "flightstats") {
      const flightDate = date || new Date().toISOString().split("T")[0].replace(/-/g, "/");
      const [carrier, number] = flight_number.match(/([A-Z]{2})(\d+)/)?.slice(1) || [];
      
      if (!carrier || !number) {
        throw new Error("Invalid flight number format. Use format like AA123");
      }

      const url = `${integrations.endpoint_url}/flightstatus/rest/v2/json/flight/status/${carrier}/${number}/dep/${flightDate}`;
      
      const response = await fetch(url, {
        headers: {
          "appId": integrations.api_key,
          "appKey": integrations.api_secret || "",
        },
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.errorMessage || "FlightStats API error");
      }

      if (data.flightStatuses && data.flightStatuses.length > 0) {
        const flight = data.flightStatuses[0];
        flightData = {
          flight_number: `${flight.carrierFsCode}${flight.flightNumber}`,
          airline: flight.carrier?.name || "",
          status: flight.status,
          departure: {
            airport: flight.departureAirportFsCode,
            scheduled: flight.operationalTimes?.scheduledGateDeparture?.dateUtc,
            estimated: flight.operationalTimes?.estimatedGateDeparture?.dateUtc,
            actual: flight.operationalTimes?.actualGateDeparture?.dateUtc,
          },
          arrival: {
            airport: flight.arrivalAirportFsCode,
            scheduled: flight.operationalTimes?.scheduledGateArrival?.dateUtc,
            estimated: flight.operationalTimes?.estimatedGateArrival?.dateUtc,
            actual: flight.operationalTimes?.actualGateArrival?.dateUtc,
          },
          aircraft: flight.fleetAircraftCode || null,
          delay: flight.delays?.departureGateDelayMinutes || 0,
        };
      }
    }

    if (!flightData) {
      return new Response(
        JSON.stringify({
          error: "Flight not found",
          flight_number,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        flight: flightData,
        source: integrations.integration_name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching flight status:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch flight status",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});