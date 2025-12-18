import { useState } from 'react';
import { CreditCard, Building2, Check, Lock } from 'lucide-react';

interface PaymentStepProps {
  item: any;
  bookingDetails: any;
  totalPrice: number;
  onBack: () => void;
  onComplete: (paymentData: any) => void;
  loading: boolean;
}

export function PaymentStep({ item, bookingDetails, totalPrice, onBack, onComplete, loading }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<'ideal' | 'card'>('ideal');
  const [idealBank, setIdealBank] = useState('');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const dutchBanks = [
    'ABN AMRO',
    'ASN Bank',
    'Bunq',
    'ING',
    'Knab',
    'Rabobank',
    'RegioBank',
    'SNS Bank',
    'Triodos Bank',
    'Van Lanschot'
  ];

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const isIdealValid = paymentMethod === 'ideal' && idealBank !== '';
  const isCardValid = paymentMethod === 'card' &&
                      cardData.cardNumber.replace(/\s/g, '').length === 16 &&
                      cardData.cardHolder.length > 0 &&
                      cardData.expiryDate.length === 5 &&
                      cardData.cvv.length === 3;

  const handleSubmit = () => {
    if (paymentMethod === 'ideal' && isIdealValid) {
      onComplete({
        method: 'ideal',
        bank: idealBank,
        details: { bank: idealBank }
      });
    } else if (paymentMethod === 'card' && isCardValid) {
      onComplete({
        method: 'card',
        cardLast4: cardData.cardNumber.replace(/\s/g, '').slice(-4),
        details: {
          last4: cardData.cardNumber.replace(/\s/g, '').slice(-4),
          cardHolder: cardData.cardHolder
        }
      });
    }
  };

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl xs:rounded-2xl flex items-center justify-center mx-auto mb-2 xs:mb-3 sm:mb-4">
          <Lock className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-green-400" />
        </div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1 xs:mb-2">Secure Payment</h3>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base">Choose your payment method</p>
      </div>

      <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/10">
        <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Booking Summary</h4>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between text-gray-300 text-sm sm:text-base">
            <span className="truncate pr-2">{item.name}</span>
            <span className="flex-shrink-0 font-medium">${totalPrice}</span>
          </div>
          <div className="border-t border-white/10 pt-2 sm:pt-3 flex justify-between text-white font-bold text-base sm:text-lg">
            <span>Total Amount</span>
            <span>${totalPrice}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">Payment Method</h4>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('ideal')}
            className={`w-full text-left transition-all duration-300 ${
              paymentMethod === 'ideal'
                ? 'bg-blue-500/20 border-2 border-blue-500'
                : 'bg-white/10 border border-white/20 hover:bg-white/15'
            } rounded-lg sm:rounded-xl p-3 sm:p-4`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                iDEAL
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm sm:text-base">iDEAL</div>
                <div className="text-gray-400 text-xs sm:text-sm">Pay securely with your Dutch bank</div>
              </div>
              {paymentMethod === 'ideal' && (
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`w-full text-left transition-all duration-300 ${
              paymentMethod === 'card'
                ? 'bg-blue-500/20 border-2 border-blue-500'
                : 'bg-white/10 border border-white/20 hover:bg-white/15'
            } rounded-lg sm:rounded-xl p-3 sm:p-4`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm sm:text-base">Credit/Debit Card</div>
                <div className="text-gray-400 text-xs sm:text-sm">Visa, Mastercard, American Express</div>
              </div>
              {paymentMethod === 'card' && (
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>
          </button>
        </div>
      </div>

      {paymentMethod === 'ideal' && (
        <div className="space-y-3 sm:space-y-4 animate-fadeIn">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Select Your Bank *
            </label>
            <select
              value={idealBank}
              onChange={(e) => setIdealBank(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="" className="bg-slate-800">Choose your bank</option>
              {dutchBanks.map((bank) => (
                <option key={bank} value={bank} className="bg-slate-800">{bank}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
            <p className="text-blue-300 text-xs sm:text-sm">
              You will be redirected to your bank to complete the payment securely.
            </p>
          </div>
        </div>
      )}

      {paymentMethod === 'card' && (
        <div className="space-y-3 sm:space-y-4 animate-fadeIn">
          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Card Number *
            </label>
            <input
              type="text"
              value={cardData.cardNumber}
              onChange={(e) => setCardData({...cardData, cardNumber: formatCardNumber(e.target.value)})}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-xs sm:text-sm font-medium mb-2">Cardholder Name *</label>
            <input
              type="text"
              value={cardData.cardHolder}
              onChange={(e) => setCardData({...cardData, cardHolder: e.target.value.toUpperCase()})}
              placeholder="JOHN DOE"
              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-2">Expiry Date *</label>
              <input
                type="text"
                value={cardData.expiryDate}
                onChange={(e) => setCardData({...cardData, expiryDate: formatExpiryDate(e.target.value)})}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-2">CVV *</label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 3)})}
                placeholder="123"
                maxLength={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 flex items-start gap-2">
            <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-xs sm:text-sm">
              Your payment information is encrypted and secure.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent -mx-4 xs:-mx-5 sm:-mx-8 px-4 xs:px-5 sm:px-8 pb-1">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 disabled:bg-white/5 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 text-xs xs:text-sm sm:text-base disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || (paymentMethod === 'ideal' ? !isIdealValid : !isCardValid)}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 xs:py-3 sm:py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 xs:gap-2 text-xs xs:text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden xs:inline">Processing...</span>
              <span className="xs:hidden">Wait...</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              <span>Pay secure</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}