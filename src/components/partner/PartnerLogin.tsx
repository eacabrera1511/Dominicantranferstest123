import { useState } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, Building2, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PartnerLoginProps {
  onLogin: (email: string) => Promise<{ data: any; error: any }>;
  onExit: () => void;
}

export function PartnerLogin({ onLogin, onExit }: PartnerLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    business_type: 'hotel'
  });
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onLogin(email);
    if (result.error || !result.data) {
      setError('Partner not found. Please check your email or register.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('partners')
      .insert({
        business_name: registerData.business_name,
        contact_name: registerData.contact_name,
        email: registerData.email,
        phone: registerData.phone,
        business_type: registerData.business_type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      setError(error.message.includes('duplicate') ? 'Email already registered.' : 'Registration failed. Please try again.');
    } else if (data) {
      setRegisterSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <button
          onClick={onExit}
          className="absolute -top-12 left-0 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to main site</span>
        </button>

        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-6 xs:p-8 shadow-2xl">
          <div className="text-center mb-6 xs:mb-8">
            <div className="w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl xs:text-3xl">
              🏢
            </div>
            <h1 className="text-xl xs:text-2xl font-bold text-white mb-2">Partner Portal</h1>
            <p className="text-gray-400 text-sm">
              {showRegister
                ? 'Register your business to start listing'
                : 'Manage your listings and bookings'}
            </p>
          </div>

          {registerSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Registration Submitted!</h3>
              <p className="text-gray-400 text-sm">
                Your partner application is pending review. You'll receive an email once approved.
              </p>
              <button
                onClick={() => {
                  setShowRegister(false);
                  setRegisterSuccess(false);
                  setEmail(registerData.email);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Go to Login
              </button>
            </div>
          ) : showRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Business Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerData.business_name}
                    onChange={(e) => setRegisterData({...registerData, business_name: e.target.value})}
                    placeholder="Your company name"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Contact Name *</label>
                <input
                  type="text"
                  value={registerData.contact_name}
                  onChange={(e) => setRegisterData({...registerData, contact_name: e.target.value})}
                  placeholder="Your full name"
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="business@example.com"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  placeholder="+31 6 1234 5678"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Business Type *</label>
                <select
                  value={registerData.business_type}
                  onChange={(e) => setRegisterData({...registerData, business_type: e.target.value})}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="hotel" className="bg-slate-800">Hotel / Accommodation</option>
                  <option value="tour_operator" className="bg-slate-800">Tour Operator</option>
                  <option value="car_rental" className="bg-slate-800">Car Rental</option>
                  <option value="transfer" className="bg-slate-800">Airport Transfer</option>
                  <option value="yacht" className="bg-slate-800">Yacht Charter</option>
                  <option value="general" className="bg-slate-800">General Services</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Register Business
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors"
              >
                Already have an account? Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Partner Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your partner email"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-300 text-xs">
                  <strong>Demo:</strong> Use <span className="font-mono">partner@paradisetravel.com</span> to try the portal
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-transparent text-gray-400">New partner?</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Register Your Business
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
