import { useState, useEffect } from 'react';
import { Car, Star, Users, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

interface GalleryItem {
  id: string;
  category_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  sort_order: number;
}

export function ExperienceGallery() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from('gallery_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('gallery_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (itemsResult.data) setAllItems(itemsResult.data);
    setLoading(false);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Car':
        return Car;
      case 'Star':
        return Star;
      case 'Users':
        return Users;
      default:
        return Star;
    }
  };

  const getCategoryItems = (categoryId: string) => {
    return allItems.filter((item) => item.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="w-full py-3 sm:py-4">
        <div className="flex justify-center">
          <div className="flex gap-2.5 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="w-10 h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-2.5 sm:py-3">
      <div className="flex justify-start sm:justify-center">
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto px-3 sm:px-4 pb-2 scrollbar-hide w-full sm:w-auto">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon);
            const items = getCategoryItems(category.id);
            const firstItem = items[0];

            if (!firstItem) return null;

            return (
              <div
                key={category.id}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500">
                  <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-slate-900">
                    <img
                      src={firstItem.thumbnail_url || firstItem.media_url}
                      alt={category.name}
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {firstItem.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                    <Icon className="w-2.5 h-2.5 text-white dark:text-slate-900" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium max-w-[56px] sm:max-w-[64px] truncate text-center text-slate-700 dark:text-slate-300">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
