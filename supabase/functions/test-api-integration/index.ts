import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TestRequest {
  integration_name: string;
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

    const { integration_name }: TestRequest = await req.json();

    if (!integration_name) {
      return new Response(
        JSON.stringify({ error: "integration_name is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: integration, error: integrationError } = await supabaseClient
      .from("api_integrations")
      .select("*")
      .eq("integration_name", integration_name)
      .maybeSingle();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: "Integration not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!integration.api_key) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let testResult;
    let testError = null;

    try {
      switch (integration_name) {
        case "google_maps":
          testResult = await testGoogleMaps(integration);
          break;
        case "flightstats":
          testResult = await testFlightStats(integration);
          break;
        case "aviationstack":
          testResult = await testAviationStack(integration);
          break;
        case "twilio":
          testResult = await testTwilio(integration);
          break;
        case "stripe":
          testResult = await testStripe(integration);
          break;
        case "sendgrid":
          testResult = await testSendGrid(integration);
          break;
        default:
          throw new Error(`Test not implemented for ${integration_name}`);
      }
    } catch (error) {
      testError = error.message;
      testResult = false;
    }

    await supabaseClient
      .from("api_integrations")
      .update({
        last_tested_at: new Date().toISOString(),
        test_status: testResult ? "success" : "failed",
        test_error: testError,
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({
        success: testResult,
        error: testError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error testing integration:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to test integration",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function testGoogleMaps(integration: any): Promise<boolean> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.append("address", "1600 Amphitheatre Parkway, Mountain View, CA");
  url.searchParams.append("key", integration.api_key);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === "REQUEST_DENIED") {
    throw new Error(data.error_message || "Invalid API key");
  }

  if (data.status !== "OK") {
    throw new Error(`API returned status: ${data.status}`);
  }

  return true;
}

async function testFlightStats(integration: any): Promise<boolean> {
  if (!integration.api_secret) {
    throw new Error("API secret is required for FlightStats");
  }

  const url = `${integration.endpoint_url}/flightstatus/rest/v2/json/flight/status/AA/100/dep/2024/12/14`;
  
  const response = await fetch(url, {
    headers: {
      "appId": integration.api_key,
      "appKey": integration.api_secret,
    },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.errorMessage || "Invalid credentials");
  }

  return true;
}

async function testAviationStack(integration: any): Promise<boolean> {
  const url = `${integration.endpoint_url}/flights?access_key=${integration.api_key}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Invalid API key");
  }

  return true;
}

async function testTwilio(integration: any): Promise<boolean> {
  if (!integration.api_secret) {
    throw new Error("Auth token (API secret) is required for Twilio");
  }

  const accountSid = integration.api_key;
  const authToken = integration.api_secret;
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Invalid credentials");
  }

  return true;
}

async function testStripe(integration: any): Promise<boolean> {
  const url = "https://api.stripe.com/v1/balance";
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${integration.api_key}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Invalid API key");
  }

  return true;
}

async function testSendGrid(integration: any): Promise<boolean> {
  const url = "https://api.sendgrid.com/v3/user/profile";
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${integration.api_key}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.errors?.[0]?.message || "Invalid API key");
  }

  return true;
}