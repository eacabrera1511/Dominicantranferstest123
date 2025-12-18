import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Video, Eye, EyeOff, Upload
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

  useEffect(() => {
    fetchGallery();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Experience Gallery</h2>
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
