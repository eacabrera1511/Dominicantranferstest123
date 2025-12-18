import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DistanceRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  mode?: "driving" | "walking" | "bicycling" | "transit";
}

interface DistanceResponse {
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  origin: string;
  destination: string;
  polyline?: string;
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

    const { origin, destination, waypoints, mode = "driving" }: DistanceRequest = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: "origin and destination are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: integration, error: integrationError } = await supabaseClient
      .from("api_integrations")
      .select("*")
      .eq("integration_name", "google_maps")
      .eq("is_active", true)
      .maybeSingle();

    if (integrationError || !integration || !integration.api_key) {
      const estimatedDistance = calculateStraightLineDistance(origin, destination);
      
      return new Response(
        JSON.stringify({
          error: "Google Maps API not configured. Using estimated straight-line distance.",
          configured: false,
          estimated: true,
          distance: {
            value: Math.round(estimatedDistance * 1609.34),
            text: `${estimatedDistance.toFixed(1)} mi`,
          },
          duration: {
            value: Math.round((estimatedDistance / 45) * 3600),
            text: `${Math.round(estimatedDistance / 45 * 60)} mins`,
          },
          origin,
          destination,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = integration.api_key;
    const endpoints = integration.configuration?.endpoints || {};
    
    let url = new URL(endpoints.distance_matrix || "https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.append("origins", origin);
    url.searchParams.append("destinations", destination);
    url.searchParams.append("mode", mode);
    url.searchParams.append("key", apiKey);

    if (waypoints && waypoints.length > 0) {
      url = new URL(endpoints.directions || "https://maps.googleapis.com/maps/api/directions/json");
      url.searchParams.append("origin", origin);
      url.searchParams.append("destination", destination);
      url.searchParams.append("waypoints", waypoints.join("|"));
      url.searchParams.append("mode", mode);
      url.searchParams.append("key", apiKey);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message || `Google Maps API error: ${data.status}`);
    }

    let result: DistanceResponse;

    if (waypoints && waypoints.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      let totalDistance = 0;
      let totalDuration = 0;
      
      route.legs.forEach((leg: any) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
      });

      result = {
        distance: {
          value: totalDistance,
          text: formatDistance(totalDistance),
        },
        duration: {
          value: totalDuration,
          text: formatDuration(totalDuration),
        },
        origin,
        destination,
        polyline: route.overview_polyline?.points,
      };
    } else {
      const element = data.rows[0].elements[0];
      
      if (element.status !== "OK") {
        throw new Error(`Route calculation failed: ${element.status}`);
      }

      result = {
        distance: element.distance,
        duration: element.duration,
        origin: data.origin_addresses[0],
        destination: data.destination_addresses[0],
      };
    }

    await supabaseClient
      .from("api_integrations")
      .update({
        last_tested_at: new Date().toISOString(),
        test_status: "success",
        test_error: null,
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({
        success: true,
        configured: true,
        estimated: false,
        ...result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error calculating distance:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to calculate distance",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateStraightLineDistance(origin: string, destination: string): number {
  const parseCoords = (location: string): [number, number] | null => {
    const match = location.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
  };

  const originCoords = parseCoords(origin);
  const destCoords = parseCoords(destination);

  if (!originCoords || !destCoords) {
    return 10;
  }

  const [lat1, lon1] = originCoords;
  const [lat2, lon2] = destCoords;

  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance * 1.2;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(meters * 3.28084)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}