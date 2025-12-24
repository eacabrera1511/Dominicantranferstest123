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
  const [isVisible, setIsVisible] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (reviews.length === 0 || showAllReviews) return;

    const showNextReview = () => {
      setIsVisible(false);

      setTimeout(() => {
        const nextIndex = (reviewIndex + 1) % reviews.length;
        setCurrentReview(reviews[nextIndex]);
        setReviewIndex(nextIndex);
        setIsVisible(true);

        setTimeout(() => {
          setIsVisible(false);
        }, 8000);
      }, 500);
    };

    const timer = setTimeout(showNextReview, isVisible ? 8500 : 100);

    return () => clearTimeout(timer);
  }, [reviews, reviewIndex, isVisible, showAllReviews]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('tripadvisor_reviews')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (data) {
      setReviews(data);
      if (data.length > 0) {
        setCurrentReview(data[0]);
        setIsVisible(true);
      }
    }
  };

  const getTimeAgo = () => {
    const minutes = Math.floor(Math.random() * 30) + 1;
    if (minutes < 5) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    return 'recently';
  };

  const closePopup = () => {
    setIsVisible(false);
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
                Trusted by {reviews.length.toLocaleString()}+ travelers
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

  if (!currentReview || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 max-w-md transition-all duration-500 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {currentReview.reviewer_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {currentReview.reviewer_name}
                </h3>
                {currentReview.verified_purchase && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium flex-shrink-0">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getTimeAgo()}
              </p>
            </div>
          </div>
          <button
            onClick={closePopup}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < currentReview.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300 dark:text-slate-600'
              }`}
            />
          ))}
        </div>

        {currentReview.review_title && (
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">
            {currentReview.review_title}
          </h4>
        )}

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
          {currentReview.review_text}
        </p>

        <button
          onClick={() => setShowAllReviews(true)}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <img
            src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logoset_solid_green.svg"
            alt="TripAdvisor"
            className="h-4 brightness-0 invert"
          />
          See all {reviews.length.toLocaleString()}+ reviews
        </button>
      </div>
    </div>
  );
}
