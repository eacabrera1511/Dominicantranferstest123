import { useState } from 'react';
import { User, Building2, Mail, Phone, Globe, MapPin, Save, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';

interface PartnerSettingsProps {
  partner: Partner;
  onUpdate: (partner: Partner) => void;
}

export function PartnerSettings({ partner, onUpdate }: PartnerSettingsProps) {
  const [formData, setFormData] = useState({
    business_name: partner.business_name,
    contact_name: partner.contact_name,
    email: partner.email,
    phone: partner.phone || '',
    description: partner.description || '',
    website_url: partner.website_url || '',
    address: partner.address || '',
    city: partner.city || '',
    country: partner.country || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const { data, error } = await supabase
      .from('partners')
      .update({
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        description: formData.description,
        website_url: formData.website_url,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner.id)
      .select()
      .single();

    if (data && !error) {
      onUpdate(data);
      localStorage.setItem('partner_session', JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your partner profile and preferences</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 xs:p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                '🏢'
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{partner.business_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  partner.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  partner.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {partner.status}
                </span>
                {partner.verified && (
                  <span className="flex items-center gap-1 text-blue-400 text-xs">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 xs:p-6 space-y-4 xs:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Business Name
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed"
              />
              <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+31 6 1234 5678"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({...formData, website_url: e.target.value})}
              placeholder="https://yourwebsite.com"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              placeholder="Tell travelers about your business..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-white/10">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Street address"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="City"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    placeholder="Country"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            <div className={saved ? '' : 'ml-auto'}>
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 p-4 xs:p-6">
        <h3 className="text-white font-semibold mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400 text-sm">Business Type</span>
            <span className="text-white text-sm capitalize">{partner.business_type.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400 text-sm">Commission Rate</span>
            <span className="text-white text-sm">{partner.commission_rate}%</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400 text-sm">Account Created</span>
            <span className="text-white text-sm">{new Date(partner.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400 text-sm">Partner ID</span>
            <span className="text-white font-mono text-sm">{partner.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {!partner.verified && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl xs:rounded-2xl p-4 xs:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Get Verified</h3>
              <p className="text-gray-400 text-sm mb-3">
                Verified partners get a badge on their listings, increased visibility, and higher trust from customers.
              </p>
              <p className="text-amber-300 text-sm">
                Complete your profile with a description, address, and contact information to qualify for verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
