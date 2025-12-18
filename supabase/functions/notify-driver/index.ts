import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationRequest {
  driver_id: string;
  notification_type: 'new_assignment' | 'cancellation' | 'reminder' | 'update';
  priority: 'high' | 'medium' | 'low';
  data: {
    assignment_id?: string;
    booking_id?: string;
    pickup_address?: string;
    pickup_datetime?: string;
    customer_name?: string;
    passenger_count?: number;
    luggage_count?: number;
    message?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const notification: NotificationRequest = await req.json();

    if (!notification.driver_id || !notification.notification_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: driver_id, notification_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', notification.driver_id)
      .single();

    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationChannels: string[] = [];
    const results: Record<string, any> = {};

    const { data: apiConfig } = await supabase
      .from('api_integrations')
      .select('*')
      .in('service_name', ['twilio', 'sendgrid', 'firebase']);

    const twilioConfig = apiConfig?.find(c => c.service_name === 'twilio' && c.status === 'active');
    const sendgridConfig = apiConfig?.find(c => c.service_name === 'sendgrid' && c.status === 'active');

    if (twilioConfig && driver.phone) {
      try {
        const smsBody = generateSMSMessage(notification);

        const twilioAuth = btoa(`${twilioConfig.credentials.account_sid}:${twilioConfig.credentials.auth_token}`);

        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.credentials.account_sid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: driver.phone,
              From: twilioConfig.credentials.phone_number,
              Body: smsBody,
            }),
          }
        );

        const twilioResult = await twilioResponse.json();

        if (twilioResponse.ok) {
          notificationChannels.push('SMS');
          results.sms = { success: true, sid: twilioResult.sid };
        } else {
          results.sms = { success: false, error: twilioResult.message };
        }
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    if (sendgridConfig && driver.email) {
      try {
        const emailContent = generateEmailMessage(notification, driver);

        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridConfig.credentials.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: driver.email, name: `${driver.first_name} ${driver.last_name}` }],
              },
            ],
            from: {
              email: sendgridConfig.credentials.from_email || 'noreply@company.com',
              name: 'Dispatch Team',
            },
            subject: emailContent.subject,
            content: [
              {
                type: 'text/html',
                value: emailContent.html,
              },
            ],
          }),
        });

        if (sendgridResponse.ok) {
          notificationChannels.push('Email');
          results.email = { success: true };
        } else {
          const errorText = await sendgridResponse.text();
          results.email = { success: false, error: errorText };
        }
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    await supabase.from('driver_notifications').insert({
      driver_id: driver.id,
      notification_type: notification.notification_type,
      channels: notificationChannels,
      message: generateSMSMessage(notification),
      data: notification.data,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        driver_id: driver.id,
        channels: notificationChannels,
        results,
        message: notificationChannels.length > 0
          ? `Notification sent via ${notificationChannels.join(', ')}`
          : 'No notification channels configured',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-driver:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSMSMessage(notification: NotificationRequest): string {
  switch (notification.notification_type) {
    case 'new_assignment':
      return `New Trip Alert!\nPickup: ${notification.data.pickup_address}\nTime: ${formatDateTime(notification.data.pickup_datetime)}\nPassengers: ${notification.data.passenger_count} + ${notification.data.luggage_count} bags\nOpen app to accept.`;

    case 'cancellation':
      return `Trip Cancelled\nBooking ${notification.data.booking_id} has been cancelled. Check app for details.`;

    case 'reminder':
      return `Trip Reminder\nPickup in 30 minutes at ${notification.data.pickup_address}. Customer: ${notification.data.customer_name}`;

    case 'update':
      return `Trip Update\n${notification.data.message}`;

    default:
      return `Notification: ${notification.data.message || 'Please check your app'}`;
  }
}

function generateEmailMessage(notification: NotificationRequest, driver: any): { subject: string; html: string } {
  const driverName = `${driver.first_name} ${driver.last_name}`;

  switch (notification.notification_type) {
    case 'new_assignment':
      return {
        subject: 'New Trip Assignment',
        html: `
          <h2>New Trip Assignment</h2>
          <p>Hi ${driverName},</p>
          <p>You have been assigned to a new trip:</p>
          <table style="border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Pickup:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${notification.data.pickup_address}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formatDateTime(notification.data.pickup_datetime)}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Customer:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${notification.data.customer_name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${notification.data.passenger_count} adults</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Luggage:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${notification.data.luggage_count} pieces</td></tr>
          </table>
          <p><a href="https://app.company.com/driver/assignment/${notification.data.assignment_id}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Accept Assignment</a></p>
          <p>Thank you,<br>Dispatch Team</p>
        `,
      };

    case 'cancellation':
      return {
        subject: 'Trip Cancellation',
        html: `
          <h2>Trip Cancelled</h2>
          <p>Hi ${driverName},</p>
          <p>The following trip has been cancelled:</p>
          <p><strong>Booking ID:</strong> ${notification.data.booking_id}</p>
          <p>${notification.data.message || 'Please check the app for more details.'}</p>
          <p>Thank you,<br>Dispatch Team</p>
        `,
      };

    case 'reminder':
      return {
        subject: 'Upcoming Trip Reminder',
        html: `
          <h2>Trip Reminder</h2>
          <p>Hi ${driverName},</p>
          <p>This is a reminder that you have an upcoming trip in 30 minutes:</p>
          <p><strong>Pickup:</strong> ${notification.data.pickup_address}<br>
          <strong>Time:</strong> ${formatDateTime(notification.data.pickup_datetime)}<br>
          <strong>Customer:</strong> ${notification.data.customer_name}</p>
          <p>Thank you,<br>Dispatch Team</p>
        `,
      };

    default:
      return {
        subject: 'Notification from Dispatch',
        html: `
          <h2>Notification</h2>
          <p>Hi ${driverName},</p>
          <p>${notification.data.message || 'You have a new notification. Please check the app.'}</p>
          <p>Thank you,<br>Dispatch Team</p>
        `,
      };
  }
}

function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Not specified';

  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
