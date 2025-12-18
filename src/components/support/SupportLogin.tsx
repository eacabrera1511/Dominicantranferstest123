import { useState, useEffect } from 'react';
import { Headphones, Mail, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportAgent {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

interface SupportLoginProps {
  onLogin: (agent: SupportAgent) => void;
  onExit: () => void;
}

export function SupportLogin({ onLogin, onExit }: SupportLoginProps) {
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('support_agents')
      .select('*')
      .order('name');

    if (data) {
      setAgents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    setLoading(true);

    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) {
      setError('Agent not found');
      setLoading(false);
      return;
    }

    await supabase
      .from('support_agents')
      .update({ status: 'active', last_active: new Date().toISOString() })
      .eq('id', agent.id);

    onLogin(agent);
    setLoading(false);
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Support Portal</h1>
          <p className="text-gray-400">Sign in to manage customer support</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Select Agent
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 flex items-center justify-between"
                >
                  {selectedAgentData ? (
                    <div>
                      <span className="font-medium">{selectedAgentData.name}</span>
                      <span className="text-gray-400 text-sm ml-2">({selectedAgentData.department.replace('_', ' ')})</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select an agent...</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/20 rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                          selectedAgent === agent.id ? 'bg-teal-500/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{agent.name}</p>
                            <p className="text-gray-400 text-sm">{agent.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            agent.role === 'supervisor' ? 'bg-amber-500/20 text-amber-400' :
                            agent.role === 'senior_agent' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {agent.role.replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
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
              disabled={loading || !selectedAgent}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Start Session
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
      </div>
    </div>
  );
}
