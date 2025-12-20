import React, { useState } from 'react';
import { Search, Database, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminRAGKnowledgeBase() {
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [stats, setStats] = useState<{
    documents: number;
    chunks: number;
  } | null>(null);

  const loadStats = async () => {
    const { count: docCount } = await supabase
      .from('knowledge_base_documents')
      .select('*', { count: 'exact', head: true });

    const { count: chunkCount } = await supabase
      .from('knowledge_base_chunks')
      .select('*', { count: 'exact', head: true });

    setStats({
      documents: docCount || 0,
      chunks: chunkCount || 0,
    });
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  const handleSeedKnowledgeBase = async () => {
    setLoading(true);
    setSeedStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-knowledge-base`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSeedStatus({
          success: true,
          message: 'Knowledge base seeded successfully!',
          details: result,
        });
        await loadStats();
      } else {
        setSeedStatus({
          success: false,
          message: 'Failed to seed knowledge base',
          details: result,
        });
      }
    } catch (error: any) {
      setSeedStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            match_count: 5,
            match_threshold: 0.7,
          }),
        }
      );

      const result = await response.json();
      setSearchResults(result);
    } catch (error: any) {
      setSearchResults({
        error: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6" />
          RAG Knowledge Base Management
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Manage the RAG (Retrieval-Augmented Generation) knowledge base with vector embeddings for semantic search.
        </p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Documents</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.documents}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Text Chunks</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.chunks}
              </div>
            </div>
          </div>
        )}

        {/* Seed Button */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Seed Knowledge Base</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will clear existing data and populate the knowledge base with all service information, pricing, vehicles, destinations, and policies. Takes 2-3 minutes.
          </p>
          <button
            onClick={handleSeedKnowledgeBase}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Seeding Knowledge Base...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Seed Knowledge Base
              </>
            )}
          </button>
        </div>

        {/* Seed Status */}
        {seedStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            seedStatus.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {seedStatus.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-semibold">{seedStatus.message}</span>
            </div>
            {seedStatus.details && (
              <pre className="text-xs mt-2 p-2 bg-white/50 dark:bg-black/20 rounded overflow-auto">
                {JSON.stringify(seedStatus.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Search Test */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Test Semantic Search
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Try: How much from PUJ to Hard Rock?"
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4">
              {searchResults.error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
                  Error: {searchResults.error}
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Found {searchResults.count} results for "{searchResults.query}"
                  </div>
                  {searchResults.results?.map((result: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {result.metadata?.title} • {result.metadata?.category}
                        </div>
                        <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {(result.similarity * 100).toFixed(1)}% match
                        </div>
                      </div>
                      <p className="text-sm">{result.content}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Integration Guide */}
        <div className="mt-6 border-t pt-6">
          <h3 className="font-semibold mb-2">ElevenLabs Integration</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>API Endpoint:</strong></p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-search
            </code>

            <p className="mt-4"><strong>Request Example:</strong></p>
            <pre className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
{`{
  "query": "How much from PUJ to Hard Rock?",
  "match_count": 5,
  "match_threshold": 0.7
}`}
            </pre>

            <p className="mt-4">
              <a
                href="/RAG_SETUP_GUIDE.md"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                View Complete RAG Setup Guide →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
