import { useState } from 'react';
import { Hotel, Calendar, Users, Bed } from 'lucide-react';

interface HotelBookingFlowProps {
  hotel: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function HotelBookingFlow({ hotel, onNext, onBack }: HotelBookingFlowProps) {
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    rooms: 1,
    roomType: 'standard',
    specialRequests: ''
  });

  const calculateNights = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    return Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = hotel.price_per_night * formData.rooms;
    const roomTypeMultiplier = formData.roomType === 'deluxe' ? 1.3 : formData.roomType === 'suite' ? 1.6 : 1;
    return nights > 0 ? Math.round(nights * basePrice * roomTypeMultiplier) : 0;
  };

  const isValid = formData.checkInDate && formData.checkOutDate && calculateNights() > 0;

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
          <Hotel className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-blue-400" />
        </div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Hotel Booking Details</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">{hotel.name}</p>
        <p className="text-gray-400 text-[11px] xs:text-xs sm:text-sm">{hotel.location}, {hotel.country}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Check-in Date *
            </label>
            <input
              type="date"
              value={formData.checkInDate}
              onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Check-out Date *
            </label>
            <input
              type="date"
              value={formData.checkOutDate}
              onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})}
              min={formData.checkInDate || new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {calculateNights() > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <p className="text-blue-300 text-sm sm:text-base font-medium">
              {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Guests
            </label>
            <select
              value={formData.guests}
              onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {[1,2,3,4,5,6,7,8].map(num => (
                <option key={num} value={num} className="bg-slate-800">{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Rooms
            </label>
            <select
              value={formData.rooms}
              onChange={(e) => setFormData({...formData, rooms: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {[1,2,3,4,5].map(num => (
                <option key={num} value={num} className="bg-slate-800">{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Room Type</label>
          <select
            value={formData.roomType}
            onChange={(e) => setFormData({...formData, roomType: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="standard" className="bg-slate-800">Standard Room</option>
            <option value="deluxe" className="bg-slate-800">Deluxe Room (+30%)</option>
            <option value="suite" className="bg-slate-800">Suite (+60%)</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Special Requests (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            rows={3}
            placeholder="Early check-in, high floor, etc."
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
        <div className="space-y-2 text-sm sm:text-base">
          <div className="flex justify-between text-gray-300">
            <span>${hotel.price_per_night} × {calculateNights()} nights × {formData.rooms} room(s)</span>
            <span>${hotel.price_per_night * calculateNights() * formData.rooms}</span>
          </div>
          {formData.roomType !== 'standard' && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.roomType === 'deluxe' ? 'Deluxe' : 'Suite'} upgrade</span>
              <span>+{formData.roomType === 'deluxe' ? '30%' : '60%'}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-lg sm:text-xl">
            <span>Total:</span>
            <span>${calculateTotal()}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent -mx-4 xs:-mx-5 sm:-mx-8 px-4 xs:px-5 sm:px-8 pb-1">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 text-xs xs:text-sm sm:text-base"
        >
          Back
        </button>
        <button
          onClick={() => onNext({
            ...formData,
            nights: calculateNights(),
            totalPrice: calculateTotal(),
            quantity: calculateNights()
          })}
          disabled={!isValid}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base"
        >
          Continue
        </button>
      </div>
    </div>
  );
}