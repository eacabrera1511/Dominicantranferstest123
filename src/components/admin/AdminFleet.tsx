import { useState, useEffect } from 'react';
import { Car, Plus, Edit2, Trash2, CheckCircle, XCircle, Wrench, Search, Tag, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Vehicle {
  id: string;
  partner_id: string;
  vehicle_type_id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  status: 'available' | 'in_service' | 'maintenance' | 'inactive';
  features: string[];
  partner_name?: string;
  type_name?: string;
}

interface VehicleType {
  id: string;
  name: string;
  description: string;
  category: string;
  passenger_capacity: number;
  luggage_capacity: number;
  base_price_per_mile: number;
  base_price_per_hour: number;
  minimum_fare: number;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export function AdminFleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'types'>('vehicles');
  const [showAddType, setShowAddType] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);

  const [formData, setFormData] = useState({
    vehicle_type_id: '',
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 4,
    color: '',
    status: 'available' as Vehicle['status'],
    features: [] as string[],
  });

  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    category: 'economy',
    passenger_capacity: 4,
    luggage_capacity: 2,
    base_price_per_mile: 2.50,
    base_price_per_hour: 45.00,
    minimum_fare: 15.00,
    icon_name: 'car',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select(`
        *,
        partners:partner_id(business_name),
        vehicle_types:vehicle_type_id(name)
      `)
      .order('created_at', { ascending: false });

    const { data: typesData } = await supabase
      .from('vehicle_types')
      .select('*')
      .order('name');

    if (vehiclesData) {
      const mapped = vehiclesData.map((v: any) => ({
        ...v,
        partner_name: v.partners?.business_name || 'N/A',
        type_name: v.vehicle_types?.name || 'Unknown',
      }));
      setVehicles(mapped);
    }

    if (typesData) {
      setVehicleTypes(typesData);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleData = {
      ...formData,
      partner_id: '00000000-0000-0000-0000-000000000001',
    };

    if (editingVehicle) {
      const { error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', editingVehicle.id);

      if (!error) {
        setEditingVehicle(null);
        setShowAddVehicle(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData]);

      if (!error) {
        setShowAddVehicle(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_type_id: vehicle.vehicle_type_id,
      license_plate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity,
      color: vehicle.color,
      status: vehicle.status,
      features: vehicle.features || [],
    });
    setShowAddVehicle(true);
  };

  const resetForm = () => {
    setFormData({
      vehicle_type_id: '',
      license_plate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: 4,
      color: '',
      status: 'available',
      features: [],
    });
    setEditingVehicle(null);
  };

  const resetTypeForm = () => {
    setTypeFormData({
      name: '',
      description: '',
      category: 'economy',
      passenger_capacity: 4,
      luggage_capacity: 2,
      base_price_per_mile: 2.50,
      base_price_per_hour: 45.00,
      minimum_fare: 15.00,
      icon_name: 'car',
      display_order: 0,
      is_active: true,
    });
    setEditingType(null);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingType) {
      const { error } = await supabase
        .from('vehicle_types')
        .update(typeFormData)
        .eq('id', editingType.id);

      if (!error) {
        setEditingType(null);
        setShowAddType(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('vehicle_types')
        .insert([typeFormData]);

      if (!error) {
        setShowAddType(false);
        resetTypeForm();
        fetchData();
      }
    }
  };

  const handleTypeDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle type? This may affect existing vehicles.')) return;

    const { error } = await supabase
      .from('vehicle_types')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const handleTypeEdit = (type: VehicleType) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      description: type.description,
      category: type.category,
      passenger_capacity: type.passenger_capacity,
      luggage_capacity: type.luggage_capacity,
      base_price_per_mile: type.base_price_per_mile,
      base_price_per_hour: type.base_price_per_hour,
      minimum_fare: type.minimum_fare,
      icon_name: type.icon_name,
      display_order: type.display_order,
      is_active: type.is_active,
    });
    setShowAddType(true);
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.license_plate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    available: 'text-green-400 bg-green-500/20',
    in_service: 'text-blue-400 bg-blue-500/20',
    maintenance: 'text-amber-400 bg-amber-500/20',
    inactive: 'text-gray-400 bg-gray-500/20',
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
          <h1 className="text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-gray-400 mt-1">Manage vehicles and fleet operations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vehicles'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              Vehicles
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'types'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4" />
              Vehicle Types
            </button>
          </div>

          {activeTab === 'vehicles' ? (
            <button
              onClick={() => {
                resetForm();
                setShowAddVehicle(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          ) : (
            <button
              onClick={() => {
                resetTypeForm();
                setShowAddType(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle Type
            </button>
          )}
        </div>
      </div>

      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {['available', 'in_service', 'maintenance', 'inactive'].map(status => {
            const count = vehicles.filter(v => v.status === status).length;
            return (
              <div key={status} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <p className="text-gray-400 text-sm capitalize mb-1">{status.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-white">{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'types' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <p className="text-gray-400 text-sm mb-1">Total Types</p>
            <p className="text-2xl font-bold text-white">{vehicleTypes.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <p className="text-gray-400 text-sm mb-1">Active Types</p>
            <p className="text-2xl font-bold text-white">{vehicleTypes.filter(t => t.is_active).length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <p className="text-gray-400 text-sm mb-1">Economy</p>
            <p className="text-2xl font-bold text-white">{vehicleTypes.filter(t => t.category === 'economy').length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
            <p className="text-gray-400 text-sm mb-1">Luxury</p>
            <p className="text-2xl font-bold text-white">{vehicleTypes.filter(t => t.category === 'luxury').length}</p>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
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
              <option value="available">Available</option>
              <option value="in_service">In Service</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Vehicle</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Type</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">License</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Capacity</th>
                <th className="text-left text-gray-400 text-sm font-medium pb-3">Status</th>
                <th className="text-right text-gray-400 text-sm font-medium pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-white/5">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-gray-400 text-sm">{vehicle.year} • {vehicle.color}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">{vehicle.type_name}</td>
                  <td className="py-4 text-gray-300 font-mono">{vehicle.license_plate}</td>
                  <td className="py-4 text-gray-300">{vehicle.capacity} seats</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[vehicle.status]}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-white/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
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
      )}

      {activeTab === 'types' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Type Name</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Category</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Capacity</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Base Rate</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Status</th>
                  <th className="text-right text-gray-400 text-sm font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map((type) => (
                  <tr key={type.id} className="border-b border-white/5">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{type.name}</p>
                          <p className="text-gray-400 text-sm">{type.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 capitalize">
                        {type.category}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">{type.passenger_capacity} passengers</td>
                    <td className="py-4 text-gray-300">${type.base_price_per_hour}/hr</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        type.is_active
                          ? 'text-green-400 bg-green-500/20'
                          : 'text-gray-400 bg-gray-500/20'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTypeEdit(type)}
                          className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-white/10 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTypeDelete(type.id)}
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
      )}

      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-gray-400 text-sm mb-2">License Plate</label>
                  <input
                    type="text"
                    required
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Make</label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Year</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Color</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="available">Available</option>
                    <option value="in_service">In Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicle(false);
                    setEditingVehicle(null);
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
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingType ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}
            </h2>

            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Type Name</label>
                  <input
                    type="text"
                    required
                    value={typeFormData.name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="e.g., Sedan, SUV"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Category</label>
                  <select
                    required
                    value={typeFormData.category}
                    onChange={(e) => setTypeFormData({ ...typeFormData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="economy">Economy</option>
                    <option value="comfort">Comfort</option>
                    <option value="business">Business</option>
                    <option value="luxury">Luxury</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <textarea
                    required
                    value={typeFormData.description}
                    onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    rows={2}
                    placeholder="Describe this vehicle type"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Passenger Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={typeFormData.passenger_capacity}
                    onChange={(e) => setTypeFormData({ ...typeFormData, passenger_capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Luggage Capacity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="30"
                    value={typeFormData.luggage_capacity}
                    onChange={(e) => setTypeFormData({ ...typeFormData, luggage_capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Base Price Per Mile ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={typeFormData.base_price_per_mile}
                    onChange={(e) => setTypeFormData({ ...typeFormData, base_price_per_mile: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Base Price Per Hour ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={typeFormData.base_price_per_hour}
                    onChange={(e) => setTypeFormData({ ...typeFormData, base_price_per_hour: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Minimum Fare ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={typeFormData.minimum_fare}
                    onChange={(e) => setTypeFormData({ ...typeFormData, minimum_fare: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Display Order</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={typeFormData.display_order}
                    onChange={(e) => setTypeFormData({ ...typeFormData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Icon Name</label>
                  <input
                    type="text"
                    required
                    value={typeFormData.icon_name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, icon_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="car, truck, bus"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={typeFormData.is_active}
                    onChange={(e) => setTypeFormData({ ...typeFormData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-red-500 focus:ring-2 focus:ring-red-500/50"
                  />
                  <label htmlFor="is_active" className="text-gray-400 text-sm">Active</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddType(false);
                    setEditingType(null);
                    resetTypeForm();
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:from-red-600 hover:to-orange-600 transition-all"
                >
                  {editingType ? 'Update Type' : 'Add Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
