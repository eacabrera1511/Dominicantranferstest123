import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, Image, Video, GripVertical,
  ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Story {
  id: string;
  highlight_id: string;
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
  sort_order: number;
  is_active: boolean;
  stories?: Story[];
}

export function AdminReels() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHighlight, setEditingHighlight] = useState<string | null>(null);
  const [expandedHighlight, setExpandedHighlight] = useState<string | null>(null);
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [showAddStory, setShowAddStory] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState({ title: '', cover_image: '', instagram_url: 'https://www.instagram.com/dominicantransfers/' });
  const [newStory, setNewStory] = useState({ media_url: '', media_type: 'image' as 'image' | 'video', caption: '' });
  const [editForm, setEditForm] = useState<Partial<Highlight>>({});

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    setLoading(true);
    const { data: highlightsData, error: highlightsError } = await supabase
      .from('instagram_highlights')
      .select('*')
      .order('sort_order', { ascending: true });

    if (highlightsError) {
      console.error('Error fetching highlights:', highlightsError);
      setLoading(false);
      return;
    }

    const { data: storiesData } = await supabase
      .from('instagram_stories')
      .select('*')
      .order('sort_order', { ascending: true });

    const highlightsWithStories = (highlightsData || []).map(h => ({
      ...h,
      stories: (storiesData || []).filter(s => s.highlight_id === h.id)
    }));

    setHighlights(highlightsWithStories);
    setLoading(false);
  };

  const handleAddHighlight = async () => {
    if (!newHighlight.title || !newHighlight.cover_image) return;

    const maxOrder = Math.max(...highlights.map(h => h.sort_order), 0);

    const { error } = await supabase
      .from('instagram_highlights')
      .insert({
        title: newHighlight.title,
        cover_image: newHighlight.cover_image,
        instagram_url: newHighlight.instagram_url,
        sort_order: maxOrder + 1
      });

    if (!error) {
      setNewHighlight({ title: '', cover_image: '', instagram_url: 'https://www.instagram.com/dominicantransfers/' });
      setShowAddHighlight(false);
      fetchHighlights();
    }
  };

  const handleUpdateHighlight = async (id: string) => {
    const { error } = await supabase
      .from('instagram_highlights')
      .update({
        title: editForm.title,
        cover_image: editForm.cover_image,
        instagram_url: editForm.instagram_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      setEditingHighlight(null);
      fetchHighlights();
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!confirm('Delete this reel and all its media?')) return;

    const { error } = await supabase
      .from('instagram_highlights')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchHighlights();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('instagram_highlights')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (!error) {
      fetchHighlights();
    }
  };

  const handleAddStory = async (highlightId: string) => {
    if (!newStory.media_url) return;

    const highlight = highlights.find(h => h.id === highlightId);
    const maxOrder = Math.max(...(highlight?.stories?.map(s => s.sort_order) || [0]), 0);

    const { error } = await supabase
      .from('instagram_stories')
      .insert({
        highlight_id: highlightId,
        media_url: newStory.media_url,
        media_type: newStory.media_type,
        caption: newStory.caption || null,
        sort_order: maxOrder + 1
      });

    if (!error) {
      setNewStory({ media_url: '', media_type: 'image', caption: '' });
      setShowAddStory(null);
      fetchHighlights();
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Delete this media?')) return;

    const { error } = await supabase
      .from('instagram_stories')
      .delete()
      .eq('id', storyId);

    if (!error) {
      fetchHighlights();
    }
  };

  const handleMoveHighlight = async (id: string, direction: 'up' | 'down') => {
    const index = highlights.findIndex(h => h.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === highlights.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const currentOrder = highlights[index].sort_order;
    const swapOrder = highlights[swapIndex].sort_order;

    await supabase
      .from('instagram_highlights')
      .update({ sort_order: swapOrder })
      .eq('id', id);

    await supabase
      .from('instagram_highlights')
      .update({ sort_order: currentOrder })
      .eq('id', highlights[swapIndex].id);

    fetchHighlights();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Instagram Reels</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your Instagram highlights and stories</p>
        </div>
        <button
          onClick={() => setShowAddHighlight(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Reel
        </button>
      </div>

      {showAddHighlight && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Reel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={newHighlight.title}
                onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
                placeholder="e.g., Fleet, Destinations"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image URL</label>
              <input
                type="text"
                value={newHighlight.cover_image}
                onChange={(e) => setNewHighlight({ ...newHighlight, cover_image: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Instagram URL</label>
              <input
                type="text"
                value={newHighlight.instagram_url}
                onChange={(e) => setNewHighlight({ ...newHighlight, instagram_url: e.target.value })}
                placeholder="https://www.instagram.com/..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>
          {newHighlight.cover_image && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Preview:</p>
              <img src={newHighlight.cover_image} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddHighlight}
              disabled={!newHighlight.title || !newHighlight.cover_image}
              className="px-6 py-2.5 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Reel
            </button>
            <button
              onClick={() => setShowAddHighlight(false)}
              className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {highlights.map((highlight, index) => (
          <div key={highlight.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveHighlight(highlight.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-600" />
                  <button
                    onClick={() => handleMoveHighlight(highlight.id, 'down')}
                    disabled={index === highlights.length - 1}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative flex-shrink-0">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] ${highlight.is_active ? 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500' : 'bg-gray-600'}`}>
                    <img
                      src={highlight.cover_image}
                      alt={highlight.title}
                      className="w-full h-full rounded-full object-cover border-2 border-slate-800"
                    />
                  </div>
                  {!highlight.is_active && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <EyeOff className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {editingHighlight === highlight.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                      />
                      <input
                        type="text"
                        value={editForm.cover_image || ''}
                        onChange={(e) => setEditForm({ ...editForm, cover_image: e.target.value })}
                        placeholder="Cover image URL"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                      />
                      <input
                        type="text"
                        value={editForm.instagram_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                        placeholder="Instagram URL"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateHighlight(highlight.id)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingHighlight(null)}
                          className="p-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white">{highlight.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{highlight.stories?.length || 0} media items</p>
                      <a
                        href={highlight.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Instagram
                      </a>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleActive(highlight.id, highlight.is_active)}
                    className={`p-2 rounded-lg transition-colors ${highlight.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}`}
                    title={highlight.is_active ? 'Hide' : 'Show'}
                  >
                    {highlight.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingHighlight(highlight.id);
                      setEditForm({
                        title: highlight.title,
                        cover_image: highlight.cover_image,
                        instagram_url: highlight.instagram_url
                      });
                    }}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteHighlight(highlight.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedHighlight(expandedHighlight === highlight.id ? null : highlight.id)}
                    className="p-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20"
                  >
                    {expandedHighlight === highlight.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {expandedHighlight === highlight.id && (
              <div className="border-t border-white/10 p-4 sm:p-6 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-300">Media Items</h4>
                  <button
                    onClick={() => setShowAddStory(highlight.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-medium hover:bg-pink-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add Media
                  </button>
                </div>

                {showAddStory === highlight.id && (
                  <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Media URL</label>
                        <input
                          type="text"
                          value={newStory.media_url}
                          onChange={(e) => setNewStory({ ...newStory, media_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                        <select
                          value={newStory.media_type}
                          onChange={(e) => setNewStory({ ...newStory, media_type: e.target.value as 'image' | 'video' })}
                          className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Caption (optional)</label>
                        <input
                          type="text"
                          value={newStory.caption}
                          onChange={(e) => setNewStory({ ...newStory, caption: e.target.value })}
                          placeholder="Description..."
                          className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddStory(highlight.id)}
                        disabled={!newStory.media_url}
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddStory(null)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {highlight.stories?.map((story) => (
                    <div key={story.id} className="relative group">
                      <div className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-800">
                        {story.media_type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        ) : (
                          <img
                            src={story.media_url}
                            alt={story.caption || ''}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {story.caption && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{story.caption}</p>
                      )}
                      <div className="absolute top-2 left-2">
                        {story.media_type === 'video' ? (
                          <Video className="w-4 h-4 text-white drop-shadow-lg" />
                        ) : (
                          <Image className="w-4 h-4 text-white drop-shadow-lg" />
                        )}
                      </div>
                    </div>
                  ))}
                  {(!highlight.stories || highlight.stories.length === 0) && (
                    <div className="col-span-full py-8 text-center text-gray-500">
                      No media items yet. Add your first photo or video.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {highlights.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Image className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Reels Yet</h3>
            <p className="text-gray-400 mb-6">Create your first Instagram reel to showcase your content</p>
            <button
              onClick={() => setShowAddHighlight(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90"
            >
              Create First Reel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
