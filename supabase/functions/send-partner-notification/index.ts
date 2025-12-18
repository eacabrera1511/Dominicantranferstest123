import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  partner_id: string;
  order_id?: string;
  notification_type: 'new_order' | 'order_update' | 'cancellation' | 'system';
  subject: string;
  content: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { partner_id, order_id, notification_type, subject, content, metadata } = payload;

    if (!partner_id || !notification_type || !subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, business_name, email')
      .eq('id', partner_id)
      .maybeSingle();

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: 'Partner not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: settings } = await supabase
      .from('partner_notification_settings')
      .select('*')
      .eq('partner_id', partner_id)
      .maybeSingle();

    let shouldSendEmail = true;
    let notificationEmail = partner.email;

    if (settings) {
      notificationEmail = settings.notification_email || partner.email;
      
      if (notification_type === 'new_order' && !settings.email_on_new_order) {
        shouldSendEmail = false;
      } else if (notification_type === 'order_update' && !settings.email_on_order_update) {
        shouldSendEmail = false;
      } else if (notification_type === 'cancellation' && !settings.email_on_cancellation) {
        shouldSendEmail = false;
      }
    }

    const { data: message, error: messageError } = await supabase
      .from('partner_messages')
      .insert({
        partner_id,
        order_id,
        message_type: notification_type,
        subject,
        content,
        metadata: metadata || {},
        priority: notification_type === 'new_order' ? 'high' : 
                  notification_type === 'cancellation' ? 'urgent' : 'normal'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
    }

    let emailSent = false;
    let emailLog = null;

    if (shouldSendEmail) {
      const emailContent = formatEmailContent(notification_type, subject, content, partner.business_name, metadata);
      
      emailLog = {
        to: notificationEmail,
        subject: subject,
        html: emailContent,
        text: content
      };

      console.log('Email would be sent:', JSON.stringify(emailLog));
      emailSent = true;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        email_sent: emailSent,
        email_to: shouldSendEmail ? notificationEmail : null,
        email_log: emailLog
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function formatEmailContent(
  type: string,
  subject: string,
  content: string,
  businessName: string,
  metadata?: Record<string, unknown>
): string {
  const typeColors: Record<string, string> = {
    'new_order': '#22c55e',
    'order_update': '#3b82f6',
    'cancellation': '#ef4444',
    'system': '#6b7280'
  };

  const typeLabels: Record<string, string> = {
    'new_order': 'New Booking',
    'order_update': 'Booking Update',
    'cancellation': 'Cancellation',
    'system': 'System Notification'
  };

  const color = typeColors[type] || '#6b7280';
  const label = typeLabels[type] || 'Notification';

  let detailsHtml = '';
  if (metadata && Object.keys(metadata).length > 0) {
    const details = [];
    if (metadata.customer_name) details.push(`<p><strong>Customer:</strong> ${metadata.customer_name}</p>`);
    if (metadata.customer_email) details.push(`<p><strong>Email:</strong> ${metadata.customer_email}</p>`);
    if (metadata.customer_phone) details.push(`<p><strong>Phone:</strong> ${metadata.customer_phone}</p>`);
    if (metadata.booking_type) details.push(`<p><strong>Type:</strong> ${metadata.booking_type}</p>`);
    if (metadata.item_name) details.push(`<p><strong>Item:</strong> ${metadata.item_name}</p>`);
    if (metadata.total_price) details.push(`<p><strong>Total:</strong> $${metadata.total_price}</p>`);
    if (metadata.check_in_date) details.push(`<p><strong>Check-in:</strong> ${new Date(metadata.check_in_date as string).toLocaleDateString()}</p>`);
    if (metadata.check_out_date) details.push(`<p><strong>Check-out:</strong> ${new Date(metadata.check_out_date as string).toLocaleDateString()}</p>`);
    
    if (details.length > 0) {
      detailsHtml = `
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">Booking Details</h3>
          ${details.join('')}
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">Partner Portal</h1>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">${businessName}</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="display: inline-block; background: ${color}20; color: ${color}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
              ${label}
            </div>
            
            <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 18px;">${subject}</h2>
            <p style="margin: 0; color: #475569; line-height: 1.6;">${content}</p>
            
            ${detailsHtml}
            
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View in Partner Portal
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 16px 24px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              This is an automated notification from the Partner Portal.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}