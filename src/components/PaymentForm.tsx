import { useState } from 'react';
import { CreditCard, Shield, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export function PaymentForm({ amount, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'ideal' | 'card'>('ideal');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [selectedBank, setSelectedBank] = useState('');

  const idealBanks = [
    { id: 'ing', name: 'ING Bank', logo: '🏦' },
    { id: 'rabobank', name: 'Rabobank', logo: '🏦' },
    { id: 'abn', name: 'ABN AMRO', logo: '🏦' },
    { id: 'sns', name: 'SNS Bank', logo: '🏦' },
    { id: 'asn', name: 'ASN Bank', logo: '🏦' },
    { id: 'bunq', name: 'bunq', logo: '🏦' },
    { id: 'knab', name: 'Knab', logo: '🏦' },
    { id: 'triodos', name: 'Triodos Bank', logo: '🏦' }
  ];

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (paymentMethod === 'ideal') {
        if (!selectedBank) {
          throw new Error('Please select your bank');
        }
        // Simulate iDEAL payment
        const paymentId = 'ideal_' + Math.random().toString(36).substr(2, 9);
        onPaymentSuccess(paymentId);
      } else {
        // Simulate card payment
        if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
          throw new Error('Please fill in all card details');
        }
        const paymentId = 'card_' + Math.random().toString(36).substr(2, 9);
        onPaymentSuccess(paymentId);
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h4 className="text-white font-semibold">Select Payment Method</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('ideal')}
            className={`p-4 rounded-xl border transition-all ${
              paymentMethod === 'ideal'
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">
                iDEAL
              </div>
              <div className="text-white text-sm font-medium">iDEAL</div>
              <div className="text-gray-400 text-xs">Dutch banks</div>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-xl border transition-all ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-center">
              <CreditCard className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-white text-sm font-medium">Credit Card</div>
              <div className="text-gray-400 text-xs">Visa, Mastercard</div>
            </div>
          </button>
        </div>
      </div>

      {/* iDEAL Bank Selection */}
      {paymentMethod === 'ideal' && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Select Your Bank</h4>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {idealBanks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedBank === bank.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{bank.logo}</span>
                  <span className="text-white text-sm">{bank.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credit Card Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold">Card Details</h4>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">Cardholder Name</label>
            <input
              type="text"
              value={cardData.name}
              onChange={(e) => setCardData({...cardData, name: e.target.value})}
              placeholder="John Doe"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Card Number</label>
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Expiry Date</label>
              <input
                type="text"
                value={cardData.expiry}
                onChange={(e) => setCardData({...cardData, expiry: formatExpiry(e.target.value)})}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">CVV</label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4)})}
                placeholder="123"
                maxLength={4}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-green-400 font-medium text-sm">Secure Payment</div>
            <div className="text-green-300 text-xs">Your payment is protected by 256-bit SSL encryption</div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || (paymentMethod === 'ideal' && !selectedBank) || (paymentMethod === 'card' && (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name))}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay €{amount.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}