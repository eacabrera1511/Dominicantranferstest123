import { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportAgent {
  id: string;
  name: string;
}

interface CreateTicketProps {
  currentAgent: SupportAgent;
  onBack: () => void;
  onCreated: (ticketId: string) => void;
}

export function CreateTicket({ currentAgent, onBack, onCreated }: CreateTicketProps) {
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'inquiry',
    source: 'web_form',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    assigned_to: '',
    tags: '',
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from('support_agents').select('id, name').order('name');
    if (data) setAgents(data);
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TKT-${dateStr}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const ticketNumber = generateTicketNumber();

    const { data: ticketData, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        source: formData.source,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        assigned_to: formData.assigned_to || null,
        created_by: currentAgent.id,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      setLoading(false);
      return;
    }

    if (formData.tags && ticketData) {
      const tagList = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        await supabase.from('ticket_tags').insert(
          tagList.map(tag => ({ ticket_id: ticketData.id, tag }))
        );
      }
    }

    await supabase.from('ticket_communications').insert({
      ticket_id: ticketData.id,
      agent_id: currentAgent.id,
      type: 'note',
      content: `Ticket created by ${currentAgent.name}`,
      is_internal: true,
    });

    setLoading(false);
    onCreated(ticketData.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Ticket</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in the details below to create a support ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Ticket Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Brief description of the issue"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="inquiry">Inquiry</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="technical">Technical</option>
                    <option value="complaint">Complaint</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="web_form">Web Form</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., vip, urgent, follow-up"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer name"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="customer@email.com"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="+1-555-0123"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Assignment</h2>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.subject}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
