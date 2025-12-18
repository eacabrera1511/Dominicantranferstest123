import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface AgentLoginProps {
  onLogin: (email: string) => void;
}

export default function AgentLogin({ onLogin }: AgentLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production, this would validate against agent_users table
      // For demo, we'll accept the demo agent email
      if (email === 'dispatch@example.com' || email.includes('@')) {
        onLogin(email);
      } else {
        alert('Invalid agent email');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Agent Portal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to access the dispatch system
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Agent Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dispatch@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-1">Demo Credentials:</p>
          <p className="text-sm text-blue-700">dispatch@example.com</p>
        </div>
      </div>
    </div>
  );
}
