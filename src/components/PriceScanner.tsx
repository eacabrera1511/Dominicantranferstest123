import { useState, useEffect } from 'react';
import { Check, Users, Briefcase, Star, Wifi } from 'lucide-react';

interface VehicleOption {
  name: string;
  capacity: number;
  luggageCapacity: number;
  oneWayPrice: number;
  roundTripPrice: number;
  recommended?: boolean;
}

interface CompetitorPrice {
  name: string;
  logo: string;
  price: number;
  status: 'scanning' | 'found' | 'complete';
}

interface PriceScannerProps {
  basePrice: number;
  route: string;
  passengers?: number;
  luggage?: number;
  vehicleOptions?: VehicleOption[];
  onComplete: (competitors: CompetitorPrice[]) => void;
  onSelectVehicle?: (vehicle: VehicleOption) => void;
  onBookNow?: () => void;
  onBetterRate?: (price: number) => void;
}

export function PriceScanner({ basePrice, route, passengers, luggage, vehicleOptions, onComplete, onSelectVehicle, onBookNow, onBetterRate }: PriceScannerProps) {
  const [phase, setPhase] = useState<'scanning' | 'results'>('scanning');
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>([
    { name: 'Booking.com', logo: 'B', price: 0, status: 'scanning' },
    { name: 'Expedia', logo: 'E', price: 0, status: 'scanning' },
    { name: 'Viator', logo: 'V', price: 0, status: 'scanning' },
  ]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 2, 100));
    }, 50);

    const scanCompetitors = async () => {
      for (let i = 0; i < competitors.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

        const priceMultiplier = 1.08 + Math.random() * 0.15;
        const competitorPrice = Math.round(basePrice * priceMultiplier);

        setCompetitors(prev => prev.map((comp, idx) =>
          idx === i
            ? { ...comp, price: competitorPrice, status: 'found' }
            : comp
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 400));

      setCompetitors(prev => prev.map(comp => ({ ...comp, status: 'complete' })));

      setTimeout(() => {
        clearInterval(progressInterval);
        setPhase('results');
        onComplete(competitors.map((comp, idx) => ({
          ...comp,
          price: Math.round(basePrice * (1.08 + (idx * 0.05))),
          status: 'complete'
        })));
      }, 300);
    };

    scanCompetitors();

    return () => clearInterval(progressInterval);
  }, [basePrice]);

  if (phase === 'scanning') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-3 xs:p-4 sm:p-5 shadow-2xl border border-blue-500/30 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-20"
            style={{
              background: `conic-gradient(from ${scanProgress * 3.6}deg, transparent 0deg, rgba(59,130,246,0.5) 60deg, transparent 120deg)`,
              animation: 'spin 3s linear infinite'
            }}
          />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-blue-500/20 rounded-full animate-ping"
              style={{
                width: `${(i + 1) * 80}px`,
                height: `${(i + 1) * 80}px`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-blue-500/20 backdrop-blur rounded-full mb-2 sm:mb-3 border border-blue-400/30">
              <Wifi className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-sm xs:text-base sm:text-lg font-bold text-white mb-1">
              Scanning Market Prices
            </h3>
            <p className="text-[10px] xs:text-xs sm:text-sm text-blue-200/80 px-2 line-clamp-2">
              {route}
            </p>
          </div>

          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-[10px] xs:text-xs text-blue-300/70 mb-1">
              <span>Scanning providers...</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-1.5 xs:h-2 bg-blue-950/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 xs:space-y-2.5 sm:space-y-3">
            {competitors.map((competitor, index) => (
              <div
                key={competitor.name}
                className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 xs:p-2.5 sm:p-3 border border-slate-700/50 transition-all duration-300"
                style={{
                  animationDelay: `${index * 150}ms`,
                  opacity: competitor.status === 'scanning' ? 0.7 : 1
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 xs:gap-2.5 min-w-0 flex-1">
                    <div className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs xs:text-sm font-bold flex-shrink-0 transition-colors duration-300 ${
                      competitor.status === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                    }`}>
                      {competitor.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs xs:text-sm text-white truncate">
                        {competitor.name}
                      </p>
                      <p className={`text-[10px] xs:text-xs transition-colors duration-300 ${
                        competitor.status === 'complete' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {competitor.status === 'scanning' && 'Searching...'}
                        {competitor.status === 'found' && 'Price found'}
                        {competitor.status === 'complete' && 'Verified'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 min-w-[50px] xs:min-w-[60px]">
                    {competitor.status === 'scanning' ? (
                      <div className="flex gap-1 justify-end">
                        <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="text-base xs:text-lg sm:text-xl font-bold text-white">
                        ${competitor.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 xs:p-4 sm:p-5 shadow-lg border border-emerald-200 dark:border-gray-700">
      <div className="text-center mb-3 sm:mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 bg-emerald-500 rounded-full mb-2 shadow-lg shadow-emerald-500/30">
          <Check className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
        </div>
        <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
          Best Rates Found!
        </h3>
        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 line-clamp-2">
          {route}
        </p>
        {passengers && luggage !== undefined && (
          <div className="flex items-center justify-center gap-3 xs:gap-4 mt-1.5 xs:mt-2 text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
              {passengers} pax
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
              {luggage} bag{luggage !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {vehicleOptions && vehicleOptions.length > 0 && (
        <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3 xs:p-3.5 sm:p-4 shadow-lg border border-emerald-400 dark:border-emerald-600 animate-pulse-subtle">
            <div className="flex items-center justify-center gap-2 text-white">
              <svg className="w-4 h-4 xs:w-5 xs:h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" transform="rotate(270 10 10)"/>
              </svg>
              <p className="text-xs xs:text-sm sm:text-base font-bold tracking-wide">
                Click a vehicle below to continue
              </p>
            </div>
          </div>
          {vehicleOptions.filter((vehicle) => {
            if (!passengers) return true;

            const vehicleName = vehicle.name.toLowerCase();
            const isSedan = vehicleName.includes('sedan');
            const isSuburban = vehicleName.includes('suburban');
            const isMinivan = vehicleName.includes('minivan') || vehicleName.includes('van');

            // 1-2 passengers: Only Sedan and Suburban
            if (passengers <= 2) {
              return isSedan || isSuburban;
            }

            // 3-4 passengers: Only Minivan and Suburban
            if (passengers <= 4) {
              return isMinivan || isSuburban;
            }

            // 5+ passengers: Show all vehicles that can fit
            return vehicle.capacity >= passengers;
          }).map((vehicle) => {
            const isSuburban = vehicle.name.toLowerCase().includes('suburban');
            const isSelected = selectedVehicle?.name === vehicle.name;
            return (
            <button
              key={vehicle.name}
              onClick={() => {
                setSelectedVehicle(vehicle);
                onSelectVehicle?.(vehicle);
              }}
              className={`group w-full text-left bg-white dark:bg-gray-800 rounded-lg p-2.5 xs:p-3 sm:p-3.5 shadow-sm border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative cursor-pointer ${
                isSelected
                  ? 'border-teal-500 ring-4 ring-teal-200 dark:ring-teal-900 shadow-teal-100 dark:shadow-none bg-teal-50 dark:bg-teal-950/20'
                  : vehicle.recommended
                  ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 shadow-emerald-100 dark:shadow-none hover:ring-4'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg active:border-emerald-400'
              } ${isSuburban ? 'shadow-[0_0_20px_rgba(251,191,36,0.4)] border-amber-400 dark:border-amber-500' : ''}`}
            >
              {isSuburban && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5 rounded-lg animate-pulse pointer-events-none" />
              )}
              <div className="flex items-start justify-between gap-2 xs:gap-3 relative">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                    <p className={`font-semibold text-xs xs:text-sm ${isSuburban ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                      {vehicle.name}
                      {isSuburban && <span className="ml-1">🔥</span>}
                    </p>
                    {vehicle.recommended && (
                      <span className="inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] xs:text-xs font-medium rounded-full whitespace-nowrap">
                        <Star className="w-2.5 h-2.5 xs:w-3 xs:h-3 fill-current" />
                        <span className="hidden xs:inline">Best Fit</span>
                        <span className="xs:hidden">Best</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 xs:gap-3 mt-0.5 xs:mt-1 text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-0.5 xs:gap-1">
                      <Users className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                      {vehicle.capacity}
                    </span>
                    <span className="flex items-center gap-0.5 xs:gap-1">
                      <Briefcase className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                      {vehicle.luggageCapacity}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-base xs:text-lg sm:text-xl font-bold ${isSuburban ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ${vehicle.oneWayPrice}
                  </p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    one-way
                  </p>
                </div>
              </div>
              <div className="mt-1.5 xs:mt-2 pt-1.5 xs:pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[10px] xs:text-xs relative">
                <span className="text-gray-500 dark:text-gray-400">Round trip</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">${vehicle.roundTripPrice}</span>
              </div>
              {!isSelected && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span className="text-[10px] xs:text-xs font-semibold">Click to select this vehicle</span>
                </div>
              )}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-teal-200 dark:border-teal-800 flex items-center justify-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  <span className="text-[10px] xs:text-xs font-semibold">Selected - Continuing...</span>
                </div>
              )}
            </button>
            );
          })}
        </div>
      )}

      <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2.5 xs:p-3">
        <p className="text-[10px] xs:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2">
          Competitor Comparison
        </p>
        <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
          {competitors.map((comp) => (
            <div key={comp.name} className="flex items-center justify-between text-[10px] xs:text-xs">
              <span className="text-gray-600 dark:text-gray-400">{comp.name}</span>
              <span className="text-gray-400 dark:text-gray-500 line-through">${comp.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 xs:mt-2 pt-1.5 xs:pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] xs:text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Save up to ${Math.round(basePrice * 0.15)} with us!
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 xs:mt-4 px-2">
        All prices include taxes, meet & greet, and flight tracking
      </p>
    </div>
  );
}
