import { Service } from '../lib/supabase';
import { Car, Plane, MapPin, Ticket, Anchor } from 'lucide-react';
import { useState } from 'react';
import { UnifiedBookingModal } from './UnifiedBookingModal';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [showBooking, setShowBooking] = useState(false);

  const getIcon = () => {
    switch (service.type) {
      case 'airport_transfer':
        return <Car className="w-6 h-6" />;
      case 'car_rental':
        return <Car className="w-6 h-6" />;
      case 'yacht_rental':
        return <Anchor className="w-6 h-6" />;
      case 'flight':
        return <Plane className="w-6 h-6" />;
      case 'attraction':
        return <Ticket className="w-6 h-6" />;
      default:
        return <MapPin className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (service.type) {
      case 'airport_transfer':
        return 'Airport Transfer';
      case 'car_rental':
        return 'Car Rental';
      case 'yacht_rental':
        return 'Yacht Rental';
      case 'flight':
        return 'Flight Service';
      case 'attraction':
        return 'Activity';
      default:
        return 'Service';
    }
  };

  const getGradient = () => {
    switch (service.type) {
      case 'airport_transfer':
        return 'from-blue-500/20 to-cyan-500/20';
      case 'car_rental':
        return 'from-slate-500/20 to-gray-500/20';
      case 'yacht_rental':
        return 'from-cyan-500/20 to-teal-500/20';
      case 'flight':
        return 'from-orange-500/20 to-red-500/20';
      case 'attraction':
        return 'from-green-500/20 to-emerald-500/20';
      default:
        return 'from-gray-500/20 to-slate-500/20';
    }
  };

  return (
    <div className="group rounded-3xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer">
      {service.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient()} backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-lg`}>
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{getTypeLabel()}</div>
            <h3 className="text-white font-bold text-lg line-clamp-2">{service.name}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-300 text-sm mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{service.location}</span>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description}</p>

        {service.details && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(service.details).slice(0, 3).map(([key, value], index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full text-xs text-gray-300 border border-white/10"
              >
                {String(value)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs">From</span>
            <div className="text-white font-bold text-2xl">${service.price}</div>
            <span className="text-gray-400 text-xs">per person</span>
          </div>

          <button
            onClick={() => setShowBooking(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-medium text-sm shadow-lg transition-all duration-300 hover:shadow-blue-500/50"
          >
            Book Now
          </button>
        </div>
      </div>

      <UnifiedBookingModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        item={service}
        type="service"
      />
    </div>
  );
}
