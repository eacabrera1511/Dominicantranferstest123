import { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminLoginProps {
  onLogin: (admin: AdminUser) => void;
  onExit: () => void;
}

export function AdminLogin({ onLogin, onExit }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (dbError || !data) {
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    onLogin(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Sign in to access platform analytics</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@travelai.com"
                required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <p className="text-gray-500 text-xs mt-1">Demo mode: password not required</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={onExit}
              className="w-full text-gray-400 hover:text-white transition-colors text-sm"
            >
              Back to main site
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
