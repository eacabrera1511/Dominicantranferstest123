import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Key, CheckCircle, XCircle, Clock, ExternalLink, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface APIIntegration {
  id: string;
  integration_name: string;
  display_name: string;
  description: string;
  api_key: string | null;
  api_secret: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  configuration: {
    required_fields?: string[];
    additional_fields?: string[];
    endpoints?: Record<string, string>;
    endpoint_url?: string;
    docs_url?: string;
  };
  last_tested_at: string | null;
  test_status: 'not_tested' | 'success' | 'failed';
  test_error: string | null;
  updated_at: string;
}

export default function AdminAPIIntegrations() {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .order('display_name');

    if (error) {
      console.error('Error loading integrations:', error);
    } else {
      setIntegrations(data || []);
    }
    setLoading(false);
  }

  function handleEdit(integration: APIIntegration) {
    setEditingId(integration.id);
    setFormData({
      api_key: integration.api_key || '',
      api_secret: integration.api_secret || '',
      endpoint_url: integration.endpoint_url || integration.configuration.endpoint_url || '',
      is_active: integration.is_active,
      ...(integration.configuration.additional_fields?.includes('phone_number') && {
        phone_number: integration.configuration.phone_number || ''
      })
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({});
    setSaveMessage(null);
  }

  async function handleSave(integration: APIIntegration) {
    setSaveMessage(null);

    const updateData: any = {
      api_key: formData.api_key || null,
      api_secret: formData.api_secret || null,
      endpoint_url: formData.endpoint_url || null,
      is_active: formData.is_active,
      updated_at: new Date().toISOString()
    };

    if (formData.phone_number) {
      updateData.configuration = {
        ...integration.configuration,
        phone_number: formData.phone_number
      };
    }

    const { error } = await supabase
      .from('api_integrations')
      .update(updateData)
      .eq('id', integration.id);

    if (error) {
      setSaveMessage({ id: integration.id, message: 'Failed to save', type: 'error' });
      console.error('Error saving integration:', error);
    } else {
      setSaveMessage({ id: integration.id, message: 'Saved successfully', type: 'success' });
      await loadIntegrations();
      setTimeout(() => {
        setEditingId(null);
        setFormData({});
        setSaveMessage(null);
      }, 1500);
    }
  }

  async function handleTest(integration: APIIntegration) {
    setTestingId(integration.id);
    setSaveMessage(null);

    const { data, error } = await supabase.functions.invoke('test-api-integration', {
      body: { integration_name: integration.integration_name }
    });

    if (error) {
      setSaveMessage({ id: integration.id, message: `Test failed: ${error.message}`, type: 'error' });
    } else if (data?.success) {
      setSaveMessage({ id: integration.id, message: 'Test successful!', type: 'success' });
      await loadIntegrations();
    } else {
      setSaveMessage({ id: integration.id, message: `Test failed: ${data?.error || 'Unknown error'}`, type: 'error' });
    }

    setTestingId(null);
  }

  function toggleShowKey(id: string) {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  }

  function maskKey(key: string | null) {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Integrations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure third-party API credentials for enhanced functionality
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Security Notice</p>
            <p>API keys are stored securely in the database. Never share your keys or commit them to version control.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {integrations.map((integration) => {
          const isEditing = editingId === integration.id;
          const isTesting = testingId === integration.id;
          const showKey = showKeys[integration.id];

          return (
            <div
              key={integration.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {integration.display_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {integration.description}
                    </p>
                    {integration.configuration.docs_url && (
                      <a
                        href={integration.configuration.docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        View Documentation
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(integration.test_status)}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEditing ? formData.is_active : integration.is_active}
                      onChange={(e) => {
                        if (isEditing) {
                          setFormData({ ...formData, is_active: e.target.checked });
                        }
                      }}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {integration.test_status === 'failed' && integration.test_error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">
                  <strong>Last Test Error:</strong> {integration.test_error}
                </div>
              )}

              {saveMessage?.id === integration.id && (
                <div className={`mb-4 p-3 rounded ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}>
                  {saveMessage.message}
                </div>
              )}

              <div className="space-y-4">
                {integration.configuration.required_fields?.includes('api_key') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key {!isEditing && integration.api_key && <span className="text-green-600">✓ Configured</span>}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.api_key || ''}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="Enter your API key"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                          {integration.api_key ? (showKey ? integration.api_key : maskKey(integration.api_key)) : 'Not configured'}
                        </code>
                        {integration.api_key && (
                          <button
                            onClick={() => toggleShowKey(integration.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {integration.configuration.required_fields?.includes('api_secret') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Secret {!isEditing && integration.api_secret && <span className="text-green-600">✓ Configured</span>}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.api_secret || ''}
                        onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                        placeholder="Enter your API secret"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                          {integration.api_secret ? (showKey ? integration.api_secret : maskKey(integration.api_secret)) : 'Not configured'}
                        </code>
                        {integration.api_secret && (
                          <button
                            onClick={() => toggleShowKey(integration.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {integration.configuration.additional_fields?.includes('phone_number') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number (From)
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                        {integration.configuration.phone_number || 'Not configured'}
                      </code>
                    )}
                  </div>
                )}

                {integration.last_tested_at && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last tested: {new Date(integration.last_tested_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(integration)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleTest(integration)}
                      disabled={!integration.api_key || isTesting}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => handleEdit(integration)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Configure
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}