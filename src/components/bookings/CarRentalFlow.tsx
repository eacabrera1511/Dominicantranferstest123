import { useState } from 'react';
import { Car, Calendar, MapPin, Shield } from 'lucide-react';

interface CarRentalFlowProps {
  service: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function CarRentalFlow({ service, onNext, onBack }: CarRentalFlowProps) {
  const [formData, setFormData] = useState({
    pickupDate: '',
    pickupTime: '09:00',
    returnDate: '',
    returnTime: '09:00',
    pickupLocation: '',
    returnLocation: '',
    sameLocation: true,
    insurance: 'basic',
    driverAge: '25-65',
    gps: false,
    childSeat: false,
    additionalDriver: false,
    specialRequests: ''
  });

  const calculateDays = () => {
    if (!formData.pickupDate || !formData.returnDate) return 0;
    const pickup = new Date(formData.pickupDate);
    const returnD = new Date(formData.returnDate);
    return Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    const days = calculateDays();
    let total = service.price * days;

    if (formData.insurance === 'premium') total += days * 15;
    else if (formData.insurance === 'full') total += days * 25;

    if (formData.gps) total += days * 5;
    if (formData.childSeat) total += days * 8;
    if (formData.additionalDriver) total += 30;

    return total;
  };

  const isValid = formData.pickupDate && formData.returnDate && formData.pickupLocation &&
                  (formData.sameLocation || formData.returnLocation) && calculateDays() > 0;

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
          <Car className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-slate-400" />
        </div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Car Rental Details</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">{service.name}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Pickup Date *
            </label>
            <input
              type="date"
              value={formData.pickupDate}
              onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Pickup Time</label>
            <input
              type="time"
              value={formData.pickupTime}
              onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Return Date *
            </label>
            <input
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
              min={formData.pickupDate || new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Return Time</label>
            <input
              type="time"
              value={formData.returnTime}
              onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {calculateDays() > 0 && (
          <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-3 text-center">
            <p className="text-slate-300 text-sm sm:text-base font-medium">
              {calculateDays()} {calculateDays() === 1 ? 'Day' : 'Days'}
            </p>
          </div>
        )}

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Pickup Location *
          </label>
          <input
            type="text"
            value={formData.pickupLocation}
            onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
            placeholder="Enter pickup address"
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
          <input
            type="checkbox"
            id="sameLocation"
            checked={formData.sameLocation}
            onChange={(e) => setFormData({...formData, sameLocation: e.target.checked})}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
          <label htmlFor="sameLocation" className="text-white text-sm sm:text-base cursor-pointer">
            Return to same location
          </label>
        </div>

        {!formData.sameLocation && (
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Return Location *
            </label>
            <input
              type="text"
              value={formData.returnLocation}
              onChange={(e) => setFormData({...formData, returnLocation: e.target.value})}
              placeholder="Enter return address"
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Insurance Coverage
          </label>
          <select
            value={formData.insurance}
            onChange={(e) => setFormData({...formData, insurance: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="basic" className="bg-slate-800">Basic (Included)</option>
            <option value="premium" className="bg-slate-800">Premium (+$15/day)</option>
            <option value="full" className="bg-slate-800">Full Coverage (+$25/day)</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Driver Age</label>
          <select
            value={formData.driverAge}
            onChange={(e) => setFormData({...formData, driverAge: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="21-24" className="bg-slate-800">21-24 years (Young driver fee may apply)</option>
            <option value="25-65" className="bg-slate-800">25-65 years</option>
            <option value="65+" className="bg-slate-800">65+ years</option>
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-white text-xs sm:text-sm font-medium mb-2">Additional Options</p>

          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gps"
                checked={formData.gps}
                onChange={(e) => setFormData({...formData, gps: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <label htmlFor="gps" className="text-white text-sm cursor-pointer">GPS Navigation</label>
            </div>
            <span className="text-gray-400 text-sm">+$5/day</span>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="childSeat"
                checked={formData.childSeat}
                onChange={(e) => setFormData({...formData, childSeat: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <label htmlFor="childSeat" className="text-white text-sm cursor-pointer">Child Seat</label>
            </div>
            <span className="text-gray-400 text-sm">+$8/day</span>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="additionalDriver"
                checked={formData.additionalDriver}
                onChange={(e) => setFormData({...formData, additionalDriver: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
              <label htmlFor="additionalDriver" className="text-white text-sm cursor-pointer">Additional Driver</label>
            </div>
            <span className="text-gray-400 text-sm">+$30</span>
          </div>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Special Requests (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            rows={2}
            placeholder="Any special requests..."
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Car rental ({calculateDays()} days)</span>
            <span>${service.price * calculateDays()}</span>
          </div>
          {formData.insurance !== 'basic' && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.insurance === 'premium' ? 'Premium' : 'Full'} insurance</span>
              <span>+${(formData.insurance === 'premium' ? 15 : 25) * calculateDays()}</span>
            </div>
          )}
          {formData.gps && (
            <div className="flex justify-between text-gray-300">
              <span>GPS</span>
              <span>+${5 * calculateDays()}</span>
            </div>
          )}
          {formData.childSeat && (
            <div className="flex justify-between text-gray-300">
              <span>Child seat</span>
              <span>+${8 * calculateDays()}</span>
            </div>
          )}
          {formData.additionalDriver && (
            <div className="flex justify-between text-gray-300">
              <span>Additional driver</span>
              <span>+$30</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-base sm:text-lg">
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
            days: calculateDays(),
            totalPrice: calculateTotal(),
            quantity: calculateDays()
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