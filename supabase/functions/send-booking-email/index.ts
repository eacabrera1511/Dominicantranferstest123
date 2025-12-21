import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  bookingId: string;
  emailType: 'confirmation' | 'reminder' | 'completion' | 'cancellation' | 'admin_notification' | 'payment_link';
  adminEmail?: string;
  refundAmount?: number;
  paymentUrl?: string;
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const generatePaymentLinkEmailHTML = (booking: any, paymentUrl: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Booking Payment</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);">
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); padding: 50px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 80px;">
                      <span style="font-size: 40px; color: white;">💳</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Dominican Transfers</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 400;">Premium Transfer Services</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); padding: 40px 40px 30px; text-align: center;">
                <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 28px; font-weight: 600;">Complete Your Payment</h2>
                <p style="color: #64748b; margin: 0; font-size: 16px;">Your transfer booking is almost complete! Click below to finalize your reservation.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; padding: 30px; text-align: center; position: relative; overflow: hidden;">
                <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Booking Reference</p>
                <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace;">${booking.reference}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #0f172a; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Trip Details</p>
                  </td>
                </tr>
              </table>
              <div style="background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px dashed #e2e8f0; margin-bottom: 20px;">
                  <p style="color: #0ea5e9; margin: 0 0 4px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Pickup Date & Time</p>
                  <p style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">${formatDate(booking.pickup_datetime)}</p>
                  <p style="color: #0f172a; margin: 4px 0 0 0; font-size: 28px; font-weight: 800;">${formatTime(booking.pickup_datetime)}</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top" style="padding-top: 4px;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; text-align: center; line-height: 32px;">
                        <span style="color: white; font-size: 14px; font-weight: 700;">A</span>
                      </div>
                      <div style="width: 2px; height: 40px; background: linear-gradient(180deg, #22c55e 0%, #0ea5e9 100%); margin: 8px auto;"></div>
                    </td>
                    <td style="padding-left: 16px; padding-bottom: 16px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Pickup Location</p>
                      <p style="color: #0f172a; margin: 0; font-size: 16px; font-weight: 600;">${booking.pickup_location}</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="padding-top: 4px;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 50%; text-align: center; line-height: 32px;">
                        <span style="color: white; font-size: 14px; font-weight: 700;">B</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Destination</p>
                      <p style="color: #0f172a; margin: 0; font-size: 16px; font-weight: 600;">${booking.dropoff_location}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px;">Vehicle Type</td>
                        <td align="right" style="color: #0f172a; font-size: 14px; font-weight: 600;">${booking.vehicle_type}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px;">Passengers</td>
                        <td align="right" style="color: #0f172a; font-size: 14px; font-weight: 600;">${booking.passengers || 1}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 600;">Total Amount</td>
                        <td align="right" style="color: #ffffff; font-size: 32px; font-weight: 800;">${formatCurrency(booking.total_price)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.4); transition: all 0.3s;">
                💳 PAY NOW - ${formatCurrency(booking.total_price)}
              </a>
              <p style="color: #64748b; margin: 16px 0 0 0; font-size: 13px;">Secure payment powered by Stripe</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">⚡ <strong>Important:</strong> Please complete your payment within 24 hours to secure your booking.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px; border-top: 2px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding-top: 30px;">
                <tr>
                  <td align="center">
                    <p style="color: #64748b; margin: 0 0 16px 0; font-size: 14px;">Need assistance?</p>
                    <p style="color: #0f172a; margin: 0; font-size: 16px; font-weight: 600;">
                      <a href="mailto:booking@dominicantransfers.com" style="color: #0ea5e9; text-decoration: none;">booking@dominicantransfers.com</a>
                    </p>
                    <p style="color: #0f172a; margin: 8px 0 0 0; font-size: 16px; font-weight: 600;">
                      <a href="https://wa.me/18297606434" style="color: #0ea5e9; text-decoration: none;">WhatsApp: +1 (829) 760-6434</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
          <tr>
            <td align="center">
              <p style="color: #94a3b8; margin: 0; font-size: 13px;">© 2024 Dominican Transfers. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getEmailSubject = (emailType: string, reference: string): string => {
  switch (emailType) {
    case 'confirmation':
      return `Your Booking is Confirmed! - ${reference}`;
    case 'payment_link':
      return `Complete Your Payment - ${reference}`;
    case 'reminder':
      return `Reminder: Your Transfer is Tomorrow - ${reference}`;
    case 'completion':
      return `Thank You for Traveling with Us - ${reference}`;
    case 'cancellation':
      return `Booking Cancelled - ${reference}`;
    case 'admin_notification':
      return `NEW BOOKING ALERT - ${reference} - Action Required`;
    default:
      return `Booking Update - ${reference}`;
  }
};

const generateCustomerEmailHTML = (booking: any, emailType: string, cancellationToken?: string, refundAmount?: number): string => {
  const isCancellation = emailType === 'cancellation';
  const primaryColor = isCancellation ? '#dc2626' : '#0ea5e9';
  const headerGradient = isCancellation
    ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
    : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)';

  const statusMessage: Record<string, string> = {
    confirmation: 'Your premium transfer has been confirmed. A professional driver will be assigned to your journey.',
    reminder: 'Your transfer is scheduled for tomorrow. Please be ready at the pickup location.',
    completion: 'Thank you for choosing Dominican Transfers. We hope you had an excellent journey.',
    cancellation: 'Your booking cancellation has been processed successfully.',
  };

  const statusIcon: Record<string, string> = {
    confirmation: '&#10003;',
    reminder: '&#128276;',
    completion: '&#11088;',
    cancellation: '&#10060;',
  };

  const cancellationUrl = cancellationToken
    ? `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '').replace('https://', 'https://').split('.supabase.co')[0]}.supabase.co/cancel-booking?token=${cancellationToken}`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking ${emailType.charAt(0).toUpperCase() + emailType.slice(1)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);">
          <tr>
            <td style="background: ${headerGradient}; padding: 50px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 80px;">
                      <span style="font-size: 40px; color: white;">${statusIcon[emailType] || '&#10003;'}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Dominican Transfers</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 400;">Premium Transfer Services</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(180deg, ${isCancellation ? '#fef2f2' : '#f0f9ff'} 0%, #ffffff 100%); padding: 40px 40px 30px; text-align: center;">
                <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 28px; font-weight: 600;">Booking ${emailType.charAt(0).toUpperCase() + emailType.slice(1)}</h2>
                <p style="color: #64748b; margin: 0; font-size: 16px;">${statusMessage[emailType] || ''}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; padding: 30px; text-align: center; position: relative; overflow: hidden;">
                <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Booking Reference</p>
                <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace;">${booking.reference}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #0f172a; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Trip Details</p>
                  </td>
                </tr>
              </table>
              <div style="background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px dashed #e2e8f0; margin-bottom: 20px;">
                  <p style="color: ${primaryColor}; margin: 0 0 4px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Pickup Date & Time</p>
                  <p style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">${formatDate(booking.pickup_datetime)}</p>
                  <p style="color: #0f172a; margin: 4px 0 0 0; font-size: 28px; font-weight: 800;">${formatTime(booking.pickup_datetime)}</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top" style="padding-top: 4px;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; text-align: center; line-height: 32px;">
                        <span style="color: white; font-size: 14px; font-weight: 700;">A</span>
                      </div>
                      <div style="width: 2px; height: 40px; background: linear-gradient(180deg, #22c55e 0%, #0ea5e9 100%); margin: 8px auto;"></div>
                    </td>
                    <td style="padding-left: 16px; padding-bottom: 16px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Pickup Location</p>
                      <p style="color: #0f172a; margin: 0; font-size: 16px; font-weight: 600;">${booking.pickup_location}</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="padding-top: 4px;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 50%; text-align: center; line-height: 32px;">
                        <span style="color: white; font-size: 14px; font-weight: 700;">B</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Dropoff Location</p>
                      <p style="color: #0f172a; margin: 0; font-size: 16px; font-weight: 600;">${booking.dropoff_location}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                    <p style="color: #64748b; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Passengers</p>
                    <p style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">${booking.passengers}</p>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">${booking.passengers === 1 ? 'Person' : 'People'}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                    <p style="color: #64748b; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Vehicle</p>
                    <p style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">${booking.vehicle_type || 'Standard'}</p>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Class</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${booking.special_requests ? `<tr><td style="padding: 0 40px 30px;"><div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 20px; border: 1px solid #fcd34d;"><p style="color: #92400e; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Special Requests</p><p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.6;">${booking.special_requests}</p></div></td></tr>` : ''}
          ${booking.flight_number ? `<tr><td style="padding: 0 40px 30px;"><div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 20px; border: 1px solid #93c5fd;"><p style="color: #1e40af; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Flight Information</p><p style="color: #1e3a8a; margin: 0; font-size: 20px; font-weight: 700;">${booking.flight_number}</p></div></td></tr>` : ''}
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); border-radius: 16px; padding: 30px; position: relative; overflow: hidden;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
                      <p style="color: #ffffff; margin: 0; font-size: 42px; font-weight: 800; letter-spacing: -1px;">${formatCurrency(booking.total_price)}</p>
                    </td>
                    <td style="text-align: right; vertical-align: bottom;">
                      <span style="display: inline-block; padding: 10px 20px; background: ${booking.payment_status === 'paid' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; color: white; border-radius: 30px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Booked By</p>
                <p style="color: #0f172a; margin: 0 0 4px 0; font-size: 18px; font-weight: 600;">${booking.customer_name}</p>
                <p style="color: #64748b; margin: 0 0 2px 0; font-size: 14px;">${booking.customer_email}</p>
                <p style="color: #64748b; margin: 0; font-size: 14px;">${booking.customer_phone || ''}</p>
              </div>
            </td>
          </tr>
          ${!isCancellation ? `<tr><td style="padding: 0 40px 30px;"><div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 30px; border: 1px solid #bae6fd;"><h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">How to Find Your Driver</h3><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding: 12px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="40" valign="top"><div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 50%; text-align: center; line-height: 32px;"><span style="color: white; font-size: 16px; font-weight: 700;">1</span></div></td><td style="padding-left: 16px;"><p style="color: #0c4a6e; margin: 0; font-size: 15px; font-weight: 600;">Your driver will arrive 10 minutes before pickup time</p></td></tr></table></td></tr><tr><td style="padding: 12px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="40" valign="top"><div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 50%; text-align: center; line-height: 32px;"><span style="color: white; font-size: 16px; font-weight: 700;">2</span></div></td><td style="padding-left: 16px;"><p style="color: #0c4a6e; margin: 0; font-size: 15px; font-weight: 600;">Look for driver with Dominican Transfers sign showing: ${booking.customer_name}</p></td></tr></table></td></tr><tr><td style="padding: 12px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="40" valign="top"><div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 50%; text-align: center; line-height: 32px;"><span style="color: white; font-size: 16px; font-weight: 700;">3</span></div></td><td style="padding-left: 16px;"><p style="color: #0c4a6e; margin: 0; font-size: 15px; font-weight: 600;">Reference for verification: ${booking.reference}</p></td></tr></table></td></tr></table></div></td></tr>` : ''}
          ${cancellationUrl && !isCancellation ? `<tr><td style="padding: 0 40px 30px;"><div style="background: #fefce8; border-radius: 12px; padding: 24px; border: 1px solid #fde047; text-align: center;"><p style="color: #713f12; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Need to Cancel?</p><p style="color: #854d0e; margin: 0 0 16px 0; font-size: 14px;">Free cancellation up to 24 hours before pickup</p><a href="${cancellationUrl}" style="display: inline-block; padding: 12px 32px; background: #ffffff; color: #ca8a04; border: 2px solid #eab308; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">Request Cancellation</a></div></td></tr>` : ''}
          ${isCancellation && refundAmount ? `<tr><td style="padding: 0 40px 30px;"><div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 16px; padding: 30px; border: 1px solid #fcd34d;"><h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; text-align: center;">Refund Information</h3><div style="background: #ffffff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;"><p style="color: #78350f; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Refund Amount</p><p style="color: #92400e; margin: 0; font-size: 36px; font-weight: 800;">${formatCurrency(refundAmount)}</p></div><p style="color: #78350f; margin: 0; font-size: 14px; text-align: center;">Refunds processed within 5-10 business days.</p></div></td></tr>` : ''}
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 30px; text-align: center; border: 1px solid #a7f3d0;">
                <p style="color: #065f46; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Need Assistance?</p>
                <p style="color: #047857; margin: 0 0 20px 0; font-size: 14px;">Our support team is available 24/7</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%" style="text-align: center;">
                      <a href="mailto:info@dominicantransfers.com" style="display: inline-block; padding: 12px 24px; background: #ffffff; color: #059669; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; border: 2px solid #10b981;">Email Support</a>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="text-align: center;">
                      <a href="tel:+31625584645" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">Call +31 6 2558 4645</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
              <p style="color: #f8fafc; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Thank you for choosing Dominican Transfers</p>
              <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 14px;">Your journey, our priority</p>
              <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">Dominican Transfers. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const generateAdminDispatchEmailHTML = (booking: any): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.2); border-radius: 20px; margin-bottom: 12px;">
                      <span style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">New Booking Alert</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Dispatch Required</h1>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">Received at</p>
                    <p style="color: #ffffff; margin: 4px 0 0 0; font-size: 16px; font-weight: 600;">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="60%">
                    <p style="color: #94a3b8; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Booking Reference</p>
                    <p style="color: #f8fafc; margin: 0; font-size: 32px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 2px;">${booking.reference}</p>
                  </td>
                  <td width="40%" style="text-align: right;">
                    <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px;">
                      <p style="color: #ffffff; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</p>
                      <p style="color: #ffffff; margin: 4px 0 0 0; font-size: 18px; font-weight: 700;">${(booking.status || 'PENDING').toUpperCase()}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Pickup Scheduled For</p>
                <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">${formatDateTime(booking.pickup_datetime)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: #0f172a; border-radius: 16px; padding: 24px; border: 1px solid #334155;">
                <p style="color: #94a3b8; margin: 0 0 16px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Route Information</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50" valign="top">
                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 10px; text-align: center; line-height: 40px;">
                        <span style="color: white; font-size: 16px; font-weight: 700;">A</span>
                      </div>
                      <div style="width: 2px; height: 30px; background: linear-gradient(180deg, #22c55e 0%, #0ea5e9 100%); margin: 8px auto;"></div>
                    </td>
                    <td style="padding-left: 16px; padding-bottom: 20px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Pickup</p>
                      <p style="color: #f8fafc; margin: 0; font-size: 18px; font-weight: 600;">${booking.pickup_location}</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="50" valign="top">
                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 10px; text-align: center; line-height: 40px;">
                        <span style="color: white; font-size: 16px; font-weight: 700;">B</span>
                      </div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Dropoff</p>
                      <p style="color: #f8fafc; margin: 0; font-size: 18px; font-weight: 600;">${booking.dropoff_location}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32%" style="background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Passengers</p>
                    <p style="color: #f8fafc; margin: 0; font-size: 32px; font-weight: 800;">${booking.passengers}</p>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Vehicle</p>
                    <p style="color: #f8fafc; margin: 0; font-size: 18px; font-weight: 700;">${booking.vehicle_type || 'Standard'}</p>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Amount</p>
                    <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">${formatCurrency(booking.total_price)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: #0f172a; border-radius: 16px; padding: 24px; border: 1px solid #334155;">
                <p style="color: #94a3b8; margin: 0 0 16px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Customer Information</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="33%">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Name</p>
                      <p style="color: #f8fafc; margin: 0; font-size: 16px; font-weight: 600;">${booking.customer_name}</p>
                    </td>
                    <td width="34%">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                      <p style="color: #0ea5e9; margin: 0; font-size: 14px;">${booking.customer_email}</p>
                    </td>
                    <td width="33%">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Phone</p>
                      <p style="color: #f8fafc; margin: 0; font-size: 16px; font-weight: 600;">${booking.customer_phone || 'N/A'}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          ${booking.special_requests ? `<tr><td style="padding: 0 40px 20px;"><div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 20px;"><p style="color: #78350f; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Special Requests</p><p style="color: #451a03; margin: 0; font-size: 15px; font-weight: 500;">${booking.special_requests}</p></div></td></tr>` : ''}
          ${booking.flight_number ? `<tr><td style="padding: 0 40px 20px;"><div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 20px;"><p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Flight Information</p><p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${booking.flight_number}</p></div></td></tr>` : ''}
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Payment Status</p>
                      <span style="display: inline-block; padding: 8px 16px; background: ${booking.payment_status === 'paid' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; border-radius: 20px; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase;">${booking.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span>
                    </td>
                    <td width="50%">
                      <p style="color: #64748b; margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Booking Source</p>
                      <span style="display: inline-block; padding: 8px 16px; background: #334155; border-radius: 20px; color: #f8fafc; font-size: 13px; font-weight: 600; text-transform: uppercase;">${booking.source || 'DIRECT'}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #0f172a; padding: 30px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">Dominican Transfers Dispatch System</p>
              <p style="color: #475569; margin: 8px 0 0 0; font-size: 11px;">This is an automated notification.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('NEW_RESEND_API2') || Deno.env.get('NEW_RESEND_API');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Dominican Transfers <Booking@dominicantransfers.com>';

    console.log('Email function invoked with:', {
      hasResendKey: !!resendApiKey,
      keySource: Deno.env.get('RESEND_API_KEY') ? 'RESEND_API_KEY' : (Deno.env.get('NEW_RESEND_API2') ? 'NEW_RESEND_API2' : 'NEW_RESEND_API'),
      fromEmail: resendFromEmail,
      supabaseUrl
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bookingId, emailType, adminEmail, refundAmount, paymentUrl }: EmailRequest = await req.json();

    if (!bookingId || !emailType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: bookingId, emailType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found', details: bookingError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdminEmail = emailType === 'admin_notification';
    const recipientEmail = isAdminEmail ? (adminEmail || 'info@dominicantransfers.com') : booking.customer_email;
    const emailSubject = getEmailSubject(emailType, booking.reference);

    let cancellationToken: string | null = null;

    if (!isAdminEmail && emailType === 'confirmation') {
      const { data: existingRequest } = await supabase
        .from('booking_cancellation_requests')
        .select('cancellation_token')
        .eq('booking_id', bookingId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRequest?.cancellation_token) {
        cancellationToken = existingRequest.cancellation_token;
      }
    }

    let emailHTML: string;
    if (isAdminEmail) {
      emailHTML = generateAdminDispatchEmailHTML(booking);
    } else if (emailType === 'payment_link' && (paymentUrl || booking.payment_url)) {
      emailHTML = generatePaymentLinkEmailHTML(booking, paymentUrl || booking.payment_url);
    } else {
      emailHTML = generateCustomerEmailHTML(booking, emailType, cancellationToken || undefined, refundAmount);
    }

    let emailSent = false;
    let emailError: string | null = null;
    let providerId: string | null = null;

    if (resendApiKey) {
      try {
        console.log('Attempting to send email via Resend to:', recipientEmail);
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [recipientEmail],
            subject: emailSubject,
            html: emailHTML,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log('Resend API response status:', emailResponse.status);
        console.log('Resend API response:', emailResult);

        if (emailResponse.ok && emailResult.id) {
          emailSent = true;
          providerId = emailResult.id;
          console.log('✅ Email sent successfully:', emailResult.id);
        } else {
          emailError = emailResult.message || emailResult.error?.message || JSON.stringify(emailResult) || 'Failed to send email';
          
          if (emailError.includes('only send testing emails') || emailError.includes('verify a domain')) {
            console.warn('⚠️ Resend is in TEST MODE - domain verification required');
            console.warn('⚠️ Email attempted to:', recipientEmail);
            console.warn('⚠️ To fix: Verify dominicantransfers.nl at https://resend.com/domains');
            emailError = `TEST MODE: ${emailError}`;
          } else {
            console.error('❌ Resend API error:', emailResult);
          }
        }
      } catch (sendError: any) {
        emailError = sendError.message || 'Unknown send error';
        console.error('❌ Email send exception:', sendError);
      }
    } else {
      emailError = 'RESEND_API_KEY not configured - emails will be logged only';
      console.warn('⚠️ RESEND_API_KEY not configured - email will be logged but not sent');
      console.log('📧 Email would be sent to:', recipientEmail);
      console.log('📧 Subject:', emailSubject);
      console.log('📧 Type:', emailType);
    }

    try {
      await supabase
        .from('email_logs')
        .insert({
          booking_id: bookingId,
          recipient_email: recipientEmail,
          recipient_name: isAdminEmail ? 'Dispatch Team' : booking.customer_name,
          email_type: emailType,
          template_type: isAdminEmail ? 'admin_dispatch' : 'customer_' + emailType,
          subject: emailSubject,
          booking_reference: booking.reference,
          status: emailSent ? 'sent' : 'pending',
          provider: 'resend',
          provider_id: providerId,
          html_content: emailHTML,
          metadata: {
            booking_id: bookingId,
            sent_via: resendApiKey ? 'resend_api' : 'logged_only',
            timestamp: new Date().toISOString(),
          },
          error_message: emailError,
          sent_at: emailSent ? new Date().toISOString() : null,
        });
    } catch (logError: any) {
      console.error('Failed to log email:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        message: emailSent 
          ? `${emailType} email sent successfully to ${recipientEmail}` 
          : `Email logged for ${recipientEmail} (${emailError || 'pending send'})`,
        booking: {
          id: booking.id,
          reference: booking.reference,
        },
        recipient: recipientEmail,
        providerId,
        error: emailError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-booking-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});