import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecoveryEmailRequest {
  incompleteBookingId: string;
  email: string;
  customerName: string;
  bookingDetails: {
    vehicleName: string;
    route: string;
    pickupDate: string;
    pickupTime: string;
    totalPrice: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { incompleteBookingId, email, customerName, bookingDetails }: RecoveryEmailRequest = await req.json();

    if (!incompleteBookingId || !email || !customerName || !bookingDetails) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://travelsmart.com";
    const recoveryUrl = `${frontendUrl}?resume=${incompleteBookingId}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Booking</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(90deg, #10b981 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                      🚗 TravelSmart
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Premium Airport Transfers
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: 600;">
                      Hey ${customerName}, you didn't finish your booking! 👋
                    </h2>

                    <p style="margin: 0 0 24px 0; color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6;">
                      We noticed you started booking a transfer but didn't complete the payment. Your reservation is waiting for you!
                    </p>

                    <!-- Booking Summary Card -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin: 24px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 4px 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                            Your Booking Details
                          </p>

                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 13px;">Vehicle</p>
                                <p style="margin: 4px 0 0 0; color: white; font-size: 15px; font-weight: 600;">${bookingDetails.vehicleName}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 13px;">Route</p>
                                <p style="margin: 4px 0 0 0; color: white; font-size: 15px; font-weight: 600;">${bookingDetails.route}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 13px;">Pickup</p>
                                <p style="margin: 4px 0 0 0; color: white; font-size: 15px; font-weight: 600;">${bookingDetails.pickupDate} at ${bookingDetails.pickupTime}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 16px 0 8px 0;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                    <td>
                                      <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total Amount</p>
                                    </td>
                                    <td style="text-align: right;">
                                      <p style="margin: 0; color: #10b981; font-size: 28px; font-weight: 700;">$${bookingDetails.totalPrice}</p>
                                      <p style="margin: 4px 0 0 0; color: rgba(16,185,129,0.7); font-size: 11px; font-weight: 600;">USD</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0 24px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${recoveryUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(90deg, #10b981 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 20px rgba(16,185,129,0.4);">
                            Complete My Booking →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6;">
                      This link will expire in 24 hours. If you have any questions, feel free to reply to this email or contact our support team.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; line-height: 1.6;">
                      TravelSmart - Premium Airport Transfer Service<br>
                      Dominican Republic<br>
                      <a href="mailto:support@travelsmart.com" style="color: #10b981; text-decoration: none;">support@travelsmart.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TravelSmart <bookings@travelsmart.com>",
        to: [email],
        subject: "Complete Your TravelSmart Booking 🚗",
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      throw new Error(`Failed to send email: ${resendData.message || "Unknown error"}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recovery email sent successfully",
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending recovery email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});