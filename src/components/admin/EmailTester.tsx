import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle, Loader, AlertCircle, Send } from 'lucide-react';

const EmailTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [configResult, setConfigResult] = useState<any>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('eacabrera1511@gmail.com');

  const testConfiguration = async () => {
    setTesting(true);
    setConfigResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-resend-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setConfigResult(result);
    } catch (error) {
      setConfigResult({
        status: 'error',
        message: 'Failed to test configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;

    setSendingTest(true);
    setTestEmailResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            bookingId: '00000000-0000-0000-0000-000000000000',
            emailType: 'admin_notification',
            adminEmail: testEmail,
          }),
        }
      );

      const result = await response.json();
      setTestEmailResult(result);
    } catch (error) {
      setTestEmailResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-8 h-8 text-sky-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email System Tester
          </h2>
        </div>

        <div className="space-y-6">
          {/* Configuration Test */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              1. Test Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Check if Resend API is configured correctly and can send emails.
            </p>

            <button
              onClick={testConfiguration}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Test Configuration
                </>
              )}
            </button>

            {configResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-start gap-3">
                  {configResult.status === 'ready' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : configResult.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {configResult.message}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {configResult.config && (
                        <>
                          <p>
                            ✓ API Key: {configResult.config.resend_configured ? 'Configured' : 'Missing'}
                          </p>
                          <p>
                            ✓ Key Format: {configResult.config.resend_key_format}
                          </p>
                          <p>
                            ✓ From Email: {configResult.config.from_email}
                          </p>
                        </>
                      )}
                      {configResult.testEmail && (
                        <>
                          {configResult.testEmail.success ? (
                            <p className="text-green-600 dark:text-green-400 mt-2">
                              ✓ Test email sent successfully! (ID: {configResult.testEmail.id})
                            </p>
                          ) : (
                            <p className="text-red-600 dark:text-red-400 mt-2">
                              ✗ Test email failed: {configResult.testEmail.error}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Email Test */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              2. Send Test Email
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Send a test notification email to a specific address.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={sendTestEmail}
                disabled={sendingTest || !testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingTest ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test
                  </>
                )}
              </button>
            </div>

            {testEmailResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-start gap-3">
                  {testEmailResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {testEmailResult.success ? 'Email Sent!' : 'Email Failed'}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testEmailResult.success ? (
                        <>
                          <p>✓ Sent to: {testEmailResult.recipient}</p>
                          {testEmailResult.providerId && (
                            <p>✓ Provider ID: {testEmailResult.providerId}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-red-600 dark:text-red-400">
                          Error: {testEmailResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Common Issues
                </h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li>
                    <strong>Domain not verified:</strong> Go to resend.com/domains and verify dominicantransfers.nl
                  </li>
                  <li>
                    <strong>Test mode restrictions:</strong> Resend test mode only sends to account owner email
                  </li>
                  <li>
                    <strong>DNS not propagated:</strong> Wait 24-48 hours after adding DNS records
                  </li>
                  <li>
                    <strong>Wrong API key:</strong> Make sure you're using the production API key
                  </li>
                </ul>
                <p className="mt-4 text-sm">
                  See <strong>EMAIL_TROUBLESHOOTING.md</strong> for detailed guide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTester;
