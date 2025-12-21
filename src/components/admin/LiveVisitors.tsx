import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Eye, Clock, MapPin, MousePointer, TrendingUp } from 'lucide-react';

interface ActiveSession {
  id: string;
  session_id: string;
  device_id: string;
  current_page_url: string;
  current_page_title: string;
  last_active_at: string;
  landing_page: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  gclid: string | null;
  started_at: string;
}

interface PageView {
  page_url: string;
  page_title: string;
  view_count: number;
  unique_visitors: number;
}

export default function LiveVisitors() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [topPages, setTopPages] = useState<PageView[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLiveData = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: sessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('*')
        .gte('last_active_at', fiveMinutesAgo)
        .order('last_active_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      setActiveSessions(sessions || []);
      setTotalVisitors(sessions?.length || 0);

      const { data: pageData, error: pageError } = await supabase
        .from('page_views')
        .select('page_url, page_title, session_id')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (!pageError && pageData) {
        const pageMap = new Map<string, { title: string; count: number; sessions: Set<string> }>();

        pageData.forEach(view => {
          const key = view.page_url;
          if (!pageMap.has(key)) {
            pageMap.set(key, { title: view.page_title || 'Untitled', count: 0, sessions: new Set() });
          }
          const entry = pageMap.get(key)!;
          entry.count++;
          entry.sessions.add(view.session_id);
        });

        const pages = Array.from(pageMap.entries()).map(([url, data]) => ({
          page_url: url,
          page_title: data.title,
          view_count: data.count,
          unique_visitors: data.sessions.size
        }));

        pages.sort((a, b) => b.view_count - a.view_count);
        setTopPages(pages.slice(0, 5));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching live data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();

    const interval = setInterval(fetchLiveData, 10000);

    return () => clearInterval(interval);
  }, []);

  const getTimeSince = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getSourceBadge = (session: ActiveSession) => {
    if (session.gclid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          <TrendingUp className="w-3 h-3" />
          Google Ads
        </span>
      );
    }
    if (session.utm_source) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
          <MapPin className="w-3 h-3" />
          {session.utm_source}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
        <MousePointer className="w-3 h-3" />
        Direct
      </span>
    );
  };

  const getPageName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path === '/' || path === '') return 'Homepage';
      if (path.includes('admin')) return 'Admin Dashboard';
      if (path.includes('partner')) return 'Partner Portal';
      if (path.includes('driver')) return 'Driver Portal';
      return path.replace(/\//g, ' / ').trim();
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Visitors</p>
              <p className="text-4xl font-bold mt-2">{totalVisitors}</p>
              <p className="text-blue-100 text-xs mt-1">Last 5 minutes</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Pages Viewed</p>
              <p className="text-4xl font-bold mt-2">{topPages.reduce((sum, p) => sum + p.view_count, 0)}</p>
              <p className="text-emerald-100 text-xs mt-1">Last hour</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">From Google Ads</p>
              <p className="text-4xl font-bold mt-2">
                {activeSessions.filter(s => s.gclid).length}
              </p>
              <p className="text-purple-100 text-xs mt-1">Active now</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Visitor Activity</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time view of visitors on your website
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeSessions.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No active visitors right now</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Visitors will appear here when they browse your site
              </p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getPageName(session.current_page_url)}
                      </span>
                      {getSourceBadge(session)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeSince(session.last_active_at)}
                      </span>
                      {session.utm_campaign && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {session.utm_campaign}
                        </span>
                      )}
                      {session.utm_term && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          {session.utm_term}
                        </span>
                      )}
                    </div>

                    {session.gclid && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                        GCLID: {session.gclid.substring(0, 20)}...
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      Landing: {getPageName(session.landing_page)}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Session: {Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)}m
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {topPages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Top Pages (Last Hour)
          </h3>
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {page.page_title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {page.page_url}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {page.view_count} views
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {page.unique_visitors} visitors
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-2">How Live Tracking Works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
              <li>Updates every 10 seconds automatically</li>
              <li>Shows visitors active in the last 5 minutes</li>
              <li>Tracks page views, campaigns, and traffic sources</li>
              <li>Google Ads visitors identified by GCLID parameter</li>
              <li>Session duration calculated from first page view</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
