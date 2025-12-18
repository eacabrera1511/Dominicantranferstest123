import { User } from 'lucide-react';
import { PriceScanner } from './PriceScanner';
import { PriceComparison } from './PriceComparison';

interface CompetitorPrice {
  name: string;
  logo: string;
  price: number;
  status?: string;
}

interface VehicleOption {
  name: string;
  capacity: number;
  luggageCapacity: number;
  oneWayPrice: number;
  roundTripPrice: number;
  recommended?: boolean;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  vehicleImage?: {
    url: string;
    alt: string;
    caption: string;
  };
  galleryImages?: {
    url: string;
    title: string;
    description: string;
  }[];
  priceScanner?: {
    basePrice: number;
    route: string;
    passengers?: number;
    luggage?: number;
    vehicleOptions?: VehicleOption[];
    onComplete: (competitors: CompetitorPrice[]) => void;
    onSelectVehicle?: (vehicle: VehicleOption) => void;
    onBookNow?: () => void;
    onBetterRate?: (price: number) => void;
  };
  priceComparison?: {
    basePrice: number;
    competitors: CompetitorPrice[];
    route: string;
    onBookNow: () => void;
    onPriceMatch: (price: number) => void;
  };
}

export function ChatMessage({ role, content, vehicleImage, galleryImages, priceScanner, priceComparison }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-slideIn`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-slate-200/50 dark:border-white/20 flex items-center justify-center shadow-lg text-2xl">
          🚕
        </div>
      )}

      <div
        className={`${isUser ? 'max-w-[75%]' : 'max-w-[85%]'} rounded-3xl px-5 py-3 shadow-xl ${
          isUser
            ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white'
            : 'bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-slate-200/50 dark:border-white/20 text-slate-800 dark:text-gray-100'
        }`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>}

        {vehicleImage && (
          <div className="mt-4">
            <img
              src={vehicleImage.url}
              alt={vehicleImage.alt}
              className="w-full rounded-2xl shadow-lg border border-slate-200/50 dark:border-white/20"
            />
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-2 text-center">{vehicleImage.caption}</p>
          </div>
        )}

        {galleryImages && galleryImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {galleryImages.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold">{image.title}</p>
                    {image.description && (
                      <p className="text-white/80 text-xs line-clamp-2">{image.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {priceScanner && (
          <div className="mt-4">
            <PriceScanner
              basePrice={priceScanner.basePrice}
              route={priceScanner.route}
              passengers={priceScanner.passengers}
              luggage={priceScanner.luggage}
              vehicleOptions={priceScanner.vehicleOptions}
              onComplete={priceScanner.onComplete}
              onSelectVehicle={priceScanner.onSelectVehicle}
              onBookNow={priceScanner.onBookNow}
              onBetterRate={priceScanner.onBetterRate}
            />
          </div>
        )}

        {priceComparison && (
          <div className="mt-4">
            <PriceComparison
              basePrice={priceComparison.basePrice}
              competitors={priceComparison.competitors}
              route={priceComparison.route}
              onBookNow={priceComparison.onBookNow}
              onPriceMatch={priceComparison.onPriceMatch}
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-slate-200/50 dark:border-white/20 flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-teal-500 dark:text-teal-400" />
        </div>
      )}
    </div>
  );
}
