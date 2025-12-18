import { Hotel } from '../lib/supabase';
import { MapPin, Star, Wifi, Utensils } from 'lucide-react';
import { useState } from 'react';
import { UnifiedBookingModal } from './UnifiedBookingModal';

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <div className="group rounded-3xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.image_url}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-semibold text-sm">{hotel.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{hotel.name}</h3>

        <div className="flex items-center gap-2 text-gray-300 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{hotel.location}, {hotel.country}</span>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{hotel.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full text-xs text-gray-300 border border-white/10"
            >
              {amenity === 'Free WiFi' && <Wifi className="w-3 h-3 inline mr-1" />}
              {amenity === 'Restaurant' && <Utensils className="w-3 h-3 inline mr-1" />}
              {amenity}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs">From</span>
            <div className="text-white font-bold text-2xl">${hotel.price_per_night}</div>
            <span className="text-gray-400 text-xs">per night</span>
          </div>

          <button
            onClick={() => setShowBooking(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-medium text-sm shadow-lg transition-all duration-300 hover:shadow-blue-500/50"
          >
            Book Now
          </button>
        </div>
      </div>
      </div>

      <UnifiedBookingModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        item={hotel}
        type="hotel"
      />
    </>
  );
}
