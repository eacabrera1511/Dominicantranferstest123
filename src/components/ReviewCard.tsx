import { Star, CheckCircle, User } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  image_url?: string;
  verified_booking: boolean;
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-500'
        }`}
      />
    ));
  };

  return (
    <div className="group rounded-3xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl hover:scale-[1.02] transition-all duration-500 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {review.image_url ? (
            <img
              src={review.image_url}
              alt={review.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-semibold text-lg">{review.name}</h4>
            {review.verified_booking && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs font-medium">Verified</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
            </div>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-400 text-sm">{formatDate(review.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h5 className="text-white font-semibold text-base mb-2 line-clamp-2">
          {review.title}
        </h5>
      </div>

      <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
        {review.comment}
      </p>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Helpful review?</span>
          <div className="flex items-center gap-3">
            <button className="hover:text-white transition-colors">👍 Helpful</button>
            <button className="hover:text-white transition-colors">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}