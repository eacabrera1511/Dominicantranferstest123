import { useState } from 'react';
import { Plane, Calendar, Users, Luggage } from 'lucide-react';

interface FlightBookingFlowProps {
  service: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function FlightBookingFlow({ service, onNext, onBack }: FlightBookingFlowProps) {
  const [formData, setFormData] = useState({
    tripType: 'round-trip',
    departureDate: '',
    returnDate: '',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    travelClass: 'economy',
    directFlightOnly: false,
    baggageOptions: {
      checkedBags: 0,
      carryOn: 1
    },
    seatPreference: 'no-preference',
    mealPreference: 'standard',
    specialRequests: ''
  });

  const calculateTotal = () => {
    const totalPassengers = formData.passengers.adults + formData.passengers.children;
    let basePrice = service.price * totalPassengers;

    if (formData.tripType === 'round-trip') {
      basePrice *= 2;
    }

    const classMultiplier = {
      'economy': 1,
      'premium-economy': 1.5,
      'business': 2.5,
      'first': 4
    }[formData.travelClass];

    basePrice *= classMultiplier;

    const baggageCost = formData.baggageOptions.checkedBags * 50 * (formData.tripType === 'round-trip' ? 2 : 1);
    const extraCarryOnCost = Math.max(0, formData.baggageOptions.carryOn - 1) * 30 * (formData.tripType === 'round-trip' ? 2 : 1);

    return Math.round(basePrice + baggageCost + extraCarryOnCost);
  };

  const totalPassengers = formData.passengers.adults + formData.passengers.children + formData.passengers.infants;
  const isValid = formData.departureDate &&
                  (formData.tripType === 'one-way' || formData.returnDate) &&
                  totalPassengers > 0;

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
          <Plane className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-orange-400" />
        </div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Flight Booking Details</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">{service.name}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Trip Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({...formData, tripType: 'round-trip'})}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                formData.tripType === 'round-trip'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              Round Trip
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, tripType: 'one-way'})}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                formData.tripType === 'one-way'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              One Way
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Departure Date *
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {formData.tripType === 'round-trip' && (
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                Return Date *
              </label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                min={formData.departureDate || new Date().toISOString().split('T')[0]}
                className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-3">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Passengers *
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white text-sm">Adults (12+)</p>
              <select
                value={formData.passengers.adults}
                onChange={(e) => setFormData({
                  ...formData,
                  passengers: {...formData.passengers, adults: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white text-sm">Children (2-11)</p>
              <select
                value={formData.passengers.children}
                onChange={(e) => setFormData({
                  ...formData,
                  passengers: {...formData.passengers, children: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[0,1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <div>
                <p className="text-white text-sm">Infants (under 2)</p>
                <p className="text-gray-400 text-xs">On lap</p>
              </div>
              <select
                value={formData.passengers.infants}
                onChange={(e) => setFormData({
                  ...formData,
                  passengers: {...formData.passengers, infants: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[0,1,2,3,4].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Travel Class</label>
          <select
            value={formData.travelClass}
            onChange={(e) => setFormData({...formData, travelClass: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="economy" className="bg-slate-800">Economy</option>
            <option value="premium-economy" className="bg-slate-800">Premium Economy (+50%)</option>
            <option value="business" className="bg-slate-800">Business Class (+150%)</option>
            <option value="first" className="bg-slate-800">First Class (+300%)</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-3">
            <Luggage className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Baggage Options
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <div>
                <p className="text-white text-sm">Checked Bags</p>
                <p className="text-gray-400 text-xs">$50 per bag</p>
              </div>
              <select
                value={formData.baggageOptions.checkedBags}
                onChange={(e) => setFormData({
                  ...formData,
                  baggageOptions: {...formData.baggageOptions, checkedBags: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[0,1,2,3,4,5].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <div>
                <p className="text-white text-sm">Carry-on Bags</p>
                <p className="text-gray-400 text-xs">1st free, +$30 each extra</p>
              </div>
              <select
                value={formData.baggageOptions.carryOn}
                onChange={(e) => setFormData({
                  ...formData,
                  baggageOptions: {...formData.baggageOptions, carryOn: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[1,2,3].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Seat Preference</label>
            <select
              value={formData.seatPreference}
              onChange={(e) => setFormData({...formData, seatPreference: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="no-preference" className="bg-slate-800">No Preference</option>
              <option value="window" className="bg-slate-800">Window</option>
              <option value="aisle" className="bg-slate-800">Aisle</option>
              <option value="middle" className="bg-slate-800">Middle</option>
            </select>
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Meal Preference</label>
            <select
              value={formData.mealPreference}
              onChange={(e) => setFormData({...formData, mealPreference: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="standard" className="bg-slate-800">Standard</option>
              <option value="vegetarian" className="bg-slate-800">Vegetarian</option>
              <option value="vegan" className="bg-slate-800">Vegan</option>
              <option value="gluten-free" className="bg-slate-800">Gluten Free</option>
              <option value="kosher" className="bg-slate-800">Kosher</option>
              <option value="halal" className="bg-slate-800">Halal</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
          <input
            type="checkbox"
            id="directFlightOnly"
            checked={formData.directFlightOnly}
            onChange={(e) => setFormData({...formData, directFlightOnly: e.target.checked})}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
          <label htmlFor="directFlightOnly" className="text-white text-sm cursor-pointer">
            Direct flights only (may affect availability)
          </label>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Special Requests (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            rows={2}
            placeholder="Wheelchair assistance, special meals, etc."
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Base fare ({formData.passengers.adults + formData.passengers.children} passenger{(formData.passengers.adults + formData.passengers.children) !== 1 ? 's' : ''})</span>
            <span>${service.price * (formData.passengers.adults + formData.passengers.children) * (formData.tripType === 'round-trip' ? 2 : 1)}</span>
          </div>
          {formData.travelClass !== 'economy' && (
            <div className="flex justify-between text-gray-300">
              <span className="capitalize">{formData.travelClass.replace('-', ' ')} upgrade</span>
              <span>
                +{formData.travelClass === 'premium-economy' ? '50%' : formData.travelClass === 'business' ? '150%' : '300%'}
              </span>
            </div>
          )}
          {formData.baggageOptions.checkedBags > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.baggageOptions.checkedBags} checked bag{formData.baggageOptions.checkedBags !== 1 ? 's' : ''}</span>
              <span>+${formData.baggageOptions.checkedBags * 50 * (formData.tripType === 'round-trip' ? 2 : 1)}</span>
            </div>
          )}
          {formData.baggageOptions.carryOn > 1 && (
            <div className="flex justify-between text-gray-300">
              <span>Extra carry-on</span>
              <span>+${(formData.baggageOptions.carryOn - 1) * 30 * (formData.tripType === 'round-trip' ? 2 : 1)}</span>
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
            totalPrice: calculateTotal(),
            quantity: totalPassengers
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