import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Phone, Mail, Star, Search, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  status: 'active' | 'inactive' | 'on_leave';
  rating: number;
  total_trips: number;
  vehicle_id?: string;
  vehicle_info?: string;
  current_location?: {
    lat: number;
    lng: number;
  };
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
}

export function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    status: 'active' as Driver['status'],
    vehicle_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: driversData } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicles:vehicle_id(make, model, license_plate)
      `)
      .order('created_at', { ascending: false });

    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, make, model, license_plate')
      .eq('status', 'available')
      .order('make');

    if (driversData) {
      const mapped = driversData.map((d: any) => ({
        ...d,
        vehicle_info: d.vehicles
          ? `${d.vehicles.make} ${d.vehicles.model} (${d.vehicles.license_plate})`
          : 'No vehicle assigned',
      }));
      setDrivers(mapped);
    }

    if (vehiclesData) {
      setVehicles(vehiclesData);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const driverData = {
      ...formData,
      vehicle_id: formData.vehicle_id || null,
    };

    if (editingDriver) {
      const { error } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', editingDriver.id);

      if (!error) {
        setEditingDriver(null);
        setShowAddDriver(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('drivers')
        .insert([driverData]);

      if (!error) {
        setShowAddDriver(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      status: driver.status,
      vehicle_id: driver.vehicle_id || '',
    });
    setShowAddDriver(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      status: 'active',
      vehicle_id: '',
    });
    setEditingDriver(null);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: 'text-green-400 bg-green-500/20',
    inactive: 'text-gray-400 bg-gray-500/20',
    on_leave: 'text-amber-400 bg-amber-500/20',
  };

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'active').length,
    totalTrips: drivers.reduce((sum, d) => sum + (d.total_trips || 0), 0),
    avgRating: drivers.length > 0
      ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1)
      : '0.0',
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
          <h1 className="text-2xl font-bold text-white">Driver Management</h1>
          <p className="text-gray-400 mt-1">Manage drivers and assignments</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddDriver(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Total Drivers</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Total Trips</p>
          <p className="text-2xl font-bold text-white">{stats.totalTrips}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-sm mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-white">{stats.avgRating} <Star className="w-4 h-4 inline text-amber-400 fill-amber-400" /></p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Driver</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Contact</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Vehicle</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Rating</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Status</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="border-b border-white/5">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <p className="text-gray-400 text-sm">License: {driver.license_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Phone className="w-3 h-3" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Mail className="w-3 h-3" />
                        {driver.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300 text-sm">{driver.vehicle_info}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-medium">{driver.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-400 text-sm">({driver.total_trips || 0} trips)</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[driver.status]}`}>
                      {driver.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-white/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
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

      {showAddDriver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">License Number</label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">License Expiry</label>
                  <input
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Driver['status'] })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-2">Assign Vehicle (Optional)</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="">No vehicle assigned</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDriver(false);
                    setEditingDriver(null);
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
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
