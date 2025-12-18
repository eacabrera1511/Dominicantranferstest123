import { useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';

interface CustomerInfoStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function CustomerInfoStep({ onNext, onBack }: CustomerInfoStepProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: ''
  });

  const isValid = formData.customerName && formData.customerEmail && formData.customerPhone;

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Your Contact Details</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">Please provide your contact information</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            placeholder="Enter your full name"
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            placeholder="your.email@example.com"
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
            placeholder="+31 6 1234 5678"
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-white text-xs sm:text-sm font-medium mb-2">Additional Notes (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            rows={3}
            placeholder="Any additional information or special requests..."
            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <p className="text-blue-300 text-xs sm:text-sm">
          We'll send your booking confirmation and important updates to this email address.
        </p>
      </div>

      <div className="flex gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent -mx-4 xs:-mx-5 sm:-mx-8 px-4 xs:px-5 sm:px-8 pb-1">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 text-xs xs:text-sm sm:text-base"
        >
          Back
        </button>
        <button
          onClick={() => onNext(formData)}
          disabled={!isValid}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base"
        >
          <span className="hidden xs:inline">Continue to Payment</span>
          <span className="xs:hidden">Continue</span>
        </button>
      </div>
    </div>
  );
}