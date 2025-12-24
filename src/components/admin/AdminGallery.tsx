import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Video, Eye, EyeOff, Upload, Monitor, Smartphone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
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
  is_active: boolean;
}

interface HeroVideoSettings {
  id: string;
  hero_video_url: string | null;
  hero_video_mobile_url: string | null;
  hero_video_poster_url: string | null;
  show_video_on_mobile: boolean;
  mobile_video_autoplay: boolean;
  desktop_video_autoplay: boolean;
  video_muted: boolean;
  video_loop: boolean;
  video_playback_speed: number;
}

export function AdminGallery() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    media_url: '',
    media_type: 'photo' as 'photo' | 'video',
    thumbnail_url: '',
    title: '',
    description: '',
  });
  const [editForm, setEditForm] = useState<Partial<GalleryItem>>({});
  const [heroVideo, setHeroVideo] = useState<HeroVideoSettings | null>(null);
  const [editingHero, setEditingHero] = useState(false);
  const [heroForm, setHeroForm] = useState<Partial<HeroVideoSettings>>({});

  useEffect(() => {
    fetchGallery();
    fetchHeroVideo();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from('gallery_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true }),
    ]);

    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
      if (!selectedCategory && categoriesResult.data.length > 0) {
        setSelectedCategory(categoriesResult.data[0].id);
      }
    }
    if (itemsResult.data) setAllItems(itemsResult.data);
    setLoading(false);
  };

  const fetchHeroVideo = async () => {
    const { data } = await supabase
      .from('landing_page_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setHeroVideo(data);
    }
  };

  const handleUpdateHeroVideo = async () => {
    if (!heroVideo?.id) return;

    const { error } = await supabase
      .from('landing_page_settings')
      .update({
        hero_video_url: heroForm.hero_video_url || null,
        hero_video_mobile_url: heroForm.hero_video_mobile_url || null,
        hero_video_poster_url: heroForm.hero_video_poster_url || null,
        show_video_on_mobile: heroForm.show_video_on_mobile ?? true,
        mobile_video_autoplay: heroForm.mobile_video_autoplay ?? true,
        desktop_video_autoplay: heroForm.desktop_video_autoplay ?? true,
        video_muted: heroForm.video_muted ?? true,
        video_loop: heroForm.video_loop ?? true,
        video_playback_speed: heroForm.video_playback_speed ?? 1.0,
      })
      .eq('id', heroVideo.id);

    if (!error) {
      setEditingHero(false);
      fetchHeroVideo();
    }
  };

  const startEditHero = () => {
    setEditingHero(true);
    setHeroForm(heroVideo || {});
  };

  const cancelEditHero = () => {
    setEditingHero(false);
    setHeroForm({});
  };

  const getCategoryItems = (categoryId: string) => {
    return allItems.filter((item) => item.category_id === categoryId);
  };

  const handleAddItem = async () => {
    if (!newItem.media_url || !selectedCategory) return;

    const categoryItems = getCategoryItems(selectedCategory);
    const maxOrder = Math.max(...categoryItems.map((i) => i.sort_order), 0);

    const { error } = await supabase.from('gallery_items').insert({
      category_id: selectedCategory,
      media_url: newItem.media_url,
      media_type: newItem.media_type,
      thumbnail_url: newItem.thumbnail_url || null,
      title: newItem.title || null,
      description: newItem.description || null,
      sort_order: maxOrder + 1,
    });

    if (!error) {
      setNewItem({
        media_url: '',
        media_type: 'photo',
        thumbnail_url: '',
        title: '',
        description: '',
      });
      setShowAddItem(false);
      fetchGallery();
    }
  };

  const handleUpdateItem = async (id: string) => {
    const { error } = await supabase
      .from('gallery_items')
      .update({
        media_url: editForm.media_url,
        media_type: editForm.media_type,
        thumbnail_url: editForm.thumbnail_url || null,
        title: editForm.title || null,
        description: editForm.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setEditingItem(null);
      fetchGallery();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase.from('gallery_items').delete().eq('id', id);

    if (!error) {
      fetchGallery();
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('gallery_items')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (!error) {
      fetchGallery();
    }
  };

  const startEdit = (item: GalleryItem) => {
    setEditingItem(item.id);
    setEditForm(item);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 dark:text-slate-400">Loading gallery...</div>
      </div>
    );
  }

  const categoryItems = selectedCategory ? getCategoryItems(selectedCategory) : [];
  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gallery Management</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage hero video and experience gallery
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-blue-200 dark:border-slate-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hero Video Settings</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Configure landing page video with mobile responsiveness</p>
            </div>
          </div>
          {!editingHero && (
            <button
              onClick={startEditHero}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {editingHero ? (
          <div className="space-y-4 bg-white dark:bg-slate-900 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Monitor className="w-4 h-4" />
                  Desktop Video URL
                </label>
                <input
                  type="text"
                  value={heroForm.hero_video_url || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, hero_video_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="https://... (Desktop video)"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile Video URL
                </label>
                <input
                  type="text"
                  value={heroForm.hero_video_mobile_url || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, hero_video_mobile_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="https://... (Smaller file for mobile)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <ImageIcon className="w-4 h-4" />
                  Poster/Thumbnail URL
                </label>
                <input
                  type="text"
                  value={heroForm.hero_video_poster_url || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, hero_video_poster_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="https://... (Image shown before video loads)"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Video Behavior</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={heroForm.show_video_on_mobile ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, show_video_on_mobile: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Show on Mobile</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={heroForm.desktop_video_autoplay ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, desktop_video_autoplay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Desktop Autoplay</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={heroForm.mobile_video_autoplay ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, mobile_video_autoplay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Mobile Autoplay</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={heroForm.video_muted ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, video_muted: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Muted</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={heroForm.video_loop ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, video_loop: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Loop Video</span>
                </label>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Playback Speed
                  </label>
                  <select
                    value={heroForm.video_playback_speed ?? 1.0}
                    onChange={(e) => setHeroForm({ ...heroForm, video_playback_speed: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x (Normal)</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateHeroVideo}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={cancelEditHero}
                className="px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Desktop Video</span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white break-all">
                {heroVideo?.hero_video_url || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Mobile Video</span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white break-all">
                {heroVideo?.hero_video_mobile_url || 'Uses desktop video'}
              </p>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {heroVideo?.show_video_on_mobile && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  Mobile Enabled
                </span>
              )}
              {heroVideo?.desktop_video_autoplay && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  Desktop Autoplay
                </span>
              )}
              {heroVideo?.mobile_video_autoplay && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  Mobile Autoplay
                </span>
              )}
              {heroVideo?.video_muted && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                  Muted
                </span>
              )}
              {heroVideo?.video_loop && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                  Loop
                </span>
              )}
              {heroVideo?.video_playback_speed !== 1.0 && (
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                  {heroVideo?.video_playback_speed}x Speed
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Experience Gallery</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage photos and videos for Fleet, Reviews, and Drivers
          </p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            {category.name}
            <span className="ml-2 text-xs opacity-75">
              ({getCategoryItems(category.id).length})
            </span>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {selectedCategoryData?.name} Items
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
              >
                {editingItem === item.id ? (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Media URL
                      </label>
                      <input
                        type="text"
                        value={editForm.media_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, media_url: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Type
                      </label>
                      <select
                        value={editForm.media_type || 'photo'}
                        onChange={(e) =>
                          setEditForm({ ...editForm, media_type: e.target.value as 'photo' | 'video' })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                      >
                        <option value="photo">Photo</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    {editForm.media_type === 'video' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Thumbnail URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={editForm.thumbnail_url || ''}
                          onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                        placeholder="Item title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm resize-none"
                        rows={2}
                        placeholder="Item description"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateItem(item.id)}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-3 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-square">
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt={item.title || ''}
                        className="w-full h-full object-cover"
                      />
                      {item.media_type === 'video' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-1">
                          <Video className="w-3 h-3 text-white" />
                          <span className="text-xs text-white font-medium">Video</span>
                        </div>
                      )}
                      {!item.is_active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Hidden</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      {item.title && (
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className="flex-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {item.is_active ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              Show
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {categoryItems.length === 0 && (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No items yet. Click "Add Item" to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {showAddItem && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Add New Item to {selectedCategoryData?.name}
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Media URL *
                </label>
                <input
                  type="text"
                  value={newItem.media_url}
                  onChange={(e) => setNewItem({ ...newItem, media_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                  placeholder="https://images.pexels.com/..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use Pexels or other image hosting services
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Media Type *
                </label>
                <select
                  value={newItem.media_type}
                  onChange={(e) =>
                    setNewItem({ ...newItem, media_type: e.target.value as 'photo' | 'video' })
                  }
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {newItem.media_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Thumbnail URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={newItem.thumbnail_url}
                    onChange={(e) => setNewItem({ ...newItem, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                  placeholder="Item title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg resize-none"
                  rows={3}
                  placeholder="Item description"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddItem}
                disabled={!newItem.media_url}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
