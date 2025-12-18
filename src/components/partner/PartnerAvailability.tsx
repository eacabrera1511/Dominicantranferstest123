import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';
import { CustomSelect } from '../ui/CustomSelect';

interface PartnerAvailabilityProps {
  partner: Partner;
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

interface AvailabilityRecord {
  id: string;
  date: string;
  available_units: number;
  total_units: number;
  price: number;
  status: string;
  resource_name: string;
}

export function PartnerAvailability({ partner }: PartnerAvailabilityProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Map<string, AvailabilityRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ available_units: 0, price: 0, total_units: 1 });

  useEffect(() => {
    loadResources();
  }, [partner.id]);

  useEffect(() => {
    if (selectedResource) {
      loadAvailability();
    }
  }, [selectedResource, currentDate]);

  const loadResources = async () => {
    setLoading(true);
    const [hotelsResult, servicesResult] = await Promise.all([
      supabase.from('hotels').select('id, name').eq('partner_id', partner.id),
      supabase.from('services').select('id, name, type').eq('partner_id', partner.id)
    ]);

    const resourceList: Resource[] = [];

    if (hotelsResult.data) {
      resourceList.push(...hotelsResult.data.map(h => ({ id: h.id, name: h.name, type: 'hotel' })));
    }

    if (servicesResult.data) {
      resourceList.push(...servicesResult.data.map(s => ({ id: s.id, name: s.name, type: s.type })));
    }

    setResources(resourceList);
    if (resourceList.length > 0 && !selectedResource) {
      setSelectedResource(resourceList[0]);
    }
    setLoading(false);
  };

  const loadAvailability = async () => {
    if (!selectedResource) return;

    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('resource_id', selectedResource.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const availabilityMap = new Map<string, AvailabilityRecord>();
    if (data) {
      data.forEach(record => {
        availabilityMap.set(record.date, record);
      });
    }

    setAvailability(availabilityMap);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleEditDate = (date: Date) => {
    const dateStr = formatDate(date);
    const record = availability.get(dateStr);

    if (record) {
      setEditForm({
        available_units: record.available_units,
        price: record.price,
        total_units: record.total_units
      });
    } else {
      setEditForm({ available_units: 1, price: 100, total_units: 1 });
    }

    setEditingDate(dateStr);
  };

  const handleSaveAvailability = async () => {
    if (!editingDate || !selectedResource) return;

    const record = {
      partner_id: partner.id,
      resource_type: selectedResource.type,
      resource_id: selectedResource.id,
      resource_name: selectedResource.name,
      date: editingDate,
      ...editForm,
      updated_via: 'manual'
    };

    const existing = availability.get(editingDate);

    if (existing) {
      await supabase
        .from('availability')
        .update(record)
        .eq('id', existing.id);
    } else {
      await supabase.from('availability').insert(record);
    }

    setEditingDate(null);
    loadAvailability();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'limited': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      case 'sold_out': return 'bg-red-500/20 border-red-500/30 text-red-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getTotalAvailable = () => {
    let total = 0;
    availability.forEach(record => {
      if (record.status === 'available' || record.status === 'limited') {
        total += record.available_units;
      }
    });
    return total;
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">No resources found</h3>
        <p className="text-gray-400 text-sm">
          Add hotels or services to your listings first to manage availability
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">Availability Calendar</h1>
          <p className="text-gray-400 text-sm">Manage real-time availability for your listings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{getTotalAvailable()}</p>
              <p className="text-gray-400 text-sm">Available Units</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resources.length}</p>
              <p className="text-gray-400 text-sm">Total Resources</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{availability.size}</p>
              <p className="text-gray-400 text-sm">Days Configured</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 xs:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Resource</label>
            <CustomSelect
              value={selectedResource?.id || ''}
              onChange={(value) => {
                const resource = resources.find(r => r.id === value);
                setSelectedResource(resource || null);
              }}
              options={resources.map((resource) => ({
                value: resource.id,
                label: `${resource.name} (${resource.type})`
              }))}
              placeholder="Select a resource"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 bg-white/10 rounded-lg">
              <p className="text-white font-medium text-sm whitespace-nowrap">{monthName}</p>
            </div>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-gray-400 text-xs font-medium">{day}</span>
            </div>
          ))}

          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(day);
            const record = availability.get(dateStr);
            const isToday = formatDate(new Date()) === dateStr;
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={dateStr}
                onClick={() => !isPast && handleEditDate(day)}
                disabled={isPast}
                className={`aspect-square rounded-lg border transition-all ${
                  isPast
                    ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
                    : record
                    ? `${getStatusColor(record.status)} hover:opacity-80`
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex flex-col items-center justify-center h-full p-1">
                  <span className="text-white text-sm font-medium">{day.getDate()}</span>
                  {record && (
                    <>
                      <span className="text-xs mt-0.5">{record.available_units}/{record.total_units}</span>
                      <span className="text-xs">${record.price}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-xs text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30"></div>
            <span className="text-xs text-gray-400">Limited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
            <span className="text-xs text-gray-400">Sold Out</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 p-4 xs:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Automatic Sync Active</h3>
            <p className="text-gray-300 text-sm">
              Availability is automatically synced with your connected systems. Manual changes will be overwritten on the next sync.
              To maintain manual control, disable auto-sync in the API Integrations section.
            </p>
          </div>
        </div>
      </div>

      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-md">
            <div className="flex items-center justify-between p-4 xs:p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                Edit Availability - {new Date(editingDate).toLocaleDateString()}
              </h2>
              <button
                onClick={() => setEditingDate(null)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 xs:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Units</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.total_units}
                  onChange={(e) => setEditForm({ ...editForm, total_units: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Available Units</label>
                <input
                  type="number"
                  min="0"
                  max={editForm.total_units}
                  value={editForm.available_units}
                  onChange={(e) => setEditForm({ ...editForm, available_units: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveAvailability}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setEditingDate(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
