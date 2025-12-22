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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getEmailSubject = (emailType: string, reference: string): string => {
  const subjects: Record<string, string> = {
    confirmation: `Your Booking is Confirmed! - ${reference}`,
    payment_link: `Complete Your Payment - ${reference}`,
    reminder: `Reminder: Your Transfer is Tomorrow - ${reference}`,
    completion: `Thank You for Traveling with Us - ${reference}`,
    cancellation: `Booking Cancelled - ${reference}`,
    admin_notification: `NEW BOOKING ALERT - ${reference} - Action Required`,
  };
  return subjects[emailType] || `Booking Update - ${reference}`;
};

const generatePaymentLinkEmailHTML = (booking: any, paymentUrl: string): string => {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Complete Your Payment</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;line-height:1.6"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.15)"><tr><td style="background:linear-gradient(135deg,#0ea5e9,#0284c7,#0369a1);padding:50px 40px;text-align:center"><h1 style="color:#fff;margin:0 0 8px;font-size:32px;font-weight:700">Dominican Transfers</h1><p style="color:rgba(255,255,255,0.9);margin:0;font-size:16px">Premium Transfer Services</p></td></tr><tr><td style="padding:40px 40px 30px;text-align:center"><h2 style="color:#0f172a;margin:0 0 12px;font-size:28px;font-weight:600">Complete Your Payment</h2><p style="color:#64748b;margin:0;font-size:16px">Your transfer booking is almost complete! Click below to finalize your reservation.</p></td></tr><tr><td style="padding:0 40px 30px"><div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:30px;text-align:center"><p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px">Booking Reference</p><p style="color:#fff;margin:0;font-size:36px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace">${booking.reference}</p></div></td></tr><tr><td style="padding:0 40px 30px"><p style="color:#0f172a;margin:0 0 20px;font-size:18px;font-weight:600">Trip Details</p><div style="background:#f8fafc;border-radius:16px;padding:24px;border:1px solid #e2e8f0"><div style="text-align:center;padding-bottom:20px;border-bottom:2px dashed #e2e8f0;margin-bottom:20px"><p style="color:#0ea5e9;margin:0 0 4px;font-size:14px;font-weight:600;text-transform:uppercase">Pickup Date & Time</p><p style="color:#0f172a;margin:0;font-size:22px;font-weight:700">${formatDate(booking.pickup_datetime)}</p><p style="color:#0f172a;margin:4px 0 0;font-size:28px;font-weight:800">${formatTime(booking.pickup_datetime)}</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-bottom:16px"><p style="color:#64748b;margin:0 0 4px;font-size:11px;text-transform:uppercase;font-weight:600">From</p><p style="color:#0f172a;margin:0;font-size:16px;font-weight:600">${booking.pickup_location}</p></td></tr><tr><td><p style="color:#64748b;margin:0 0 4px;font-size:11px;text-transform:uppercase;font-weight:600">To</p><p style="color:#0f172a;margin:0;font-size:16px;font-weight:600">${booking.dropoff_location}</p></td></tr></table></div></td></tr><tr><td style="padding:0 40px 30px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0"><table width="100%"><tr><td style="color:#64748b;font-size:14px">Vehicle Type</td><td align="right" style="color:#0f172a;font-size:14px;font-weight:600">${booking.vehicle_type || 'Standard'}</td></tr></table></td></tr><tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0"><table width="100%"><tr><td style="color:#64748b;font-size:14px">Passengers</td><td align="right" style="color:#0f172a;font-size:14px;font-weight:600">${booking.passengers || 1}</td></tr></table></td></tr><tr><td style="padding:24px;background:linear-gradient(135deg,#0ea5e9,#0284c7)"><table width="100%"><tr><td style="color:rgba(255,255,255,0.9);font-size:18px;font-weight:600">Total Amount</td><td align="right" style="color:#fff;font-size:32px;font-weight:800">${formatCurrency(booking.total_price)}</td></tr></table></td></tr></table></td></tr><tr><td style="padding:0 40px 40px;text-align:center"><a href="${paymentUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;padding:18px 48px;border-radius:12px;font-size:18px;font-weight:700">PAY NOW - ${formatCurrency(booking.total_price)}</a><p style="color:#64748b;margin:16px 0 0;font-size:13px">Secure payment powered by Stripe</p></td></tr><tr><td style="padding:0 40px 40px"><div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px"><p style="color:#92400e;margin:0;font-size:14px;font-weight:500"><strong>Important:</strong> Please complete your payment within 24 hours to secure your booking.</p></div></td></tr><tr><td style="padding:30px 40px;background:#f8fafc;text-align:center"><p style="color:#64748b;margin:0 0 8px;font-size:14px">Need assistance?</p><p style="color:#0f172a;margin:0;font-size:14px"><a href="mailto:booking@dominicantransfers.com" style="color:#0ea5e9">booking@dominicantransfers.com</a></p><p style="color:#0f172a;margin:8px 0 0;font-size:14px"><a href="https://wa.me/18297606434" style="color:#0ea5e9">WhatsApp: +1 (829) 760-6434</a></p></td></tr></table></td></tr></table></body></html>`;
};

const generateCustomerEmailHTML = (booking: any, emailType: string, cancellationToken?: string, refundAmount?: number): string => {
  const isCancellation = emailType === 'cancellation';
  const headerGradient = isCancellation ? 'linear-gradient(135deg,#dc2626,#991b1b)' : 'linear-gradient(135deg,#0ea5e9,#0284c7,#0369a1)';
  const statusMessages: Record<string, string> = {
    confirmation: 'Your premium transfer has been confirmed. A professional driver will be assigned to your journey.',
    reminder: 'Your transfer is scheduled for tomorrow. Please be ready at the pickup location.',
    completion: 'Thank you for choosing Dominican Transfers. We hope you had an excellent journey.',
    cancellation: 'Your booking cancellation has been processed successfully.',
  };
  const cancellationUrl = cancellationToken ? `https://dominicantransfers.com/cancel-booking?token=${cancellationToken}` : '';
  const driverInstructions = !isCancellation && emailType === 'confirmation' ? `<tr><td style="padding:0 40px 30px"><div style="background:#f0f9ff;border-radius:16px;padding:30px;border:1px solid #bae6fd"><h3 style="color:#0369a1;margin:0 0 16px;font-size:18px;font-weight:700">How to Find Your Driver</h3><p style="color:#0c4a6e;margin:0 0 12px;font-size:15px">1. Your driver will arrive 10 minutes before pickup time</p><p style="color:#0c4a6e;margin:0 0 12px;font-size:15px">2. Look for driver with Dominican Transfers sign showing: ${booking.customer_name}</p><p style="color:#0c4a6e;margin:0;font-size:15px">3. Reference for verification: ${booking.reference}</p></div></td></tr>` : '';
  const cancelSection = cancellationUrl && !isCancellation ? `<tr><td style="padding:0 40px 30px"><div style="background:#fefce8;border-radius:12px;padding:24px;border:1px solid #fde047;text-align:center"><p style="color:#713f12;margin:0 0 4px;font-size:12px;text-transform:uppercase;font-weight:600">Need to Cancel?</p><p style="color:#854d0e;margin:0 0 16px;font-size:14px">Free cancellation up to 24 hours before pickup</p><a href="${cancellationUrl}" style="display:inline-block;padding:12px 32px;background:#fff;color:#ca8a04;border:2px solid #eab308;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">Request Cancellation</a></div></td></tr>` : '';
  const refundSection = isCancellation && refundAmount ? `<tr><td style="padding:0 40px 30px"><div style="background:#fef3c7;border-radius:16px;padding:30px;border:1px solid #fcd34d"><h3 style="color:#92400e;margin:0 0 16px;font-size:18px;font-weight:700;text-align:center">Refund Information</h3><div style="background:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px"><p style="color:#78350f;margin:0 0 8px;font-size:12px;text-transform:uppercase;font-weight:600">Refund Amount</p><p style="color:#92400e;margin:0;font-size:36px;font-weight:800">${formatCurrency(refundAmount)}</p></div><p style="color:#78350f;margin:0;font-size:14px;text-align:center">Refunds processed within 5-10 business days.</p></div></td></tr>` : '';
  const specialRequests = booking.special_requests ? `<tr><td style="padding:0 40px 30px"><div style="background:#fef3c7;border-radius:12px;padding:20px;border:1px solid #fcd34d"><p style="color:#92400e;margin:0 0 8px;font-size:11px;text-transform:uppercase;font-weight:700">Special Requests</p><p style="color:#78350f;margin:0;font-size:15px">${booking.special_requests}</p></div></td></tr>` : '';
  const flightInfo = booking.flight_number ? `<tr><td style="padding:0 40px 30px"><div style="background:#dbeafe;border-radius:12px;padding:20px;border:1px solid #93c5fd"><p style="color:#1e40af;margin:0 0 8px;font-size:11px;text-transform:uppercase;font-weight:700">Flight Information</p><p style="color:#1e3a8a;margin:0;font-size:20px;font-weight:700">${booking.flight_number}</p></div></td></tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking ${emailType.charAt(0).toUpperCase() + emailType.slice(1)}</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;line-height:1.6"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.15)"><tr><td style="background:${headerGradient};padding:50px 40px;text-align:center"><h1 style="color:#fff;margin:0 0 8px;font-size:32px;font-weight:700">Dominican Transfers</h1><p style="color:rgba(255,255,255,0.9);margin:0;font-size:16px">Premium Transfer Services</p></td></tr><tr><td style="padding:40px 40px 30px;text-align:center"><h2 style="color:#0f172a;margin:0 0 12px;font-size:28px;font-weight:600">Booking ${emailType.charAt(0).toUpperCase() + emailType.slice(1)}</h2><p style="color:#64748b;margin:0;font-size:16px">${statusMessages[emailType] || ''}</p></td></tr><tr><td style="padding:0 40px 30px"><div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:30px;text-align:center"><p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px">Booking Reference</p><p style="color:#fff;margin:0;font-size:36px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace">${booking.reference}</p></div></td></tr><tr><td style="padding:0 40px 30px"><p style="color:#0f172a;margin:0 0 20px;font-size:18px;font-weight:600">Trip Details</p><div style="background:#f8fafc;border-radius:16px;padding:24px;border:1px solid #e2e8f0"><div style="text-align:center;padding-bottom:20px;border-bottom:2px dashed #e2e8f0;margin-bottom:20px"><p style="color:#0ea5e9;margin:0 0 4px;font-size:14px;font-weight:600;text-transform:uppercase">Pickup Date & Time</p><p style="color:#0f172a;margin:0;font-size:22px;font-weight:700">${formatDate(booking.pickup_datetime)}</p><p style="color:#0f172a;margin:4px 0 0;font-size:28px;font-weight:800">${formatTime(booking.pickup_datetime)}</p></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-bottom:16px"><p style="color:#64748b;margin:0 0 4px;font-size:11px;text-transform:uppercase;font-weight:600">Pickup Location</p><p style="color:#0f172a;margin:0;font-size:16px;font-weight:600">${booking.pickup_location}</p></td></tr><tr><td><p style="color:#64748b;margin:0 0 4px;font-size:11px;text-transform:uppercase;font-weight:600">Dropoff Location</p><p style="color:#0f172a;margin:0;font-size:16px;font-weight:600">${booking.dropoff_location}</p></td></tr></table></div></td></tr><tr><td style="padding:0 40px 30px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="48%" style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0"><p style="color:#64748b;margin:0 0 6px;font-size:11px;text-transform:uppercase">Passengers</p><p style="color:#0f172a;margin:0;font-size:24px;font-weight:700">${booking.passengers || 1}</p></td><td width="4%"></td><td width="48%" style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0"><p style="color:#64748b;margin:0 0 6px;font-size:11px;text-transform:uppercase">Vehicle</p><p style="color:#0f172a;margin:0;font-size:24px;font-weight:700">${booking.vehicle_type || 'Standard'}</p></td></tr></table></td></tr>${specialRequests}${flightInfo}<tr><td style="padding:0 40px 30px"><div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:30px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><p style="color:#94a3b8;margin:0 0 8px;font-size:13px;text-transform:uppercase">Total Amount</p><p style="color:#fff;margin:0;font-size:42px;font-weight:800">${formatCurrency(booking.total_price)}</p></td><td style="text-align:right;vertical-align:bottom"><span style="display:inline-block;padding:10px 20px;background:${booking.payment_status === 'paid' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f59e0b,#d97706)'};color:#fff;border-radius:30px;font-size:14px;font-weight:600;text-transform:uppercase">${booking.payment_status === 'paid' ? 'Paid' : 'Pending'}</span></td></tr></table></div></td></tr><tr><td style="padding:0 40px 30px"><div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0"><p style="color:#64748b;margin:0 0 12px;font-size:11px;text-transform:uppercase;font-weight:600">Booked By</p><p style="color:#0f172a;margin:0 0 4px;font-size:18px;font-weight:600">${booking.customer_name}</p><p style="color:#64748b;margin:0 0 2px;font-size:14px">${booking.customer_email}</p><p style="color:#64748b;margin:0;font-size:14px">${booking.customer_phone || ''}</p></div></td></tr>${driverInstructions}${cancelSection}${refundSection}<tr><td style="padding:30px 40px;background:#f8fafc;text-align:center"><p style="color:#64748b;margin:0 0 8px;font-size:16px;font-weight:600">Need Assistance?</p><p style="color:#64748b;margin:0 0 20px;font-size:14px">Our support team is available 24/7</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="text-align:center"><a href="mailto:info@dominicantransfers.com" style="display:inline-block;padding:12px 24px;background:#fff;color:#059669;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;border:2px solid #10b981;margin-right:10px">Email Support</a><a href="tel:+18297606434" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">Call Us</a></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:40px;text-align:center"><p style="color:#f8fafc;margin:0 0 8px;font-size:18px;font-weight:600">Thank you for choosing Dominican Transfers</p><p style="color:#94a3b8;margin:0 0 20px;font-size:14px">Your journey, our priority</p><p style="color:#64748b;margin:0;font-size:12px">Dominican Transfers. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;
};

const generateAdminDispatchEmailHTML = (booking: any): string => {
  const specialRequests = booking.special_requests ? `<tr><td style="padding:0 40px 20px"><div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:12px;padding:20px"><p style="color:#78350f;margin:0 0 8px;font-size:11px;text-transform:uppercase;font-weight:700">Special Requests</p><p style="color:#451a03;margin:0;font-size:15px;font-weight:500">${booking.special_requests}</p></div></td></tr>` : '';
  const flightInfo = booking.flight_number ? `<tr><td style="padding:0 40px 20px"><div style="background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:12px;padding:20px"><p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:11px;text-transform:uppercase;font-weight:700">Flight Information</p><p style="color:#fff;margin:0;font-size:24px;font-weight:700">${booking.flight_number}</p></div></td></tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Booking Alert</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;line-height:1.6"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px"><tr><td align="center"><table width="650" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid #334155"><tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c,#991b1b);padding:30px 40px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:20px;margin-bottom:12px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase">New Booking Alert</span><h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">Dispatch Required</h1></td><td style="text-align:right;vertical-align:top"><p style="color:rgba(255,255,255,0.8);margin:0;font-size:12px">Received at</p><p style="color:#fff;margin:4px 0 0;font-size:16px;font-weight:600">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p></td></tr></table></td></tr><tr><td style="padding:30px 40px 20px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="60%"><p style="color:#94a3b8;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Booking Reference</p><p style="color:#f8fafc;margin:0;font-size:32px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:2px">${booking.reference}</p></td><td width="40%" style="text-align:right"><div style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:12px"><p style="color:#fff;margin:0;font-size:12px;text-transform:uppercase">Status</p><p style="color:#fff;margin:4px 0 0;font-size:18px;font-weight:700">${(booking.status || 'PENDING').toUpperCase()}</p></div></td></tr></table></td></tr><tr><td style="padding:0 40px 20px"><div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:16px;padding:24px;text-align:center"><p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600">Pickup Scheduled For</p><p style="color:#fff;margin:0;font-size:28px;font-weight:800">${formatDateTime(booking.pickup_datetime)}</p></div></td></tr><tr><td style="padding:0 40px 20px"><div style="background:#0f172a;border-radius:16px;padding:24px;border:1px solid #334155"><p style="color:#94a3b8;margin:0 0 16px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Route Information</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-bottom:20px"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Pickup</p><p style="color:#f8fafc;margin:0;font-size:18px;font-weight:600">${booking.pickup_location}</p></td></tr><tr><td><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Dropoff</p><p style="color:#f8fafc;margin:0;font-size:18px;font-weight:600">${booking.dropoff_location}</p></td></tr></table></div></td></tr><tr><td style="padding:0 40px 20px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="32%" style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #334155;text-align:center"><p style="color:#64748b;margin:0 0 8px;font-size:10px;text-transform:uppercase">Passengers</p><p style="color:#f8fafc;margin:0;font-size:32px;font-weight:800">${booking.passengers || 1}</p></td><td width="2%"></td><td width="32%" style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #334155;text-align:center"><p style="color:#64748b;margin:0 0 8px;font-size:10px;text-transform:uppercase">Vehicle</p><p style="color:#f8fafc;margin:0;font-size:18px;font-weight:700">${booking.vehicle_type || 'Standard'}</p></td><td width="2%"></td><td width="32%" style="background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:12px;padding:20px;text-align:center"><p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:10px;text-transform:uppercase">Amount</p><p style="color:#fff;margin:0;font-size:24px;font-weight:800">${formatCurrency(booking.total_price)}</p></td></tr></table></td></tr><tr><td style="padding:0 40px 20px"><div style="background:#0f172a;border-radius:16px;padding:24px;border:1px solid #334155"><p style="color:#94a3b8;margin:0 0 16px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Customer Information</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="33%"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Name</p><p style="color:#f8fafc;margin:0;font-size:16px;font-weight:600">${booking.customer_name}</p></td><td width="34%"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Email</p><p style="color:#0ea5e9;margin:0;font-size:14px">${booking.customer_email}</p></td><td width="33%"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Phone</p><p style="color:#f8fafc;margin:0;font-size:16px;font-weight:600">${booking.customer_phone || 'N/A'}</p></td></tr></table></div></td></tr>${specialRequests}${flightInfo}<tr><td style="padding:0 40px 30px"><div style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #334155"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Payment Status</p><span style="display:inline-block;padding:8px 16px;background:${booking.payment_status === 'paid' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f59e0b,#d97706)'};border-radius:20px;color:#fff;font-size:13px;font-weight:600;text-transform:uppercase">${booking.payment_status === 'paid' ? 'PAID' : 'PENDING'}</span></td><td width="50%"><p style="color:#64748b;margin:0 0 4px;font-size:10px;text-transform:uppercase">Booking Source</p><span style="display:inline-block;padding:8px 16px;background:#334155;border-radius:20px;color:#f8fafc;font-size:13px;font-weight:600;text-transform:uppercase">${booking.source || 'DIRECT'}</span></td></tr></table></div></td></tr><tr><td style="background:#0f172a;padding:30px 40px;text-align:center;border-top:1px solid #334155"><p style="color:#64748b;margin:0;font-size:12px">Dominican Transfers Dispatch System</p><p style="color:#475569;margin:8px 0 0;font-size:11px">This is an automated notification.</p></td></tr></table></td></tr></table></body></html>`;
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

    console.log('Email function invoked:', { hasResendKey: !!resendApiKey, fromEmail: resendFromEmail });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { bookingId, emailType, adminEmail, refundAmount, paymentUrl }: EmailRequest = await req.json();

    console.log('Email request:', { bookingId, emailType, hasPaymentUrl: !!paymentUrl });

    if (!bookingId || !emailType) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: bookingId, emailType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: booking, error: bookingError } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return new Response(JSON.stringify({ success: false, error: 'Booking not found', details: bookingError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isAdminEmail = emailType === 'admin_notification';
    const recipientEmail = isAdminEmail ? (adminEmail || 'info@dominicantransfers.com') : booking.customer_email;
    const emailSubject = getEmailSubject(emailType, booking.reference);

    let cancellationToken: string | null = null;
    if (!isAdminEmail && emailType === 'confirmation') {
      const { data: existingRequest } = await supabase.from('booking_cancellation_requests')
        .select('cancellation_token').eq('booking_id', bookingId).eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (existingRequest?.cancellation_token) cancellationToken = existingRequest.cancellation_token;
    }

    let emailHTML: string;
    if (isAdminEmail) {
      emailHTML = generateAdminDispatchEmailHTML(booking);
    } else if (emailType === 'payment_link' && (paymentUrl || booking.payment_url)) {
      const finalPaymentUrl = paymentUrl || booking.payment_url;
      console.log('Generating payment link email with URL:', finalPaymentUrl);
      emailHTML = generatePaymentLinkEmailHTML(booking, finalPaymentUrl);
    } else {
      emailHTML = generateCustomerEmailHTML(booking, emailType, cancellationToken || undefined, refundAmount);
    }

    let emailSent = false;
    let emailError: string | null = null;
    let providerId: string | null = null;

    if (resendApiKey) {
      try {
        console.log('Sending email via Resend to:', recipientEmail);
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
          body: JSON.stringify({ from: resendFromEmail, to: [recipientEmail], subject: emailSubject, html: emailHTML }),
        });
        const emailResult = await emailResponse.json();
        console.log('Resend API response:', emailResponse.status, emailResult);
        if (emailResponse.ok && emailResult.id) {
          emailSent = true;
          providerId = emailResult.id;
          console.log('Email sent successfully:', emailResult.id);
        } else {
          emailError = emailResult.message || emailResult.error?.message || 'Failed to send email';
          console.error('Resend API error:', emailResult);
        }
      } catch (sendError: any) {
        emailError = sendError.message || 'Unknown send error';
        console.error('Email send exception:', sendError);
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
      console.warn('RESEND_API_KEY not configured - email will be logged only');
    }

    try {
      await supabase.from('email_logs').insert({
        booking_id: bookingId, recipient_email: recipientEmail,
        recipient_name: isAdminEmail ? 'Dispatch Team' : booking.customer_name,
        email_type: emailType, template_type: isAdminEmail ? 'admin_dispatch' : 'customer_' + emailType,
        subject: emailSubject, booking_reference: booking.reference,
        status: emailSent ? 'sent' : 'pending', provider: 'resend', provider_id: providerId,
        html_content: emailHTML, metadata: { booking_id: bookingId, sent_via: resendApiKey ? 'resend_api' : 'logged_only', timestamp: new Date().toISOString() },
        error_message: emailError, sent_at: emailSent ? new Date().toISOString() : null,
      });
    } catch (logError: any) {
      console.error('Failed to log email:', logError);
    }

    return new Response(JSON.stringify({
      success: true, emailSent,
      message: emailSent ? `${emailType} email sent successfully to ${recipientEmail}` : `Email logged for ${recipientEmail} (${emailError || 'pending send'})`,
      booking: { id: booking.id, reference: booking.reference },
      recipient: recipientEmail, providerId, error: emailError,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error in send-booking-email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});