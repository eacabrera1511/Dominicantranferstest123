import { useState, useEffect } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ReviewCard } from './ReviewCard';

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

interface ReviewsSectionProps {
  onClose?: () => void;
}

export function ReviewsSection({ onClose }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setReviews(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (reviewsData: Review[]) => {
    const totalReviews = reviewsData.length;
    const averageRating = totalReviews > 0 
      ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const distribution = [0, 0, 0, 0, 0];
    reviewsData.forEach(review => {
      distribution[review.rating - 1]++;
    });

    setStats({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution: distribution.reverse() // 5-star to 1-star
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : i < rating 
            ? 'fill-yellow-400/50 text-yellow-400' 
            : 'text-gray-500'
        }`}
      />
    ));
  };

  const getRatingPercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="animate-slideIn">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slideIn space-y-6">
      {/* Reviews Header & Stats */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
              <p className="text-gray-300 text-sm">What our travelers are saying</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-white">{stats.averageRating}</div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {renderStars(stats.averageRating)}
                </div>
                <p className="text-gray-400 text-sm">{stats.totalReviews} reviews</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Excellent rating</span>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, index) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-white text-sm w-6">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000"
                    style={{ width: `${getRatingPercentage(stats.ratingDistribution[index])}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-8">
                  {stats.ratingDistribution[index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-400">Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
}