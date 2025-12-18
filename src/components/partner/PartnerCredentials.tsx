import { useState, useEffect } from 'react';
import {
  Building2, CreditCard, Shield, Save, CheckCircle, Plus,
  Trash2, AlertCircle, Lock, FileText, Landmark, Euro,
  Globe, MapPin, X, Star
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface Credentials {
  id: string;
  partner_id: string;
  legal_business_name: string;
  vat_number: string;
  company_registration: string;
  tax_id: string;
  billing_address: string;
  billing_city: string;
  billing_postal_code: string;
  billing_country: string;
}

interface PayoutMethod {
  id: string;
  partner_id: string;
  payout_method: string;
  is_primary: boolean;
  bank_name: string;
  bank_country: string;
  account_holder_name: string;
  iban: string;
  swift_bic: string;
  account_number: string;
  routing_number: string;
  paypal_email: string;
  wise_email: string;
  currency: string;
  status: string;
  verified_at: string | null;
}

interface PartnerCredentialsProps {
  partner: Partner;
}

const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
];

const PAYOUT_METHODS = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Landmark },
  { id: 'paypal', name: 'PayPal', icon: CreditCard },
  { id: 'wise', name: 'Wise', icon: Globe },
];

export function PartnerCredentials({ partner }: PartnerCredentialsProps) {
  const [activeTab, setActiveTab] = useState<'legal' | 'payout'>('legal');
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [newPayoutMethod, setNewPayoutMethod] = useState<Partial<PayoutMethod>>({
    payout_method: 'bank_transfer',
    currency: 'EUR',
    is_primary: false
  });

  const [credentialsForm, setCredentialsForm] = useState({
    legal_business_name: '',
    vat_number: '',
    company_registration: '',
    tax_id: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: ''
  });

  useEffect(() => {
    fetchData();
  }, [partner.id]);

  const fetchData = async () => {
    setLoading(true);

    const [credentialsRes, payoutRes] = await Promise.all([
      supabase
        .from('partner_credentials')
        .select('*')
        .eq('partner_id', partner.id)
        .maybeSingle(),
      supabase
        .from('partner_payout_methods')
        .select('*')
        .eq('partner_id', partner.id)
        .order('is_primary', { ascending: false })
    ]);

    if (credentialsRes.data) {
      setCredentials(credentialsRes.data);
      setCredentialsForm({
        legal_business_name: credentialsRes.data.legal_business_name || '',
        vat_number: credentialsRes.data.vat_number || '',
        company_registration: credentialsRes.data.company_registration || '',
        tax_id: credentialsRes.data.tax_id || '',
        billing_address: credentialsRes.data.billing_address || '',
        billing_city: credentialsRes.data.billing_city || '',
        billing_postal_code: credentialsRes.data.billing_postal_code || '',
        billing_country: credentialsRes.data.billing_country || ''
      });
    }

    if (payoutRes.data) {
      setPayoutMethods(payoutRes.data);
    }

    setLoading(false);
  };

  const saveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    if (credentials) {
      await supabase
        .from('partner_credentials')
        .update({
          ...credentialsForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentials.id);
    } else {
      await supabase
        .from('partner_credentials')
        .insert({
          partner_id: partner.id,
          ...credentialsForm
        });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
    fetchData();
  };

  const addPayoutMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (payoutMethods.length === 0) {
      newPayoutMethod.is_primary = true;
    }

    await supabase
      .from('partner_payout_methods')
      .insert({
        partner_id: partner.id,
        ...newPayoutMethod
      });

    setShowAddPayout(false);
    setNewPayoutMethod({
      payout_method: 'bank_transfer',
      currency: 'EUR',
      is_primary: false
    });
    setSaving(false);
    fetchData();
  };

  const setPrimaryMethod = async (methodId: string) => {
    await supabase
      .from('partner_payout_methods')
      .update({ is_primary: true })
      .eq('id', methodId);

    fetchData();
  };

  const deletePayoutMethod = async (methodId: string) => {
    await supabase
      .from('partner_payout_methods')
      .delete()
      .eq('id', methodId);

    fetchData();
  };

  const maskIban = (iban: string) => {
    if (!iban) return '';
    const visible = iban.slice(-4);
    return `****${visible}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
            <Shield className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-7 h-7 text-blue-400" />
          Credentials & Financial Info
        </h1>
        <p className="text-gray-400 mt-1">Manage your business credentials and payout methods</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-medium">Your information is secure</p>
            <p className="text-amber-200/70 text-sm mt-1">
              All sensitive data is encrypted and stored securely. We never share your financial information with third parties.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('legal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'legal'
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Legal & Tax Info
        </button>
        <button
          onClick={() => setActiveTab('payout')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'payout'
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Payout Methods
        </button>
      </div>

      {activeTab === 'legal' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Legal Business Information
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Required for tax reporting and invoicing
            </p>
          </div>

          <form onSubmit={saveCredentials} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Legal Business Name
                </label>
                <input
                  type="text"
                  value={credentialsForm.legal_business_name}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, legal_business_name: e.target.value })}
                  placeholder="As registered with authorities"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={credentialsForm.vat_number}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, vat_number: e.target.value })}
                  placeholder="e.g., NL123456789B01"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Company Registration Number
                </label>
                <input
                  type="text"
                  value={credentialsForm.company_registration}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, company_registration: e.target.value })}
                  placeholder="Chamber of Commerce number"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={credentialsForm.tax_id}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, tax_id: e.target.value })}
                  placeholder="Tax identification number"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Billing Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={credentialsForm.billing_address}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, billing_address: e.target.value })}
                    placeholder="Street name and number"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={credentialsForm.billing_city}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, billing_city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={credentialsForm.billing_postal_code}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, billing_postal_code: e.target.value })}
                      placeholder="Postal code"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      value={credentialsForm.billing_country}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, billing_country: e.target.value })}
                      placeholder="Country"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {saved && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Changes saved successfully
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="ml-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Information
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'payout' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Payout Methods</h2>
              <p className="text-gray-400 text-sm mt-1">
                Add your bank account or payment service to receive payouts
              </p>
            </div>
            <button
              onClick={() => setShowAddPayout(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Method
            </button>
          </div>

          {payoutMethods.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No payout methods added</p>
              <p className="text-gray-500 text-sm">Add a bank account or payment service to receive your earnings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutMethods.map((method) => {
                const methodInfo = PAYOUT_METHODS.find(m => m.id === method.payout_method);
                const Icon = methodInfo?.icon || CreditCard;

                return (
                  <div
                    key={method.id}
                    className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">{methodInfo?.name || method.payout_method}</h3>
                            {method.is_primary && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                <Star className="w-3 h-3" />
                                Primary
                              </span>
                            )}
                            {getStatusBadge(method.status)}
                          </div>

                          {method.payout_method === 'bank_transfer' && (
                            <div className="space-y-1 text-sm">
                              {method.account_holder_name && (
                                <p className="text-gray-400">
                                  <span className="text-gray-500">Account Holder:</span> {method.account_holder_name}
                                </p>
                              )}
                              {method.bank_name && (
                                <p className="text-gray-400">
                                  <span className="text-gray-500">Bank:</span> {method.bank_name}
                                </p>
                              )}
                              {method.iban && (
                                <p className="text-gray-400 font-mono">
                                  <span className="text-gray-500 font-sans">IBAN:</span> {maskIban(method.iban)}
                                </p>
                              )}
                            </div>
                          )}

                          {method.payout_method === 'paypal' && method.paypal_email && (
                            <p className="text-gray-400 text-sm">{method.paypal_email}</p>
                          )}

                          {method.payout_method === 'wise' && method.wise_email && (
                            <p className="text-gray-400 text-sm">{method.wise_email}</p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Euro className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-500 text-sm">{method.currency}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!method.is_primary && (
                          <button
                            onClick={() => setPrimaryMethod(method.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => deletePayoutMethod(method.id)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-medium mb-3">Payout Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-gray-500 mb-1">Payout Frequency</p>
                <p className="text-white font-medium">Monthly</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-gray-500 mb-1">Minimum Payout</p>
                <p className="text-white font-medium">EUR 50.00</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-gray-500 mb-1">Processing Time</p>
                <p className="text-white font-medium">3-5 business days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddPayout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 sticky top-0 bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Add Payout Method</h2>
                <button
                  onClick={() => setShowAddPayout(false)}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={addPayoutMethod} className="p-6 space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-3">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYOUT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setNewPayoutMethod({ ...newPayoutMethod, payout_method: method.id })}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        newPayoutMethod.payout_method === method.id
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <method.icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newPayoutMethod.payout_method === 'bank_transfer' && (
                <>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Account Holder Name</label>
                    <input
                      type="text"
                      value={newPayoutMethod.account_holder_name || ''}
                      onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, account_holder_name: e.target.value })}
                      placeholder="Name on the bank account"
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={newPayoutMethod.bank_name || ''}
                        onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, bank_name: e.target.value })}
                        placeholder="e.g., ING Bank"
                        required
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Bank Country</label>
                      <input
                        type="text"
                        value={newPayoutMethod.bank_country || ''}
                        onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, bank_country: e.target.value })}
                        placeholder="e.g., Netherlands"
                        required
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">IBAN</label>
                    <input
                      type="text"
                      value={newPayoutMethod.iban || ''}
                      onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, iban: e.target.value.toUpperCase() })}
                      placeholder="e.g., NL91ABNA0417164300"
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">SWIFT/BIC Code</label>
                    <input
                      type="text"
                      value={newPayoutMethod.swift_bic || ''}
                      onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, swift_bic: e.target.value.toUpperCase() })}
                      placeholder="e.g., ABNANL2A"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                    />
                  </div>
                </>
              )}

              {newPayoutMethod.payout_method === 'paypal' && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">PayPal Email</label>
                  <input
                    type="email"
                    value={newPayoutMethod.paypal_email || ''}
                    onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, paypal_email: e.target.value })}
                    placeholder="your-paypal@email.com"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}

              {newPayoutMethod.payout_method === 'wise' && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Wise Email</label>
                  <input
                    type="email"
                    value={newPayoutMethod.wise_email || ''}
                    onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, wise_email: e.target.value })}
                    placeholder="your-wise@email.com"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">Preferred Currency</label>
                <select
                  value={newPayoutMethod.currency || 'EUR'}
                  onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, currency: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code} className="bg-slate-800">
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={newPayoutMethod.is_primary || false}
                  onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, is_primary: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-white">Set as primary payout method</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPayout(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
