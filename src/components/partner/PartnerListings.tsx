import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Car, Plane, Ship, MapPin, Star, Edit2, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from './PartnerPortal';
import { CustomSelect } from '../ui/CustomSelect';

interface PartnerListingsProps {
  partner: Partner;
}

interface Listing {
  id: string;
  type: 'hotel' | 'service';
  name: string;
  location: string;
  price: number;
  rating?: number;
  image_url?: string;
  description?: string;
  service_type?: string;
}

export function PartnerListings({ partner }: PartnerListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'service'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  useEffect(() => {
    loadListings();
  }, [partner.id]);

  const loadListings = async () => {
    setLoading(true);

    const [hotelsResult, servicesResult] = await Promise.all([
      supabase.from('hotels').select('*').eq('partner_id', partner.id),
      supabase.from('services').select('*').eq('partner_id', partner.id)
    ]);

    const hotels: Listing[] = (hotelsResult.data || []).map(h => ({
      id: h.id,
      type: 'hotel' as const,
      name: h.name,
      location: h.location,
      price: h.price_per_night,
      rating: h.rating,
      image_url: h.image_url,
      description: h.description
    }));

    const services: Listing[] = (servicesResult.data || []).map(s => ({
      id: s.id,
      type: 'service' as const,
      name: s.name,
      location: s.location,
      price: s.price,
      image_url: s.image_url,
      description: s.description,
      service_type: s.type
    }));

    setListings([...hotels, ...services]);
    setLoading(false);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || listing.type === filterType;
    return matchesSearch && matchesType;
  });

  const getServiceIcon = (type?: string) => {
    switch (type) {
      case 'car_rental': return Car;
      case 'flight': return Plane;
      case 'yacht_rental': return Ship;
      default: return Building2;
    }
  };

  const deleteListing = async (listing: Listing) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const table = listing.type === 'hotel' ? 'hotels' : 'services';
    await supabase.from(table).delete().eq('id', listing.id);
    loadListings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-white mb-1">My Listings</h1>
          <p className="text-gray-400 text-sm">Manage your hotels, services, and experiences</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Listing</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search listings..."
            className="w-full bg-white/5 border border-white/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'hotel', 'service'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All' : type === 'hotel' ? 'Hotels' : 'Services'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredListings.map((listing) => {
            const ServiceIcon = getServiceIcon(listing.service_type);
            return (
              <div
                key={listing.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all group"
              >
                <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 relative">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ServiceIcon className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      listing.type === 'hotel'
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-green-500/80 text-white'
                    }`}>
                      {listing.type === 'hotel' ? 'Hotel' : listing.service_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingListing(listing)}
                      className="w-8 h-8 bg-white/20 backdrop-blur-xl rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteListing(listing)}
                      className="w-8 h-8 bg-red-500/20 backdrop-blur-xl rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">{listing.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{listing.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold">
                      ${listing.price}
                      <span className="text-gray-400 font-normal text-sm">
                        {listing.type === 'hotel' ? '/night' : ''}
                      </span>
                    </div>
                    {listing.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm">{listing.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No listings yet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Start adding your hotels, tours, and services to reach travelers worldwide.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Listing
          </button>
        </div>
      )}

      {(showAddModal || editingListing) && (
        <AddEditListingModal
          partner={partner}
          listing={editingListing}
          onClose={() => {
            setShowAddModal(false);
            setEditingListing(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingListing(null);
            loadListings();
          }}
        />
      )}
    </div>
  );
}

interface AddEditListingModalProps {
  partner: Partner;
  listing: Listing | null;
  onClose: () => void;
  onSave: () => void;
}

function AddEditListingModal({ partner, listing, onClose, onSave }: AddEditListingModalProps) {
  const [listingType, setListingType] = useState<'hotel' | 'service'>(listing?.type || 'hotel');
  const [formData, setFormData] = useState({
    name: listing?.name || '',
    location: listing?.location || '',
    price: listing?.price?.toString() || '',
    description: listing?.description || '',
    image_url: listing?.image_url || '',
    service_type: listing?.service_type || 'attraction',
    rating: listing?.rating?.toString() || '8.0'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (listingType === 'hotel') {
      const hotelData = {
        name: formData.name,
        location: formData.location,
        country: formData.location.split(',').pop()?.trim() || formData.location,
        address: formData.location,
        description: formData.description,
        price_per_night: parseFloat(formData.price),
        rating: parseFloat(formData.rating),
        image_url: formData.image_url,
        partner_id: partner.id
      };

      if (listing) {
        await supabase.from('hotels').update(hotelData).eq('id', listing.id);
      } else {
        await supabase.from('hotels').insert(hotelData);
      }
    } else {
      const serviceData = {
        type: formData.service_type,
        name: formData.name,
        location: formData.location,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        partner_id: partner.id
      };

      if (listing) {
        await supabase.from('services').update(serviceData).eq('id', listing.id);
      } else {
        await supabase.from('services').insert(serviceData);
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {listing ? 'Edit Listing' : 'Add New Listing'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!listing && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Listing Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setListingType('hotel')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    listingType === 'hotel'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Hotel
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('service')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    listingType === 'service'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Service
                </button>
              </div>
            </div>
          )}

          {listingType === 'service' && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Service Type</label>
              <CustomSelect
                value={formData.service_type}
                onChange={(value) => setFormData({...formData, service_type: value})}
                options={[
                  { value: 'attraction', label: 'Tour / Attraction' },
                  { value: 'airport_transfer', label: 'Airport Transfer' },
                  { value: 'car_rental', label: 'Car Rental' },
                  { value: 'flight', label: 'Flight' },
                  { value: 'yacht_rental', label: 'Yacht Rental' }
                ]}
                placeholder="Select service type"
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={listingType === 'hotel' ? 'Hotel name' : 'Service name'}
              required
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="City, Country"
              required
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Price {listingType === 'hotel' ? '(per night)' : ''} *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {listingType === 'hotel' && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Rating (0-10)</label>
              <input
                type="number"
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: e.target.value})}
                placeholder="8.0"
                min="0"
                max="10"
                step="0.1"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your listing..."
              rows={3}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {listing ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
