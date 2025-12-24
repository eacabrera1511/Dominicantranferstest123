import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  rating: number;
  review_title: string | null;
  review_text: string;
  review_date: string;
  verified_purchase: boolean;
}

interface StreamingReviewBarProps {
  onSeeMoreClick: () => void;
}

export function StreamingReviewBar({ onSeeMoreClick }: StreamingReviewBarProps) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('tripadvisor_reviews')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (data && data.length > 0) {
      setReviews([...data, ...data, ...data]);
    }
  };

  if (reviews.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
      <div className="relative overflow-hidden py-2">
        <div className="flex items-center gap-2 sm:gap-3 animate-scroll-left">
          {reviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-[200px] sm:min-w-[250px] lg:min-w-[300px] max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {review.reviewer_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {review.reviewer_name}
                    </h3>
                    {review.verified_purchase && (
                      <span className="hidden sm:inline px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 sm:line-clamp-2">
                    {review.review_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white/95 dark:from-slate-900/95 to-transparent pointer-events-none"></div>

        <button
          onClick={onSeeMoreClick}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-1 sm:gap-2 z-10"
        >
          <img
            src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logoset_solid_green.svg"
            alt="TripAdvisor"
            className="h-3 sm:h-4 brightness-0 invert"
          />
          <span className="hidden sm:inline">See all 1,500+ reviews</span>
          <span className="sm:hidden">Reviews</span>
        </button>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          display: flex;
          animation: scroll-left 60s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
