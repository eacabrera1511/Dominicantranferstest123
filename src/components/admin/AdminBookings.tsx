import { useState, useEffect } from 'react';
import { Calendar, Search, X, MapPin, User, DollarSign, Clock, MessageSquare, Phone, Mail, Plane, Users, Briefcase, Navigation, CheckCircle2, AlertCircle, Clock3, TrendingUp, Edit2, Save, Plus, CreditCard, Send, Eye, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  passengers: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  source: 'chat' | 'web' | 'phone' | 'partner';
  special_requests?: string;
  created_at: string;
  vehicle_type?: string;
  details?: any;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
}

interface CancellationRequest {
  id: string;
  booking_id: string;
  cancellation_token: string;
  customer_email: string;
  customer_name: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  admin_notes: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  bookings: Booking;
}

interface VehicleType {
  id: string;
  name: string;
  description: string;
  passenger_capacity: number;
  minimum_fare: number;
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [viewMode, setViewMode] = useState<'bookings' | 'cancellations'>('bookings');
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationRequest | null>(null);
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewContent, setEmailPreviewContent] = useState<string | null>(null);
  const [emailPreviewLoading, setEmailPreviewLoading] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_datetime: '',
    passengers: 1,
    total_price: 0,
    vehicle_type: '',
    special_requests: '',
    source: 'phone' as const,
  });

  useEffect(() => {
    fetchBookings();
    fetchVehicleTypes();
    fetchCancellationRequests();

    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        fetchBookings();
      })
      .subscribe();

    const cancellationsSubscription = supabase
      .channel('cancellation_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_cancellation_requests'
      }, () => {
        fetchCancellationRequests();
      })
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      cancellationsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (newBooking.pickup_location && newBooking.dropoff_location && newBooking.vehicle_type && newBooking.pickup_datetime) {
      calculatePrice();
    }
  }, [newBooking.pickup_location, newBooking.dropoff_location, newBooking.vehicle_type, newBooking.pickup_datetime]);

  const fetchBookings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('admin_bookings_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    }

    if (data) {
      setBookings(data);
    }

    setLoading(false);
  };

  const fetchVehicleTypes = async () => {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('id, name, description, passenger_capacity, minimum_fare')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching vehicle types:', error);
    }

    if (data) {
      setVehicleTypes(data);
    }
  };

  const fetchCancellationRequests = async () => {
    const { data, error } = await supabase
      .from('booking_cancellation_requests')
      .select('*, bookings(*)')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching cancellation requests:', error);
    }

    if (data) {
      setCancellationRequests(data as unknown as CancellationRequest[]);
    }
  };

  const processCancellationRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    if (!selectedCancellation) return;

    setProcessingCancellation(true);

    try {
      const finalRefundAmount = decision === 'approved' ? (refundAmount || selectedCancellation.bookings.total_price) : null;

      const { error } = await supabase
        .from('booking_cancellation_requests')
        .update({
          status: decision,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
          refund_amount: finalRefundAmount,
          refund_status: decision === 'approved' ? 'pending' : null,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error processing cancellation:', error);
        alert('Failed to process cancellation request');
        return;
      }

      if (decision === 'approved') {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: selectedCancellation.reason || 'Customer requested cancellation',
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'admin',
          })
          .eq('id', selectedCancellation.booking_id);

        try {
          const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`;
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          };

          await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              bookingId: selectedCancellation.booking_id,
              emailType: 'cancellation',
              refundAmount: finalRefundAmount,
            }),
          });
        } catch (emailError) {
          console.error('Error sending cancellation email:', emailError);
        }
      }

      await fetchCancellationRequests();
      await fetchBookings();

      setSelectedCancellation(null);
      setAdminNotes('');
      setRefundAmount(0);

      alert(`Cancellation request ${decision}!`);
    } catch (err) {
      console.error('Error processing cancellation:', err);
      alert('Failed to process cancellation request');
    } finally {
      setProcessingCancellation(false);
    }
  };

  const calculatePrice = async () => {
    setCalculatingPrice(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            from_address: newBooking.pickup_location,
            to_address: newBooking.dropoff_location,
            vehicle_type: newBooking.vehicle_type.toLowerCase(),
            pickup_datetime: newBooking.pickup_datetime,
            passenger_count: newBooking.passengers,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.quote) {
        setNewBooking(prev => ({
          ...prev,
          total_price: data.quote.total_price,
        }));
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      fetchBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    }
  };

  const saveBookingEdits = async () => {
    if (!editedBooking) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        customer_name: editedBooking.customer_name,
        customer_email: editedBooking.customer_email,
        customer_phone: editedBooking.customer_phone,
        pickup_location: editedBooking.pickup_location,
        dropoff_location: editedBooking.dropoff_location,
        pickup_datetime: editedBooking.pickup_datetime,
        passengers: editedBooking.passengers,
        total_price: editedBooking.total_price,
        vehicle_type: editedBooking.vehicle_type,
        special_requests: editedBooking.special_requests,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editedBooking.id);

    if (!error) {
      setIsEditing(false);
      setSelectedBooking(editedBooking);
      fetchBookings();
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (!error) {
      setSelectedBooking(null);
      fetchBookings();
      alert('Booking deleted successfully');
    } else {
      alert('Failed to delete booking: ' + error.message);
    }
  };

  const createBooking = async () => {
    setCreatingBooking(true);
    const reference = `TRF-${Date.now().toString().slice(-8)}`;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          reference,
          customer_name: newBooking.customer_name,
          customer_email: newBooking.customer_email,
          customer_phone: newBooking.customer_phone,
          pickup_location: newBooking.pickup_location,
          dropoff_location: newBooking.dropoff_location,
          pickup_datetime: newBooking.pickup_datetime,
          passengers: newBooking.passengers,
          total_price: newBooking.total_price,
          vehicle_type: newBooking.vehicle_type,
          special_requests: newBooking.special_requests,
          source: newBooking.source,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        alert(`Failed to create booking: ${error.message}`);
        setCreatingBooking(false);
        return;
      }

      if (data) {
        await sendBookingConfirmationEmail(data);

        setShowCreateForm(false);
        setNewBooking({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          pickup_location: '',
          dropoff_location: '',
          pickup_datetime: '',
          passengers: 1,
          total_price: 0,
          vehicle_type: '',
          special_requests: '',
          source: 'phone',
        });
        fetchBookings();
        setSelectedBooking(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred while creating the booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const sendBookingConfirmationEmail = async (booking: any) => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };

    try {
      await Promise.all([
        fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bookingId: booking.id,
            emailType: 'confirmation',
          }),
        }),
        fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bookingId: booking.id,
            emailType: 'admin_notification',
          }),
        }),
      ]);
    } catch (error) {
      console.error('Error sending booking emails:', error);
    }
  };

  const resendConfirmationEmail = async (booking: Booking) => {
    setSendingEmail(true);
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    };

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingId: booking.id,
          emailType: 'confirmation',
        }),
      });

      const result = await response.json();

      if (result.success && result.emailSent) {
        alert(`Confirmation email sent successfully to ${booking.customer_email}`);
      } else if (result.success && !result.emailSent) {
        alert(`Email logged but not sent: ${result.error || 'Email provider not configured'}`);
      } else {
        alert(`Failed to send email: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      alert('Failed to send confirmation email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const previewEmail = async (booking: Booking) => {
    setEmailPreviewLoading(true);
    setShowEmailPreview(true);
    setEmailPreviewContent(null);

    try {
      const { data: emailLog } = await supabase
        .from('email_logs')
        .select('html_content, subject, recipient_email, status, sent_at, created_at')
        .eq('booking_id', booking.id)
        .eq('email_type', 'confirmation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (emailLog?.html_content) {
        setEmailPreviewContent(emailLog.html_content);
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              bookingId: booking.id,
              emailType: 'confirmation',
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          const { data: newEmailLog } = await supabase
            .from('email_logs')
            .select('html_content')
            .eq('booking_id', booking.id)
            .eq('email_type', 'confirmation')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (newEmailLog?.html_content) {
            setEmailPreviewContent(newEmailLog.html_content);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching email preview:', error);
    } finally {
      setEmailPreviewLoading(false);
    }
  };

  const copyEmailHtml = () => {
    if (emailPreviewContent) {
      navigator.clipboard.writeText(emailPreviewContent);
      alert('Email HTML copied to clipboard! You can paste this into your email client.');
    }
  };

  const openEmailInNewTab = () => {
    if (emailPreviewContent) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(emailPreviewContent);
        newWindow.document.close();
      }
    }
  };

  const chargePayment = async (booking: Booking) => {
    setProcessingPayment(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: booking.total_price,
            currency: 'usd',
            productName: `Transfer: ${booking.pickup_location} to ${booking.dropoff_location}`,
            productDescription: `Booking Ref: ${booking.reference}`,
            customerEmail: booking.customer_email,
            customerName: booking.customer_name,
            successUrl: `${window.location.origin}?payment=success&booking=${booking.id}`,
            cancelUrl: `${window.location.origin}?payment=cancelled&booking=${booking.id}`,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to create checkout session:', data.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const startEdit = () => {
    setEditedBooking(selectedBooking);
    setIsEditing(true);
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || b.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_price, 0),
    chatBookings: bookings.filter(b => b.source === 'chat').length,
  };

  const statusColors = {
    pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertCircle },
    confirmed: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: CheckCircle2 },
    in_progress: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: TrendingUp },
    completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle2 },
    cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: X },
  };

  const sourceConfig = {
    chat: { icon: MessageSquare, label: 'Chat', color: 'text-teal-400' },
    web: { icon: Calendar, label: 'Web', color: 'text-blue-400' },
    phone: { icon: Phone, label: 'Phone', color: 'text-green-400' },
    partner: { icon: MapPin, label: 'Partner', color: 'text-purple-400' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCancellations = cancellationRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Bookings Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage bookings and cancellation requests</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all shadow-lg hover:shadow-red-500/20 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 md:w-4 md:h-4" />
          <span>Create Booking</span>
        </button>
      </div>

      <div className="flex gap-1 md:gap-2 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setViewMode('bookings')}
          className={`px-3 md:px-6 py-2 md:py-3 font-semibold text-xs md:text-sm transition-all relative whitespace-nowrap ${
            viewMode === 'bookings'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Bookings
          {viewMode === 'bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600" />
          )}
        </button>
        <button
          onClick={() => setViewMode('cancellations')}
          className={`px-3 md:px-6 py-2 md:py-3 font-semibold text-xs md:text-sm transition-all relative whitespace-nowrap ${
            viewMode === 'cancellations'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="hidden sm:inline">Cancellation Requests</span>
          <span className="sm:hidden">Cancellations</span>
          {pendingCancellations > 0 && (
            <span className="ml-1 md:ml-2 inline-flex items-center justify-center px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingCancellations}
            </span>
          )}
          {viewMode === 'cancellations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600" />
          )}
        </button>
      </div>

      {viewMode === 'bookings' ? (
        <>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">Total</p>
          <p className="text-lg md:text-xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">Pending</p>
          <p className="text-lg md:text-xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">Confirmed</p>
          <p className="text-lg md:text-xl font-bold text-blue-400">{stats.confirmed}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">In Progress</p>
          <p className="text-lg md:text-xl font-bold text-cyan-400">{stats.inProgress}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">Completed</p>
          <p className="text-lg md:text-xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 md:p-4">
          <p className="text-gray-400 text-xs mb-1">AI Chat</p>
          <p className="text-lg md:text-xl font-bold text-teal-400">{stats.chatBookings}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="all">All Sources</option>
              <option value="chat">AI Chat</option>
              <option value="web">Website</option>
              <option value="phone">Phone</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filteredBookings.map((booking) => {
            const statusConfig = statusColors[booking.status] || statusColors.pending;
            const StatusIcon = statusConfig.icon;
            const sourceConfigItem = sourceConfig[booking.source] || sourceConfig.web;
            const SourceIcon = sourceConfigItem.icon;

            return (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold text-sm md:text-base">{booking.reference}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${sourceConfigItem.color} bg-white/5`}>
                        <SourceIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{sourceConfigItem.label}</span>
                      </span>
                    </div>
                    <p className="text-white font-medium text-base md:text-lg mb-1">{booking.customer_name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(booking.pickup_datetime).toLocaleDateString('en', { month: 'short', day: 'numeric' })} at {new Date(booking.pickup_datetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${booking.total_price}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{booking.status?.replace('_', ' ') || 'pending'}</span>
                    </span>
                    <span className={`text-xs font-medium ${booking.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                      {booking.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No bookings found</p>
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 md:p-4 z-[100]">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-white">{selectedBooking.reference}</h2>
                    {(() => {
                      const statusConfig = statusColors[selectedBooking.status] || statusColors.pending;
                      const StatusIcon = statusConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                          <StatusIcon className="w-4 h-4" />
                          {selectedBooking.status?.replace('_', ' ') || 'pending'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {(() => {
                      const sourceConfigItem = sourceConfig[selectedBooking.source] || sourceConfig.web;
                      const SourceIcon = sourceConfigItem.icon;
                      return (
                        <>
                          <SourceIcon className="w-4 h-4" />
                          <span>Booked via {sourceConfigItem.label}</span>
                          <span>•</span>
                          <span>{new Date(selectedBooking.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => previewEmail(selectedBooking)}
                        className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-300 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                      <button
                        onClick={() => resendConfirmationEmail(selectedBooking)}
                        disabled={sendingEmail}
                        className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{sendingEmail ? 'Sending...' : 'Resend'}</span>
                      </button>
                    </>
                  )}
                  {!isEditing && selectedBooking.payment_status !== 'paid' && (
                    <button
                      onClick={() => chargePayment(selectedBooking)}
                      disabled={processingPayment}
                      className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">{processingPayment ? 'Processing...' : 'Charge'}</span>
                    </button>
                  )}
                  {!isEditing ? (
                    <>
                      <button
                        onClick={startEdit}
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 transition-all flex-shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => deleteBooking(selectedBooking.id)}
                        className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all flex-shrink-0"
                        title="Delete Booking"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={saveBookingEdits}
                      className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 transition-all flex-shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      setIsEditing(false);
                      setEditedBooking(null);
                    }}
                    className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-blue-400 font-medium">Customer</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold text-lg mb-1 truncate">{selectedBooking.customer_name}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{selectedBooking.customer_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{selectedBooking.customer_phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-green-400 font-medium">Payment</p>
                        </div>
                      </div>
                      <p className="text-white font-bold text-2xl mb-1">${selectedBooking.total_price}</p>
                      <p className={`text-sm font-medium ${selectedBooking.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                        {selectedBooking.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-purple-400 font-medium">Service Details</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Vehicle:</span>
                          <span className="text-white font-medium">{selectedBooking.vehicle_type || 'Standard'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Passengers:</span>
                          <span className="text-white font-medium">{selectedBooking.passengers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-white font-semibold text-lg mb-4">Edit Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={editedBooking?.customer_name || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, customer_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Email</label>
                      <input
                        type="email"
                        value={editedBooking?.customer_email || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, customer_email: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Phone</label>
                      <input
                        type="tel"
                        value={editedBooking?.customer_phone || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, customer_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Total Price</label>
                      <input
                        type="number"
                        value={editedBooking?.total_price || 0}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, total_price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Pickup Location</label>
                      <input
                        type="text"
                        value={editedBooking?.pickup_location || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, pickup_location: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Dropoff Location</label>
                      <input
                        type="text"
                        value={editedBooking?.dropoff_location || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, dropoff_location: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Pickup Date & Time</label>
                      <input
                        type="datetime-local"
                        value={editedBooking?.pickup_datetime.slice(0, 16) || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, pickup_datetime: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Passengers</label>
                      <input
                        type="number"
                        min="1"
                        value={editedBooking?.passengers || 1}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, passengers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Vehicle Type</label>
                      <input
                        type="text"
                        value={editedBooking?.vehicle_type || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, vehicle_type: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-2">Special Requests</label>
                      <textarea
                        value={editedBooking?.special_requests || ''}
                        onChange={(e) => setEditedBooking({ ...editedBooking!, special_requests: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Navigation className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-semibold text-lg">Trip Route</h3>
                  </div>
                <div className="space-y-4">
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">Pickup Location</p>
                      <p className="text-white font-medium text-base">{selectedBooking.pickup_location}</p>
                    </div>
                  </div>

                  <div className="pl-3 border-l-2 border-dashed border-white/20 ml-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium text-white">
                        {new Date(selectedBooking.pickup_datetime).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>at</span>
                      <span className="font-medium text-white">
                        {new Date(selectedBooking.pickup_datetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {selectedBooking.details?.flightNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                        <Plane className="w-4 h-4" />
                        <span>Flight:</span>
                        <span className="font-medium text-white">{selectedBooking.details.flightNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">Dropoff Location</p>
                      <p className="text-white font-medium text-base">{selectedBooking.dropoff_location}</p>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {!isEditing && selectedBooking.special_requests && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-400 font-semibold text-sm mb-1">Special Requests</p>
                      <p className="text-white text-sm leading-relaxed">{selectedBooking.special_requests}</p>
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5">
                  <h3 className="text-white font-semibold text-base md:text-lg mb-3 md:mb-4">Update Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(['pending', 'confirmed', 'in_progress', 'completed'] as const).map(status => {
                      const StatusIcon = statusColors[status].icon;
                      return (
                        <button
                          key={status}
                          onClick={() => updateBookingStatus(selectedBooking.id, status)}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-medium capitalize transition-all border ${
                            selectedBooking.status === status
                              ? `${statusColors[status].bg} ${statusColors[status].border} ${statusColors[status].text}`
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <StatusIcon className="w-4 h-4 md:w-4 md:h-4" />
                          <span className="text-[10px] md:text-sm leading-tight">{status.replace('_', ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 md:p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Cancellation Requests</h2>

            {cancellationRequests.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No cancellation requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cancellationRequests.map((request) => {
                  const statusColors = {
                    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
                    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
                  };

                  return (
                    <div
                      key={request.id}
                      onClick={() => {
                        setSelectedCancellation(request);
                        setRefundAmount(request.bookings.total_price);
                        setAdminNotes('');
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold">{request.bookings.reference}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[request.status]}`}>
                              {request.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-300">{request.customer_name}</p>
                            <p className="text-gray-400">{request.customer_email}</p>
                            <p className="text-gray-500 text-xs">
                              Requested: {new Date(request.requested_at).toLocaleString()}
                            </p>
                            {request.reason && (
                              <p className="text-gray-400 mt-2">
                                <span className="text-gray-500">Reason:</span> {request.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">${request.bookings.total_price.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{request.bookings.vehicle_type}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCancellation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Process Cancellation Request</h2>
                  <p className="text-gray-400 text-sm mt-1">Booking: {selectedCancellation.bookings.reference}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCancellation(null);
                    setAdminNotes('');
                    setRefundAmount(0);
                  }}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-semibold text-lg mb-4">Booking Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer</span>
                    <span className="text-white font-semibold">{selectedCancellation.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{selectedCancellation.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pickup Date</span>
                    <span className="text-white">
                      {new Date(selectedCancellation.bookings.pickup_datetime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route</span>
                    <span className="text-white text-right">
                      {selectedCancellation.bookings.pickup_location} → {selectedCancellation.bookings.dropoff_location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vehicle</span>
                    <span className="text-white">{selectedCancellation.bookings.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Price</span>
                    <span className="text-white font-bold text-lg">
                      ${selectedCancellation.bookings.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCancellation.reason && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <h3 className="text-amber-400 font-semibold mb-2">Cancellation Reason</h3>
                  <p className="text-gray-300">{selectedCancellation.reason}</p>
                </div>
              )}

              {selectedCancellation.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Refund Amount (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      placeholder="Add internal notes about this cancellation..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <button
                      onClick={() => processCancellationRequest(selectedCancellation.id, 'approved')}
                      disabled={processingCancellation}
                      className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingCancellation ? (
                        <>
                          <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs md:text-base">Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="text-xs md:text-base">Approve & Refund</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => processCancellationRequest(selectedCancellation.id, 'rejected')}
                      disabled={processingCancellation}
                      className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingCancellation ? (
                        <>
                          <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs md:text-base">Processing...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="text-xs md:text-base">Reject Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {selectedCancellation.status !== 'pending' && (
                <div className={`border rounded-xl p-4 ${
                  selectedCancellation.status === 'approved'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    selectedCancellation.status === 'approved' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Request {selectedCancellation.status === 'approved' ? 'Approved' : 'Rejected'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Processed: {selectedCancellation.processed_at ? new Date(selectedCancellation.processed_at).toLocaleString() : 'N/A'}
                  </p>
                  {selectedCancellation.admin_notes && (
                    <p className="text-gray-300 text-sm mt-2">
                      <span className="text-gray-400">Notes:</span> {selectedCancellation.admin_notes}
                    </p>
                  )}
                  {selectedCancellation.refund_amount && (
                    <p className="text-gray-300 text-sm mt-2">
                      <span className="text-gray-400">Refund Amount:</span> ${selectedCancellation.refund_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 md:p-4 z-[100]">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Create New Booking</h2>
                  <p className="text-gray-400 text-sm mt-1">Enter customer and trip details</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-white font-semibold text-lg mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Name *</label>
                      <input
                        type="text"
                        value={newBooking.customer_name}
                        onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Email *</label>
                      <input
                        type="email"
                        value={newBooking.customer_email}
                        onChange={(e) => setNewBooking({ ...newBooking, customer_email: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Customer Phone *</label>
                      <input
                        type="tel"
                        value={newBooking.customer_phone}
                        onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Booking Source</label>
                      <select
                        value={newBooking.source}
                        onChange={(e) => setNewBooking({ ...newBooking, source: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      >
                        <option value="phone">Phone</option>
                        <option value="web">Web</option>
                        <option value="partner">Partner</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-white font-semibold text-lg mb-4">Trip Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Pickup Location *</label>
                      <input
                        type="text"
                        value={newBooking.pickup_location}
                        onChange={(e) => setNewBooking({ ...newBooking, pickup_location: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="Punta Cana Airport"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Dropoff Location *</label>
                      <input
                        type="text"
                        value={newBooking.dropoff_location}
                        onChange={(e) => setNewBooking({ ...newBooking, dropoff_location: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="Hotel Bavaro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Pickup Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={newBooking.pickup_datetime}
                        onChange={(e) => setNewBooking({ ...newBooking, pickup_datetime: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Passengers *</label>
                      <input
                        type="number"
                        min="1"
                        value={newBooking.passengers}
                        onChange={(e) => setNewBooking({ ...newBooking, passengers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Vehicle Type *</label>
                      <select
                        value={newBooking.vehicle_type}
                        onChange={(e) => setNewBooking({ ...newBooking, vehicle_type: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypes.map((vt) => (
                          <option key={vt.id} value={vt.name}>
                            {vt.name} (up to {vt.passenger_capacity} passengers)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Total Price (USD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newBooking.total_price}
                          readOnly
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                        {calculatingPrice && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Price calculated automatically from CRM</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-2">Special Requests</label>
                      <textarea
                        value={newBooking.special_requests}
                        onChange={(e) => setNewBooking({ ...newBooking, special_requests: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="Any special requirements..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={createBooking}
                    disabled={
                      creatingBooking ||
                      calculatingPrice ||
                      !newBooking.customer_name.trim() ||
                      !newBooking.customer_email.trim() ||
                      !newBooking.customer_phone.trim() ||
                      !newBooking.pickup_location.trim() ||
                      !newBooking.dropoff_location.trim() ||
                      !newBooking.pickup_datetime ||
                      !newBooking.vehicle_type
                    }
                    className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingBooking ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs md:text-base">Creating...</span>
                      </>
                    ) : calculatingPrice ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs md:text-base">Calculating...</span>
                      </>
                    ) : (
                      <span className="text-xs md:text-base">Create Booking</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creatingBooking}
                    className="px-4 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1526] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white">Email Preview</h3>
                <p className="text-sm text-gray-400">Preview the confirmation email before sending</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyEmailHtml}
                  disabled={!emailPreviewContent}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy HTML
                </button>
                <button
                  onClick={openEmailInNewTab}
                  disabled={!emailPreviewContent}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100">
              {emailPreviewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading email preview...</p>
                  </div>
                </div>
              ) : emailPreviewContent ? (
                <iframe
                  srcDoc={emailPreviewContent}
                  className="w-full h-full min-h-[500px]"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center text-gray-600">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No email content available</p>
                    <p className="text-sm mt-2">Click "Resend" to generate an email</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0f1a]">
              <p className="text-xs text-gray-500 text-center">
                You can copy the HTML and paste it into your email client, or open in a new tab to print/save as PDF.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
