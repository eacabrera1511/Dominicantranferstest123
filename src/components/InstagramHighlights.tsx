import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Story {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  sort_order: number;
}

interface Highlight {
  id: string;
  title: string;
  cover_image: string;
  instagram_url: string;
  stories: Story[];
}

interface StoryViewerProps {
  highlight: Highlight;
  onClose: () => void;
}

function StoryViewer({ highlight, onClose }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDraggingDown, setIsDraggingDown] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStory = highlight.stories[currentStoryIndex];

  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    containerRef.current?.focus();

    const preventDefault = (e: TouchEvent) => {
      if (e.target === containerRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      // Restore original styles or remove property if it was empty
      if (originalOverflow) {
        document.body.style.overflow = originalOverflow;
      } else {
        document.body.style.removeProperty('overflow');
      }
      if (originalTouchAction) {
        document.body.style.touchAction = originalTouchAction;
      } else {
        document.body.style.removeProperty('touch-action');
      }
      if (originalPosition) {
        document.body.style.position = originalPosition;
      } else {
        document.body.style.removeProperty('position');
      }
      if (originalWidth) {
        document.body.style.width = originalWidth;
      } else {
        document.body.style.removeProperty('width');
      }
      if (originalHeight) {
        document.body.style.height = originalHeight;
      } else {
        document.body.style.removeProperty('height');
      }
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('touch-action');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('width');
    document.body.style.removeProperty('height');

    setTimeout(() => {
      onClose();
    }, 150);
  }, [onClose, isClosing]);

  const goToNext = useCallback(() => {
    if (currentStoryIndex < highlight.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      handleClose();
    }
  }, [currentStoryIndex, highlight.stories.length, handleClose]);

  const goToPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  }, [currentStoryIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsDraggingDown(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartX === null) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - touchStartY;
    const diffX = Math.abs(currentX - touchStartX);

    if (diffY > 15 && diffY > diffX * 1.5) {
      setIsDraggingDown(true);
      setDragOffset(Math.min(diffY, 250));
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDraggingDown && dragOffset > 80) {
      handleClose();
      return;
    }

    setIsDraggingDown(false);
    setDragOffset(0);

    if (touchStartX === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEnd;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') handleClose();
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-150 ${isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ touchAction: 'none' }}
    >
      <div
        className="relative w-full h-full max-w-lg mx-auto flex flex-col overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDraggingDown ? `translateY(${dragOffset}px) scale(${1 - dragOffset / 800})` : isClosing ? 'translateY(100px) scale(0.9)' : 'none',
          opacity: isDraggingDown ? Math.max(0.3, 1 - dragOffset / 250) : 1,
          transition: isDraggingDown ? 'none' : 'transform 0.15s ease-out, opacity 0.15s ease-out'
        }}
      >
        <div className="absolute top-0 left-0 right-0 z-30 px-3 pb-2 bg-gradient-to-b from-black/70 to-transparent" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <div className="flex gap-1 mt-2 mb-3">
            {highlight.stories.map((_, index) => (
              <div key={index} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white rounded-full transition-all duration-100 ${
                    index < currentStoryIndex ? 'w-full' : index === currentStoryIndex ? 'w-1/2' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">DT</span>
                </div>
              </div>
              <span className="text-white text-sm font-medium">{highlight.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleClose();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleClose();
              }}
              className="w-12 h-12 -mr-1 flex items-center justify-center text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors active:scale-90 active:bg-white/20"
              aria-label="Close"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-black flex items-center justify-center">
          {currentStory.media_type === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
              loop
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.media_url}
              alt={currentStory.caption || ''}
              className="w-full h-full object-contain"
            />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-0 top-20 bottom-24 w-1/3 flex items-center justify-start pl-2"
            aria-label="Previous story"
          >
            {currentStoryIndex > 0 && (
              <div className="hidden sm:flex w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/60 transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-0 top-20 bottom-24 w-1/3 flex items-center justify-end pr-2"
            aria-label="Next story"
          >
            <div className="hidden sm:flex w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/60 transition-colors">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          {currentStory.caption && (
            <p className="text-white text-center text-sm font-medium px-6 mb-3">{currentStory.caption}</p>
          )}

          <div className="flex justify-center gap-2 mb-3">
            {highlight.stories.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStoryIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStoryIndex ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-center pb-2">
            <a
              href={highlight.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-medium hover:bg-white/30 active:scale-95 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Instagram</span>
            </a>
          </div>
        </div>

        {isDraggingDown && dragOffset > 30 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
              {dragOffset > 80 ? 'Release to close' : 'Swipe down to close'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InstagramHighlightsProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function InstagramHighlights({ isModal = false, onClose }: InstagramHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    const { data: highlightsData } = await supabase
      .from('instagram_highlights')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (highlightsData && highlightsData.length > 0) {
      const { data: storiesData } = await supabase
        .from('instagram_stories')
        .select('*')
        .order('sort_order', { ascending: true });

      const highlightsWithStories = highlightsData.map(h => ({
        id: h.id,
        title: h.title,
        cover_image: h.cover_image,
        instagram_url: h.instagram_url || 'https://www.instagram.com/dominicantransfers/',
        stories: (storiesData || [])
          .filter(s => s.highlight_id === h.id)
          .map(s => ({
            id: s.id,
            media_url: s.media_url,
            media_type: s.media_type || 'image',
            caption: s.caption,
            sort_order: s.sort_order
          }))
      }));

      setHighlights(highlightsWithStories);
    }
    setLoading(false);
  };

  const handleCloseStory = useCallback(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('touch-action');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('width');
    document.body.style.removeProperty('height');

    setActiveHighlight(null);

    requestAnimationFrame(() => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
    });
  }, []);

  // Cleanup effect to ensure styles are removed when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
    };
  }, []);

  if (loading) {
    return (
      <div className={`w-full ${isModal ? 'py-4' : 'py-3 sm:py-4'}`}>
        <div className="flex justify-center">
          <div className="flex gap-2.5 sm:gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="w-8 h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return null;
  }

  const content = (
    <div className={`w-full ${isModal ? 'py-4' : 'py-2.5 sm:py-3'}`}>
      <div className="flex justify-start sm:justify-center">
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto px-3 sm:px-4 pb-2 scrollbar-hide w-full sm:w-auto">
          {highlights.map((highlight) => (
            <button
              key={highlight.id}
              onClick={() => highlight.stories.length > 0 && setActiveHighlight(highlight)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 group-hover:scale-105 group-active:scale-95 transition-transform">
                <div className={`w-full h-full rounded-full p-[2px] ${isModal ? 'bg-slate-900' : 'bg-white dark:bg-slate-900'}`}>
                  <img
                    src={highlight.cover_image}
                    alt={highlight.title}
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium max-w-[48px] sm:max-w-[56px] truncate text-center ${isModal ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {highlight.title}
              </span>
            </button>
          ))}

          <a
            href="https://www.instagram.com/dominicantransfers/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 flex-shrink-0 group"
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed flex items-center justify-center group-hover:border-pink-500 group-hover:scale-105 group-active:scale-95 transition-all ${isModal ? 'border-slate-600' : 'border-slate-300 dark:border-slate-600'}`}>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-medium ${isModal ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
              See All
            </span>
          </a>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    const handleModalClose = () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');

      setActiveHighlight(null);

      if (onClose) {
        onClose();
      }

      requestAnimationFrame(() => {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('touch-action');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('height');
      });
    };

    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleModalClose();
          }
        }}
        onTouchEnd={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            handleModalClose();
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleModalClose();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleModalClose();
          }}
          className="absolute right-4 z-50 w-12 h-12 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full text-white transition-all active:scale-90 active:bg-white/30"
          style={{ top: 'max(env(safe-area-inset-top), 16px)' }}
        >
          <X className="w-7 h-7" />
        </button>

        <div className="text-center mb-4 px-4">
          <h2 className="text-xl font-bold text-white mb-1">Our Instagram</h2>
          <p className="text-sm text-slate-400">Tap a story to view</p>
        </div>

        {content}

        {activeHighlight && (
          <StoryViewer
            key={activeHighlight.id}
            highlight={activeHighlight}
            onClose={handleCloseStory}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {content}
      {activeHighlight && (
        <StoryViewer
          key={activeHighlight.id}
          highlight={activeHighlight}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
}
