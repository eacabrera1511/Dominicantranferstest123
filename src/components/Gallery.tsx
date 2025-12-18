import { useState, useEffect } from 'react';
import { X, Play, Camera, Users, MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
    label: 'Our Fleet',
    icon: Camera,
    gradient: 'from-blue-500 to-cyan-500'
  },
  punta_cana: {
    label: 'Destinations',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-500'
  },
  drivers: {
    label: 'Our Team',
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

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, items]);

  async function loadGalleryItems() {
    try {
      const { data, error } = await supabase
        .from('experience_gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) {
        setItems(data);
        setFilteredItems(data);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', ...Object.keys(categoryConfig)] as const;

  const openLightbox = (item: GalleryItem, index: number) => {
    setSelectedItem(item);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedItem(null);
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % filteredItems.length
      : (currentIndex - 1 + filteredItems.length) % filteredItems.length;

    setCurrentIndex(newIndex);
    setSelectedItem(filteredItems[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16 animate-slideDown">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Experience Gallery
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Explore our premium fleet, beautiful destinations, and happy customers
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12 animate-slideUp">
          {categories.map((category, index) => {
            const config = category === 'all'
              ? { label: 'All', icon: Camera, gradient: 'from-slate-500 to-slate-600' }
              : categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`
                  group relative px-6 py-3 rounded-full font-medium transition-all duration-300
                  animate-scaleIn overflow-hidden
                  ${selectedCategory === category
                    ? 'text-white shadow-xl scale-105'
                    : 'text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:scale-105 hover:shadow-lg backdrop-blur-sm'
                  }
                `}
              >
                {selectedCategory === category && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} transition-all duration-300`}></div>
                )}
                <span className="relative flex items-center gap-2">
                  <Icon size={18} />
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Camera size={64} className="mx-auto mb-4 text-slate-400" />
            <p className="text-xl text-slate-600 dark:text-slate-400">No items in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => openLightbox(item, index)}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer animate-scaleIn shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.media_type === 'video' && (
                    <div className="absolute top-4 right-4">
                      <div className="p-2 bg-white/20 backdrop-blur-md rounded-full">
                        <Play size={20} className="text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-bold text-lg md:text-xl mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-white/90 text-sm line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${categoryConfig[item.category as keyof typeof categoryConfig].gradient} shadow-lg`}>
                    {categoryConfig[item.category as keyof typeof categoryConfig].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {filteredItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateGallery('prev');
                }}
                className="absolute left-4 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronLeft size={32} className="text-white" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateGallery('next');
                }}
                className="absolute right-4 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronRight size={32} className="text-white" />
              </button>
            </>
          )}

          <div
            className="max-w-7xl w-full animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.media_type === 'video' ? (
              <video
                src={selectedItem.media_url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={selectedItem.media_url}
                alt={selectedItem.title}
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
            )}

            <div className="mt-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="text-white/80 text-lg">{selectedItem.description}</p>
              )}
              <div className="mt-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${categoryConfig[selectedItem.category as keyof typeof categoryConfig].gradient} shadow-lg`}>
                  {categoryConfig[selectedItem.category as keyof typeof categoryConfig].label}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {currentIndex + 1} / {filteredItems.length}
          </div>
        </div>
      )}
    </div>
  );
}
