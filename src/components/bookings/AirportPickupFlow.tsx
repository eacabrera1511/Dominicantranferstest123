import { useState } from 'react';
import { Plane, MapPin, Users, Clock, Calendar, ArrowLeftRight, Car, DollarSign } from 'lucide-react';

interface AirportPickupFlowProps {
  service: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const VEHICLE_OPTIONS = [
  { value: 'Sedan', label: 'Sedan (1-2 passengers, up to 3 bags)', basePrice: 25 },
  { value: 'Minivan', label: 'Minivan (3-6 passengers, 6-8 bags)', basePrice: 45 },
  { value: 'Suburban', label: 'Suburban VIP (1-4 passengers, up to 4 bags)', basePrice: 65 },
  { value: 'Sprinter', label: 'Sprinter Van (7-12 passengers, 10-14 bags)', basePrice: 110 },
  { value: 'Mini Bus', label: 'Mini Bus (13+ passengers)', basePrice: 180 },
];

export function AirportPickupFlow({ service, onNext, onBack }: AirportPickupFlowProps) {
  const [formData, setFormData] = useState({
    pickupDate: '',
    pickupTime: '',
    flightNumber: '',
    pickupLocation: 'airport',
    pickupAddress: '',
    dropoffAddress: '',
    passengers: 1,
    luggage: 1,
    specialRequests: '',
    isRoundTrip: false,
    returnDate: '',
    returnTime: '',
    vehicleType: 'Sedan',
    customRate: '',
    useCustomRate: false
  });

  const isValid = formData.pickupDate && formData.pickupTime &&
                  (formData.pickupLocation === 'airport' ? formData.flightNumber : true) &&
                  (formData.pickupLocation === 'custom' ? formData.pickupAddress : true) &&
                  formData.dropoffAddress &&
                  (!formData.isRoundTrip || (formData.returnDate && formData.returnTime));

  const calculateTotal = () => {
    if (formData.useCustomRate && formData.customRate) {
      const customPrice = parseFloat(formData.customRate);
      return isNaN(customPrice) ? 0 : customPrice;
    }

    const selectedVehicle = VEHICLE_OPTIONS.find(v => v.value === formData.vehicleType);
    const basePrice = selectedVehicle ? selectedVehicle.basePrice : service.price;
    return formData.isRoundTrip ? basePrice * 1.9 : basePrice;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
          <Plane className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400" />
        </div>
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">Airport Pickup Details</h3>
        <p className="text-gray-300 text-xs sm:text-sm">{service.name}</p>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        <div className="bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
              <span className="text-white text-xs sm:text-sm font-medium">Round Trip</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isRoundTrip}
                onChange={(e) => setFormData({...formData, isRoundTrip: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-10 h-5 sm:w-11 sm:h-6 bg-white/20 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
          {formData.isRoundTrip && (
            <p className="text-green-400 text-xs mt-1.5 pl-6">Save 10% on round trip bookings!</p>
          )}
        </div>

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
            Pickup Date *
          </label>
          <input
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 sm:py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark] appearance-none"
          />
        </div>

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
            Pickup Time *
          </label>
          <input
            type="time"
            value={formData.pickupTime}
            onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark] appearance-none"
          />
        </div>

        {formData.isRoundTrip && (
          <>
            <div className="animate-fadeIn">
              <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
                Return Date *
              </label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 sm:py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark] appearance-none"
              />
            </div>

            <div className="animate-fadeIn">
              <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
                Return Time *
              </label>
              <input
                type="time"
                value={formData.returnTime}
                onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark] appearance-none"
              />
            </div>
          </>
        )}

        {formData.pickupLocation === 'airport' && (
          <div>
            <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
              <Plane className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
              Flight Number *
            </label>
            <input
              type="text"
              value={formData.flightNumber}
              onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
              placeholder="e.g., KL1234"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
            Pickup Location *
          </label>
          <select
            value={formData.pickupLocation}
            onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="airport" className="bg-slate-800">Airport Arrivals</option>
            <option value="hotel" className="bg-slate-800">Hotel</option>
            <option value="custom" className="bg-slate-800">Custom Address</option>
          </select>
        </div>

        {formData.pickupLocation === 'custom' && (
          <div>
            <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
              Pickup Address *
            </label>
            <input
              type="text"
              value={formData.pickupAddress}
              onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
              placeholder="Enter pickup address"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
            Drop-off Address *
          </label>
          <input
            type="text"
            value={formData.dropoffAddress}
            onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})}
            placeholder="Enter destination address"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
              Passengers
            </label>
            <select
              value={formData.passengers}
              onChange={(e) => setFormData({...formData, passengers: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {[1,2,3,4,5,6,7,8].map(num => (
                <option key={num} value={num} className="bg-slate-800">{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">Luggage</label>
            <select
              value={formData.luggage}
              onChange={(e) => setFormData({...formData, luggage: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {[0,1,2,3,4,5,6].map(num => (
                <option key={num} value={num} className="bg-slate-800">{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">
            <Car className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
            Select Vehicle *
          </label>
          <select
            value={formData.vehicleType}
            onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {VEHICLE_OPTIONS.map(vehicle => (
              <option key={vehicle.value} value={vehicle.value} className="bg-slate-800">
                {vehicle.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-white/10">
          <label className="flex items-center justify-between cursor-pointer mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-white text-xs sm:text-sm font-medium">Have a Better Rate?</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.useCustomRate}
                onChange={(e) => setFormData({...formData, useCustomRate: e.target.checked, customRate: ''})}
                className="sr-only peer"
              />
              <div className="w-10 h-5 sm:w-11 sm:h-6 bg-white/20 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
          {formData.useCustomRate && (
            <div className="animate-fadeIn">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.customRate}
                onChange={(e) => setFormData({...formData, customRate: e.target.value})}
                placeholder="Enter your rate (USD)"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              <p className="text-green-400 text-[10px] mt-1.5">Enter the rate you found elsewhere and we'll match it!</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-white text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5">Special Requests (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            rows={2}
            placeholder="Child seat, wheelchair access, etc."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-white/10">
        <div className="flex justify-between items-center text-white">
          <span className="text-sm sm:text-base font-semibold">Total Price:</span>
          <span className="text-lg sm:text-xl font-bold">${calculateTotal().toFixed(2)}</span>
        </div>
        <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">
          {formData.useCustomRate && formData.customRate ? (
            <span className="text-green-400">Custom rate applied</span>
          ) : (
            <>
              {formData.vehicleType} - {formData.isRoundTrip ? 'Round trip (x1.9)' : 'One-way'}
            </>
          )}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm"
        >
          Back
        </button>
        <button
          onClick={() => onNext({
            ...formData,
            totalPrice: calculateTotal(),
            quantity: formData.passengers,
            tripType: formData.isRoundTrip ? 'round_trip' : 'one_way',
            vehicleType: formData.vehicleType,
            customRate: formData.useCustomRate ? parseFloat(formData.customRate) : null,
            priceSource: formData.useCustomRate ? 'custom' : 'standard'
          })}
          disabled={!isValid || (formData.useCustomRate && (!formData.customRate || parseFloat(formData.customRate) <= 0))}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
