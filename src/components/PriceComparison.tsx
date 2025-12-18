import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CompetitorPrice {
  name: string;
  logo: string;
  price: number;
}

interface PriceComparisonProps {
  basePrice: number;
  competitors: CompetitorPrice[];
  route: string;
  onBookNow: () => void;
  onPriceMatch: (price: number) => void;
}

export function PriceComparison({ basePrice, competitors, route, onBookNow, onPriceMatch }: PriceComparisonProps) {
  const [showPriceMatch, setShowPriceMatch] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [error, setError] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  useEffect(() => {
    const fetchDiscount = async () => {
      const { data } = await supabase
        .from('global_discount_settings')
        .select('discount_percentage')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDiscountPercentage(Number(data.discount_percentage) || 0);
      }
    };

    fetchDiscount();
  }, []);

  const allPrices = [
    ...competitors,
    { name: 'Dominican Transfers', logo: '🚕', price: basePrice }
  ].sort((a, b) => a.price - b.price);

  const handlePriceMatchSubmit = () => {
    const price = parseFloat(customPrice);

    if (!customPrice || isNaN(price)) {
      setError('Please enter a valid price');
      return;
    }

    if (price <= 0) {
      setError('Price must be greater than $0');
      return;
    }

    onPriceMatch(price);
  };

  if (showPriceMatch) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 shadow-lg border border-yellow-300 dark:border-yellow-700">
        <div className="text-center mb-3 xs:mb-4 sm:mb-5 md:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-yellow-500 rounded-full mb-2 sm:mb-3">
            <span className="text-xl xs:text-2xl sm:text-2xl md:text-3xl">💰</span>
          </div>
          <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 px-2">
            Price Match Request
          </h3>
          <p className="text-[11px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            We'll match any legitimate competitor price
          </p>
        </div>

        <div className="space-y-2.5 xs:space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[11px] xs:text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2">
              Enter the price you found (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customPrice}
              onChange={(e) => {
                setCustomPrice(e.target.value);
                setError('');
              }}
              placeholder="e.g., 145.00"
              className="w-full px-3 xs:px-3 sm:px-4 py-2 xs:py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm xs:text-base sm:text-lg font-semibold focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            {error && (
              <p className="mt-1.5 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-2.5 xs:p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
              <strong>Note:</strong> Please provide the competitor name and booking details after completing your reservation.
            </p>
          </div>

          <div className="flex flex-col xs:flex-col sm:flex-row gap-2 xs:gap-2 sm:gap-3">
            <button
              onClick={handlePriceMatchSubmit}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg active:scale-98"
            >
              Continue with ${customPrice || '0'}
            </button>
            <button
              onClick={() => setShowPriceMatch(false)}
              className="px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-98"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 shadow-lg border border-green-300 dark:border-green-700">
      <div className="text-center mb-3 xs:mb-4 sm:mb-5 md:mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-500 rounded-full mb-2 sm:mb-3">
          <span className="text-xl xs:text-2xl sm:text-2xl md:text-3xl">✓</span>
        </div>
        <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 px-2">
          Price Comparison Complete
        </h3>
        <p className="text-[11px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 line-clamp-2">
          {route}
        </p>
      </div>

      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 mb-3 xs:mb-4 sm:mb-5 md:mb-6">
        {allPrices.map((item, index) => {
          const isOurs = item.name === 'Dominican Transfers';
          const isBest = index === 0;

          return (
            <div
              key={item.name}
              className={`rounded-lg sm:rounded-xl p-2.5 xs:p-3 sm:p-4 transition-all duration-300 ${
                isOurs
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg xs:shadow-xl sm:scale-105 border-2 border-green-400'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 xs:gap-2 sm:gap-3">
                <div className="flex items-center gap-2 xs:gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base xs:text-xl sm:text-2xl flex-shrink-0 ${
                    isOurs ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {item.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs xs:text-sm sm:text-base font-semibold truncate ${
                      isOurs ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.name}
                    </p>
                    {isBest && (
                      <p className={`text-[10px] xs:text-xs font-medium ${
                        isOurs ? 'text-green-100' : 'text-green-600 dark:text-green-400'
                      }`}>
                        ⭐ Best Price
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap ${
                    isOurs ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    ${item.price}
                  </p>
                  {!isOurs && (
                    <p className="text-[10px] xs:text-xs text-red-600 dark:text-red-400 font-medium">
                      +${item.price - basePrice} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-5 border-2 border-green-500 mb-3 xs:mb-4 sm:mb-5 md:mb-6">
        <div className="text-center">
          <p className="text-[11px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 px-2">
            We currently offer the <strong className="text-green-600 dark:text-green-400">lowest verified price</strong> at
          </p>
          <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2 sm:mb-3">
            ${basePrice}
          </p>
          {discountPercentage > 0 && (
            <div className="mb-2 sm:mb-3">
              <p className="text-[11px] xs:text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 px-2">
                🔥 {discountPercentage}% DISCOUNT APPLIED!
              </p>
              <p className="text-[10px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 px-2 mt-1">
                Original price: <span className="line-through">${Math.round(basePrice / (1 - (discountPercentage / 100)))}</span>
              </p>
            </div>
          )}
          <p className="text-[11px] xs:text-xs sm:text-sm font-semibold text-gray-900 dark:text-white px-2">
            Would you like to book now at this price?
          </p>
        </div>
      </div>

      <div className="space-y-2 xs:space-y-2 sm:space-y-3">
        <button
          onClick={onBookNow}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm xs:text-base sm:text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98"
        >
          <span>✓</span>
          <span className="truncate">Yes, Book at ${basePrice}</span>
        </button>

        <button
          onClick={() => setShowPriceMatch(true)}
          className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <span>🔁</span>
          <span className="truncate">I Found a Lower Price</span>
        </button>
      </div>

      <div className="mt-3 xs:mt-3 sm:mt-4 text-center">
        <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 px-2">
          🛡️ Best Price Guaranteed | 💯 Verified Market Rates
          {discountPercentage > 0 && <span className="block text-amber-600 dark:text-amber-400 font-semibold mt-1">⚡ Limited Time: {discountPercentage}% OFF All Services!</span>}
        </p>
      </div>
    </div>
  );
}
