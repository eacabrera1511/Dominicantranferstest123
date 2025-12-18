import { useState } from 'react';
import { Ticket, Calendar, Users, Clock } from 'lucide-react';

interface TourActivityFlowProps {
  service: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function TourActivityFlow({ service, onNext, onBack }: TourActivityFlowProps) {
  const [formData, setFormData] = useState({
    activityDate: '',
    timeSlot: 'morning',
    participants: 1,
    ageGroups: {
      adults: 1,
      children: 0,
      infants: 0
    },
    pickupRequired: false,
    pickupLocation: '',
    dietaryRestrictions: '',
    specialRequests: ''
  });

  const calculateTotal = () => {
    const adultPrice = service.price;
    const childPrice = service.price * 0.7;
    const infantPrice = 0;

    return Math.round(
      (formData.ageGroups.adults * adultPrice) +
      (formData.ageGroups.children * childPrice) +
      (formData.ageGroups.infants * infantPrice) +
      (formData.pickupRequired ? 20 : 0)
    );
  };

  const totalParticipants = formData.ageGroups.adults + formData.ageGroups.children + formData.ageGroups.infants;
  const isValid = formData.activityDate && totalParticipants > 0;

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
          <Ticket className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-green-400" />
        </div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Activity Details</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">{service.name}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Activity Date *
          </label>
          <input
            type="date"
            value={formData.activityDate}
            onChange={(e) => setFormData({...formData, activityDate: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Preferred Time Slot
          </label>
          <select
            value={formData.timeSlot}
            onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="morning" className="bg-slate-800">Morning (8:00 AM - 12:00 PM)</option>
            <option value="afternoon" className="bg-slate-800">Afternoon (12:00 PM - 5:00 PM)</option>
            <option value="evening" className="bg-slate-800">Evening (5:00 PM - 9:00 PM)</option>
            <option value="full-day" className="bg-slate-800">Full Day</option>
          </select>
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-3">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Participants *
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">Adults (13+)</p>
                <p className="text-gray-400 text-xs">${service.price} per person</p>
              </div>
              <select
                value={formData.ageGroups.adults}
                onChange={(e) => setFormData({
                  ...formData,
                  ageGroups: {...formData.ageGroups, adults: parseInt(e.target.value)}
                })}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num} className="bg-slate-800">{num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">Children (3-12)</p>
                <p className="text-gray-400 text-xs">${Math.round(service.price * 0.7)} per child (30% off)</p>
              </div>
              <select
                value={formData.ageGroups.children}
                onChange={(e) => setFormData({
                  ...formData,
                  ageGroups: {...formData.ageGroups, children: parseInt(e.target.value)}
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
                <p className="text-white text-sm font-medium">Infants (0-2)</p>
                <p className="text-gray-400 text-xs">Free</p>
              </div>
              <select
                value={formData.ageGroups.infants}
                onChange={(e) => setFormData({
                  ...formData,
                  ageGroups: {...formData.ageGroups, infants: parseInt(e.target.value)}
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

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pickupRequired"
              checked={formData.pickupRequired}
              onChange={(e) => setFormData({...formData, pickupRequired: e.target.checked})}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
            />
            <label htmlFor="pickupRequired" className="text-white text-sm cursor-pointer flex-1">
              Hotel pickup service (+$20)
            </label>
          </div>
        </div>

        {formData.pickupRequired && (
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Pickup Location *</label>
            <input
              type="text"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
              placeholder="Enter your hotel address"
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Dietary Restrictions (Optional)</label>
          <input
            type="text"
            value={formData.dietaryRestrictions}
            onChange={(e) => setFormData({...formData, dietaryRestrictions: e.target.value})}
            placeholder="Vegetarian, vegan, allergies, etc."
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
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
          {formData.ageGroups.adults > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.ageGroups.adults} Adult{formData.ageGroups.adults !== 1 ? 's' : ''}</span>
              <span>${service.price * formData.ageGroups.adults}</span>
            </div>
          )}
          {formData.ageGroups.children > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.ageGroups.children} Child{formData.ageGroups.children !== 1 ? 'ren' : ''}</span>
              <span>${Math.round(service.price * 0.7) * formData.ageGroups.children}</span>
            </div>
          )}
          {formData.ageGroups.infants > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>{formData.ageGroups.infants} Infant{formData.ageGroups.infants !== 1 ? 's' : ''}</span>
              <span>Free</span>
            </div>
          )}
          {formData.pickupRequired && (
            <div className="flex justify-between text-gray-300">
              <span>Hotel pickup</span>
              <span>+$20</span>
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
            quantity: totalParticipants
          })}
          disabled={!isValid || (formData.pickupRequired && !formData.pickupLocation)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base"
        >
          Continue
        </button>
      </div>
    </div>
  );
}