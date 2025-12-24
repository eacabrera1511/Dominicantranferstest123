import { useState, useEffect } from 'react';
import { Star, X, ExternalLink } from 'lucide-react';
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

export function AnimatedReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('reviews_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('tripadvisor_reviews')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (data && data.length > 0) {
      setReviews(data);
      setCurrentReview(data[0]);
    }
  };

  const getTimeAgo = () => {
    const minutes = Math.floor(Math.random() * 30) + 1;
    if (minutes < 5) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    return 'recently';
  };

  const closePopup = () => {
    setIsDismissed(true);
    localStorage.setItem('reviews_dismissed', 'true');
  };

  if (showAllReviews) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <img
                  src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logoset_solid_green.svg"
                  alt="TripAdvisor"
                  className="h-8"
                />
                Customer Reviews
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Trusted by 1,500+ travelers
              </p>
            </div>
            <button
              onClick={() => setShowAllReviews(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {review.reviewer_name}
                        </h3>
                        {review.verified_purchase && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                            Verified
                          </span>
                        )}
                      </div>
                      {review.reviewer_location && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {review.reviewer_location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.review_title && (
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {review.review_title}
                    </h4>
                  )}

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    {review.review_text}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(review.review_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <a
              href="https://www.tripadvisor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View more on TripAdvisor
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!currentReview || isDismissed) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
              {currentReview.reviewer_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {currentReview.reviewer_name}
                </h3>
                {currentReview.verified_purchase && (
                  <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold flex-shrink-0">
                    Verified Booking
                  </span>
                )}
              </div>
              {currentReview.reviewer_location && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentReview.reviewer_location}
                </p>
              )}
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">
                {getTimeAgo()}
              </p>
            </div>
          </div>
          <button
            onClick={closePopup}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < currentReview.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300 dark:text-slate-600'
              }`}
            />
          ))}
        </div>

        {currentReview.review_title && (
          <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-base">
            {currentReview.review_title}
          </h4>
        )}

        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-5">
          {currentReview.review_text}
        </p>

        <button
          onClick={() => setShowAllReviews(true)}
          className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <img
            src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logoset_solid_green.svg"
            alt="TripAdvisor"
            className="h-5 brightness-0 invert"
          />
          See all 1,500+ reviews
        </button>
      </div>
    </div>
  );
}
