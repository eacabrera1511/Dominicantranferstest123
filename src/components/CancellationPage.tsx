import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingDetails {
  id: string;
  reference: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  customer_name: string;
  customer_email: string;
  total_price: number;
  status: string;
  passengers: number;
  vehicle_type: string;
}

export function CancellationPage() {
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyCancelled, setAlreadyCancelled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('Invalid cancellation link. Please check your email and try again.');
      setLoading(false);
      return;
    }

    loadBookingDetails(token);
  }, []);

  const loadBookingDetails = async (token: string) => {
    try {
      const { data: cancellationRequest, error: requestError } = await supabase
        .from('booking_cancellation_requests')
        .select('*, bookings(*)')
        .eq('cancellation_token', token)
        .maybeSingle();

      if (requestError || !cancellationRequest) {
        setError('Invalid or expired cancellation link.');
        setLoading(false);
        return;
      }

      if (cancellationRequest.status !== 'pending') {
        setAlreadyCancelled(true);
        setError(`This cancellation request has already been ${cancellationRequest.status}.`);
        setLoading(false);
        return;
      }

      const booking = cancellationRequest.bookings as unknown as BookingDetails;

      if (booking.status === 'cancelled') {
        setAlreadyCancelled(true);
        setError('This booking has already been cancelled.');
        setLoading(false);
        return;
      }

      setBookingDetails(booking);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading booking:', err);
      setError('Failed to load booking details. Please try again later.');
      setLoading(false);
    }
  };

  const handleCancellationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDetails) return;

    setSubmitting(true);
    setError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setError('Invalid cancellation token.');
        setSubmitting(false);
        return;
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        'request-cancellation',
        {
          body: {
            token,
            reason: cancellationReason,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting cancellation:', err);
      setError('Failed to submit cancellation request. Please contact support.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Cancellation Request Submitted
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Your cancellation request has been received and will be reviewed by our team within 24 hours.
            </p>
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-2">What happens next?</h2>
              <ul className="text-left text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 mt-1">•</span>
                  <span>Our team will review your request within 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 mt-1">•</span>
                  <span>You'll receive an email notification with the decision</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 mt-1">•</span>
                  <span>If approved, your refund will be processed within 5-7 business days</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
              Questions? Contact us at <a href="mailto:support@dominicantransfers.com" className="text-sky-500 hover:text-sky-600">support@dominicantransfers.com</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || alreadyCancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {alreadyCancelled ? 'Already Processed' : 'Unable to Process'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-2">Need help?</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                If you believe this is an error or need assistance, please contact our support team.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="mailto:support@dominicantransfers.com"
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Email Support
                </a>
                <a
                  href="tel:+18091234567"
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return null;
  }

  const pickupDate = new Date(bookingDetails.pickup_datetime);
  const now = new Date();
  const hoursUntilPickup = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithinCancellationWindow = hoursUntilPickup >= 24;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Cancel Your Booking</h1>
            <p className="text-sky-100">Review your booking details and submit a cancellation request</p>
          </div>

          <div className="p-8">
            {!isWithinCancellationWindow && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Late Cancellation Notice
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Your pickup is within 24 hours. Cancellation fees may apply. Our team will review your request and inform you of any applicable charges.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Booking Details</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Reference</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{bookingDetails.reference}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Passenger</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{bookingDetails.customer_name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Pickup Date & Time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {pickupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {' at '}
                      {pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-slate-600 dark:text-slate-400 mb-2">Route</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400 font-bold text-sm">A</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 dark:text-slate-400">From</div>
                          <div className="font-semibold text-slate-900 dark:text-white">{bookingDetails.pickup_location}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">B</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 dark:text-slate-400">To</div>
                          <div className="font-semibold text-slate-900 dark:text-white">{bookingDetails.dropoff_location}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Passengers</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{bookingDetails.passengers}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Vehicle Type</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{bookingDetails.vehicle_type}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-600 dark:text-slate-400 text-lg">Total Amount</span>
                    <span className="font-bold text-2xl text-slate-900 dark:text-white">
                      ${bookingDetails.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCancellationSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Reason for Cancellation <span className="text-slate-400">(Optional)</span>
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    placeholder="Help us improve by telling us why you're cancelling..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Cancellation Request'
                    )}
                  </button>
                </div>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  By submitting this request, you acknowledge that cancellation is subject to our terms and conditions.
                  {isWithinCancellationWindow && ' Free cancellation applies as your pickup is more than 24 hours away.'}
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Need help? <a href="mailto:support@dominicantransfers.com" className="text-sky-500 hover:text-sky-600 font-semibold">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
