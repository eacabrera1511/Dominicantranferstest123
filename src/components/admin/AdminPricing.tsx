import { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, MapPin, TrendingUp, Hotel } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingRule {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  base_price: number;
  price_per_km: number;
  price_per_minute: number;
  surge_multiplier: number;
  vehicle_type_id: string;
  vehicle_type_name?: string;
  active: boolean;
}

interface VehicleType {
  id: string;
  name: string;
}

interface HotelZone {
  id: string;
  hotel_name: string;
  zone_code: string;
  zone_name: string;
  search_terms: string[];
  is_active: boolean;
}

interface GlobalDiscount {
  id: string;
  discount_percentage: number;
  is_active: boolean;
  reason: string;
  start_date: string;
  end_date: string | null;
  created_by: string;
}

export function AdminPricing() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [hotelZones, setHotelZones] = useState<HotelZone[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountFormData, setDiscountFormData] = useState({
    discount_percentage: 0,
    is_active: true,
    reason: '',
  });

  const [formData, setFormData] = useState({
    route_name: '',
    origin: '',
    destination: '',
    base_price: 50,
    price_per_km: 2.5,
    price_per_minute: 0.5,
    surge_multiplier: 1.0,
    vehicle_type_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: rulesData } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        vehicle_types:vehicle_type_id(name)
      `)
      .order('created_at', { ascending: false });

    const { data: typesData } = await supabase
      .from('vehicle_types')
      .select('id, name')
      .order('name');

    const { data: hotelsData } = await supabase
      .from('hotel_zones')
      .select('*')
      .eq('is_active', true)
      .order('zone_code', { ascending: true })
      .order('hotel_name', { ascending: true });

    const { data: discountData } = await supabase
      .from('global_discount_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rulesData) {
      const mapped = rulesData.map((r: any) => ({
        ...r,
        vehicle_type_name: r.vehicle_types?.name || 'Unknown',
      }));
      setPricingRules(mapped);
    }

    if (typesData) {
      setVehicleTypes(typesData);
    }

    if (hotelsData) {
      setHotelZones(hotelsData);
    }

    if (discountData) {
      setGlobalDiscount(discountData);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRule) {
      const { error } = await supabase
        .from('pricing_rules')
        .update(formData)
        .eq('id', editingRule.id);

      if (!error) {
        setEditingRule(null);
        setShowAddRule(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('pricing_rules')
        .insert([formData]);

      if (!error) {
        setShowAddRule(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      route_name: rule.route_name,
      origin: rule.origin,
      destination: rule.destination,
      base_price: rule.base_price,
      price_per_km: rule.price_per_km,
      price_per_minute: rule.price_per_minute,
      surge_multiplier: rule.surge_multiplier,
      vehicle_type_id: rule.vehicle_type_id,
      is_active: rule.active,
    });
    setShowAddRule(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('pricing_rules')
      .update({ active: !currentStatus })
      .eq('id', id);

    fetchData();
  };

  const resetForm = () => {
    setFormData({
      route_name: '',
      origin: '',
      destination: '',
      base_price: 50,
      price_per_km: 2.5,
      price_per_minute: 0.5,
      surge_multiplier: 1.0,
      vehicle_type_id: '',
      is_active: true,
    });
    setEditingRule(null);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (globalDiscount) {
      await supabase
        .from('global_discount_settings')
        .update({ is_active: false })
        .eq('id', globalDiscount.id);
    }

    const { error } = await supabase
      .from('global_discount_settings')
      .insert([{
        ...discountFormData,
        created_by: 'admin'
      }]);

    if (!error) {
      setShowDiscountModal(false);
      fetchData();
    }
  };

  const handleDeactivateDiscount = async () => {
    if (!globalDiscount) return;
    if (!confirm('Are you sure you want to deactivate the current discount?')) return;

    await supabase
      .from('global_discount_settings')
      .update({ is_active: false })
      .eq('id', globalDiscount.id);

    fetchData();
  };

  const stats = {
    totalRules: pricingRules.length,
    activeRules: pricingRules.filter(r => r.active).length,
    avgBasePrice: pricingRules.length > 0
      ? (pricingRules.reduce((sum, r) => sum + r.base_price, 0) / pricingRules.length).toFixed(2)
      : '0.00',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing & Routes</h1>
          <p className="text-gray-400 mt-1">Manage pricing rules and route configurations</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddRule(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Pricing Rule
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Global Discount</h2>
            </div>
            {globalDiscount ? (
              <div className="space-y-2">
                <p className="text-gray-300">
                  Current discount: <span className="text-2xl font-bold text-amber-400">{globalDiscount.discount_percentage}%</span> OFF all services
                </p>
                {globalDiscount.reason && (
                  <p className="text-sm text-gray-400">Reason: {globalDiscount.reason}</p>
                )}
                <p className="text-xs text-gray-500">Active since: {new Date(globalDiscount.start_date).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-gray-400">No active discount</p>
            )}
          </div>
          <div className="flex gap-2">
            {globalDiscount && (
              <button
                onClick={handleDeactivateDiscount}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Deactivate
              </button>
            )}
            <button
              onClick={() => {
                setDiscountFormData({
                  discount_percentage: globalDiscount?.discount_percentage || 0,
                  is_active: true,
                  reason: '',
                });
                setShowDiscountModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all font-medium"
            >
              {globalDiscount ? 'Update Discount' : 'Set Discount'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Total Rules</p>
          <p className="text-2xl font-bold text-white">{stats.totalRules}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Active Rules</p>
          <p className="text-2xl font-bold text-green-400">{stats.activeRules}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Avg Base Price</p>
          <p className="text-2xl font-bold text-white">${stats.avgBasePrice}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">Dynamic Pricing</p>
            <p className="text-gray-300 text-sm">Pricing rules automatically apply to AI chat bookings and web bookings</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Hotel className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Hotels by Zone</h2>
          </div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          >
            <option value="all">All Zones</option>
            <option value="Zone A">Zone A - Bavaro / Punta Cana</option>
            <option value="Zone B">Zone B - Cap Cana</option>
            <option value="Zone C">Zone C - Uvero Alto</option>
            <option value="Zone D">Zone D - Bayahibe</option>
            <option value="Zone E">Zone E - Santo Domingo</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedZone === 'all'
            ? ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']
            : [selectedZone]
          ).map((zone) => {
            const zoneHotels = hotelZones.filter(h => h.zone_code === zone);
            if (zoneHotels.length === 0) return null;

            return (
              <div key={zone} className="bg-white/5 rounded-lg border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${
                    zone === 'Zone A' ? 'bg-blue-400' :
                    zone === 'Zone B' ? 'bg-green-400' :
                    zone === 'Zone C' ? 'bg-yellow-400' :
                    zone === 'Zone D' ? 'bg-orange-400' :
                    'bg-red-400'
                  }`} />
                  <h3 className="font-semibold text-white">{zone}</h3>
                  <span className="ml-auto text-xs text-gray-400">{zoneHotels.length} hotels</span>
                </div>
                <div className="space-y-2">
                  {zoneHotels.map(hotel => (
                    <div key={hotel.id} className="text-sm text-gray-300 py-1 border-b border-white/5 last:border-0">
                      {hotel.hotel_name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Route</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Vehicle Type</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Base Price</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Per KM</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Per Min</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Surge</th>
                <th className="text-center text-gray-400 text-sm font-medium pb-3">Status</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="border-b border-white/5">
                  <td className="py-4">
                    <div>
                      <p className="text-white font-medium">{rule.route_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 text-green-400" />
                          {rule.origin}
                        </div>
                        <span className="text-gray-600">→</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 text-red-400" />
                          {rule.destination}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">{rule.vehicle_type_name}</td>
                  <td className="py-4 text-right text-white font-medium">${rule.base_price}</td>
                  <td className="py-4 text-right text-gray-300">${rule.price_per_km}</td>
                  <td className="py-4 text-right text-gray-300">${rule.price_per_minute}</td>
                  <td className="py-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rule.surge_multiplier > 1
                        ? 'text-red-400 bg-red-500/20'
                        : 'text-gray-400 bg-gray-500/20'
                    }`}>
                      {rule.surge_multiplier}x
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <button
                      onClick={() => toggleActive(rule.id, rule.active)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        rule.active
                          ? 'text-green-400 bg-green-500/20'
                          : 'text-gray-400 bg-gray-500/20'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-white/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-white/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Airport to Punta Cana"
                  value={formData.route_name}
                  onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Origin</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., PUJ Airport"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bavaro Hotels"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Vehicle Type</label>
                <select
                  required
                  value={formData.vehicle_type_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_type_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                >
                  <option value="">Select Type</option>
                  {vehicleTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Price per KM ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price_per_km}
                    onChange={(e) => setFormData({ ...formData, price_per_km: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Price per Minute ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price_per_minute}
                    onChange={(e) => setFormData({ ...formData, price_per_minute: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Surge Multiplier</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.surge_multiplier}
                    onChange={(e) => setFormData({ ...formData, surge_multiplier: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/5 border-white/10"
                />
                <label htmlFor="is_active" className="text-white">Active (rule will apply immediately)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRule(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
                >
                  {editingRule ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              {globalDiscount ? 'Update Global Discount' : 'Set Global Discount'}
            </h2>

            <form onSubmit={handleDiscountSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g., 80"
                  value={discountFormData.discount_percentage}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, discount_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a percentage between 0 and 100</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Holiday Sale, Promotional Discount"
                  value={discountFormData.reason}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-400">
                  This discount will apply to all services and pricing calculations across the entire platform.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  {globalDiscount ? 'Update Discount' : 'Set Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
