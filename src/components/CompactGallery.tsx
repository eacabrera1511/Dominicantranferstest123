import { useState, useEffect } from 'react';
import { Camera, MapPin, Users, Star, Play, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: 'photo' | 'video';
  category: 'fleet' | 'punta_cana' | 'drivers' | 'reviews' | 'general';
  display_order: number;
}

const categoryConfig = {
  fleet: {
    label: 'Fleet',
    icon: Camera,
    gradient: 'from-blue-500 to-cyan-500'
  },
  punta_cana: {
    label: 'Destinations',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-500'
  },
  drivers: {
    label: 'Team',
    icon: Users,
    gradient: 'from-orange-500 to-amber-500'
  },
  reviews: {
    label: 'Reviews',
    icon: Star,
    gradient: 'from-pink-500 to-rose-500'
  },
  general: {
    label: 'Gallery',
    icon: Camera,
    gradient: 'from-violet-500 to-purple-500'
  }
};

interface CompactGalleryProps {
  onViewFull: () => void;
}

export function CompactGallery({ onViewFull }: CompactGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  async function loadGalleryItems() {
    try {
      const { data, error } = await supabase
        .from('experience_gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      if (data) {
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto py-2">
        <div className="grid grid-cols-3 gap-1.5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xs mx-auto animate-fadeIn">
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/40 dark:border-slate-700/40 rounded-lg p-2 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-200 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ImageIcon className="w-2 h-2 text-white" />
            </div>
            <h3 className="text-[10px] font-semibold text-slate-900 dark:text-white">Gallery</h3>
          </div>
          <button
            onClick={onViewFull}
            className="text-[9px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {items.slice(0, 3).map((item, index) => {
            const Icon = categoryConfig[item.category]?.icon || Camera;
            const gradient = categoryConfig[item.category]?.gradient || 'from-slate-500 to-slate-600';

            return (
              <div
                key={item.id}
                onClick={onViewFull}
                style={{ animationDelay: `${index * 40}ms` }}
                className="group relative aspect-square rounded overflow-hidden cursor-pointer animate-scaleIn hover:scale-105 transition-transform duration-200 shadow-sm"
              >
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0.5 left-0.5 right-0.5">
                    <p className="text-white text-[8px] font-medium truncate">{item.title}</p>
                  </div>
                </div>

                {item.media_type === 'video' && (
                  <div className="absolute top-0.5 right-0.5">
                    <div className="p-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                      <Play size={6} className="text-white fill-white" />
                    </div>
                  </div>
                )}

                <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className={`p-0.5 rounded-full bg-gradient-to-r ${gradient}`}>
                    <Icon className="w-2 h-2 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
