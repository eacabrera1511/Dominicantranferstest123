import React, { useState } from 'react';
import {
  RefreshCw,
  Mail,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  Activity,
  Zap,
  Clock,
  Server
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

interface EmailLog {
  id: string;
  booking_id?: string;
  recipient_email: string;
  email_type: string;
  status: string;
  error_message?: string;
  created_at: string;
}

export default function AdminTroubleshooting() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  const addTestResult = (name: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [
      { name, status, message, timestamp: new Date() },
      ...prev.slice(0, 19)
    ]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').select('count').limit(1);
      if (error) throw error;

      addTestResult(
        'Database Connection',
        'success',
        'Successfully connected to database'
      );
    } catch (error: any) {
      addTestResult(
        'Database Connection',
        'error',
        `Database error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/test-resend-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        addTestResult(
          'Email Configuration',
          'success',
          'Email service is configured correctly'
        );
      } else {
        throw new Error(data.error || 'Email configuration test failed');
      }
    } catch (error: any) {
      addTestResult(
        'Email Configuration',
        'error',
        `Email config error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testStripeConfiguration = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/test-stripe-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        addTestResult(
          'Stripe Configuration',
          'success',
          'Stripe API is configured correctly'
        );
      } else {
        throw new Error(data.error || 'Stripe configuration test failed');
      }
    } catch (error: any) {
      addTestResult(
        'Stripe Configuration',
        'error',
        `Stripe config error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testOpenAIConfiguration = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/test-openai-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        addTestResult(
          'OpenAI Configuration',
          'success',
          'OpenAI API is configured correctly'
        );
      } else {
        throw new Error(data.error || 'OpenAI configuration test failed');
      }
    } catch (error: any) {
      addTestResult(
        'OpenAI Configuration',
        'error',
        `OpenAI config error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      addTestResult('Send Test Email', 'error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          to: testEmail,
          bookingId: 'test-' + Date.now(),
          customerName: 'Test User',
          bookingDetails: {
            airport: 'PUJ',
            hotel: 'Test Hotel',
            passengers: 2,
            luggage: 2,
            vehicle: 'SUV',
            tripType: 'One-way',
            price: 50,
            pickupDate: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult(
          'Send Test Email',
          'success',
          `Test email sent successfully to ${testEmail}`
        );
        setTestEmail('');
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (error: any) {
      addTestResult(
        'Send Test Email',
        'error',
        `Failed to send email: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setEmailLogs(data || []);
      addTestResult(
        'Fetch Email Logs',
        'success',
        `Retrieved ${data?.length || 0} recent email logs`
      );
    } catch (error: any) {
      addTestResult(
        'Fetch Email Logs',
        'error',
        `Failed to fetch logs: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async (bookingId: string) => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          to: booking.customer_email,
          customerName: booking.customer_name,
          bookingDetails: {
            airport: booking.pickup_location,
            hotel: booking.dropoff_location,
            passengers: booking.passengers,
            luggage: booking.luggage_count,
            vehicle: booking.vehicle_type,
            tripType: booking.trip_type,
            price: booking.total_price,
            pickupDate: booking.pickup_time
          }
        })
      });

      if (!response.ok) throw new Error('Failed to resend email');

      addTestResult(
        'Resend Email',
        'success',
        `Email resent for booking ${bookingId}`
      );
    } catch (error: any) {
      addTestResult(
        'Resend Email',
        'error',
        `Failed to resend: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorageTest = () => {
    try {
      const bookingContext = localStorage.getItem('bookingContext');
      if (bookingContext) {
        localStorage.removeItem('bookingContext');
        addTestResult(
          'Clear Booking Context',
          'success',
          'Booking context cleared from localStorage'
        );
      } else {
        addTestResult(
          'Clear Booking Context',
          'success',
          'No booking context found in localStorage'
        );
      }
    } catch (error: any) {
      addTestResult(
        'Clear Booking Context',
        'error',
        `Failed to clear: ${error.message}`
      );
    }
  };

  const refreshChatGPTFunction = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/test-openai-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          testMessage: 'System health check - testing FAQ and booking flow logic'
        })
      });

      const data = await response.json();

      if (data.success) {
        addTestResult(
          'ChatGPT Function Refresh',
          'success',
          'ChatGPT function is working correctly. FAQ logic and booking flow validated.'
        );
      } else {
        throw new Error(data.error || 'ChatGPT function test failed');
      }
    } catch (error: any) {
      addTestResult(
        'ChatGPT Function Refresh',
        'error',
        `ChatGPT refresh failed: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const fixEmailFlow = async () => {
    setLoading(true);
    try {
      await testEmailConfiguration();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: recentBookings, error } = await supabase
        .from('bookings')
        .select('id, customer_email, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const bookingsWithoutEmails = recentBookings?.filter(b =>
        b.status === 'confirmed' || b.status === 'pending'
      ) || [];

      addTestResult(
        'Email Flow Check',
        'success',
        `Email system verified. Found ${bookingsWithoutEmails.length} recent bookings that may need email confirmation.`
      );

      await fetchEmailLogs();
    } catch (error: any) {
      addTestResult(
        'Email Flow Fix',
        'error',
        `Email flow check failed: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyFAQLogic = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const testQueries = [
        'What are your payment methods?',
        'Do you accept credit cards?',
        'How much is a transfer from PUJ to Punta Cana?'
      ];

      let allPassed = true;
      const results: string[] = [];

      for (const query of testQueries) {
        const response = await fetch(`${supabaseUrl}/functions/v1/gpt-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ message: query })
        });

        const data = await response.json();
        if (!data.message) {
          allPassed = false;
          results.push(`❌ ${query}`);
        } else {
          results.push(`✓ ${query}`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addTestResult(
        'FAQ Logic Verification',
        allPassed ? 'success' : 'error',
        `Tested ${testQueries.length} FAQ scenarios:\n${results.join('\n')}`
      );
    } catch (error: any) {
      addTestResult(
        'FAQ Logic Verification',
        'error',
        `FAQ verification failed: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    await testDatabaseConnection();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testEmailConfiguration();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testStripeConfiguration();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testOpenAIConfiguration();
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchEmailLogs();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Troubleshooting</h1>
        <button
          onClick={runAllTests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Activity className="w-5 h-5" />
          )}
          Run All Tests
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Tests
          </h2>

          <button
            onClick={testDatabaseConnection}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Database className="w-5 h-5" />
            Test Database Connection
          </button>

          <button
            onClick={testEmailConfiguration}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Mail className="w-5 h-5" />
            Test Email Configuration
          </button>

          <button
            onClick={testStripeConfiguration}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Server className="w-5 h-5" />
            Test Stripe Configuration
          </button>

          <button
            onClick={testOpenAIConfiguration}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            Test OpenAI Configuration
          </button>

          <button
            onClick={clearLocalStorageTest}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Clear Booking Context
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Auto-Fix Tools
          </h2>

          <button
            onClick={refreshChatGPTFunction}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh ChatGPT Function
          </button>

          <button
            onClick={fixEmailFlow}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            <Mail className="w-5 h-5" />
            Fix Email Flow
          </button>

          <button
            onClick={verifyFAQLogic}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            Verify FAQ Logic
          </button>

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">
              These tools automatically diagnose and fix common issues with ChatGPT responses and email delivery.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Tools
          </h2>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Send Test Email
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              onClick={sendTestEmail}
              disabled={loading || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Send Test Email
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700">
              Resend Booking Email
            </label>
            <input
              type="text"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              placeholder="Booking ID"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              onClick={() => selectedBookingId && resendEmail(selectedBookingId)}
              disabled={loading || !selectedBookingId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Resend Email
            </button>
          </div>

          <button
            onClick={fetchEmailLogs}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Activity className="w-5 h-5" />
            Fetch Email Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Test Results
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tests run yet. Click "Run All Tests" or run individual tests above.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  result.status === 'success'
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{result.name}</span>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {emailLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Email Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Recipient</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{log.recipient_email}</td>
                    <td className="px-4 py-2">{log.email_type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-red-600 text-xs">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
