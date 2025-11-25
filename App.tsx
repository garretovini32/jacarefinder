import React, { useState, useCallback, useEffect } from 'react';
import { Search, Music2, AlertCircle, Play, Loader2, X, Heart } from 'lucide-react';
import { Song, SearchState } from './types';
import { searchMusic } from './services/geminiService';
import AudioRecorder from './components/AudioRecorder';

export default function App() {
  const [searchText, setSearchText] = useState('');
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');
  
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    results: [],
  });

  // Load favorites from local storage on mount
  const [favorites, setFavorites] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('jacareFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load favorites", e);
      return [];
    }
  });

  // Persist favorites whenever they change
  useEffect(() => {
    localStorage.setItem('jacareFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (song: Song) => {
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === song.id);
      if (isFav) {
        return prev.filter(f => f.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleAudioComplete = useCallback((base64: string, mimeType: string) => {
    setAudioData({ base64, mimeType });
  }, []);

  const handleClearAudio = useCallback(() => {
    setAudioData(null);
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim() && !audioData) {
      setState(prev => ({ ...prev, error: "Please describe a song or record audio first." }));
      return;
    }

    setState({ isLoading: true, error: null, results: [] });
    setActiveTab('search');

    try {
      const rawResults = await searchMusic(searchText, audioData?.base64 || null, audioData?.mimeType);
      
      // Ensure unique IDs to prevent collisions in favorites (if AI returns simple/duplicate IDs)
      const results = rawResults.map(r => ({
        ...r,
        id: r.id && r.id.length > 5 ? r.id : crypto.randomUUID()
      }));

      setState({ isLoading: false, error: null, results });
    } catch (err: any) {
      setState({ 
        isLoading: false, 
        error: err.message || "An unexpected error occurred.", 
        results: [] 
      });
    }
  };

  const clearAll = () => {
    setSearchText('');
    setAudioData(null);
    setState({ isLoading: false, error: null, results: [] });
  };

  const hasContent = searchText.length > 0 || audioData !== null || state.results.length > 0;

  // Helper to render a list of songs
  const renderSongList = (songs: Song[], emptyMessage: string) => {
    if (songs.length === 0) {
      return (
        <div className="text-center py-10 opacity-50">
           <Music2 size={48} className="mx-auto mb-3 text-gray-600" />
           <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 mt-2">
        {songs.map((song) => {
          const isFav = favorites.some(f => f.id === song.id);
          return (
            <div 
              key={song.id} 
              className="bg-jacare-800 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4 group hover:border-jacare-500/50 transition-colors"
            >
              {/* Cover Placeholder */}
              <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800" />
                <Music2 className="text-gray-400 group-hover:text-jacare-500 transition-colors relative z-10" size={24} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base truncate">{song.titulo}</h3>
                <p className="text-gray-400 text-sm truncate mb-1">{song.artista}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-jacare-500 border border-gray-700">
                    {song.matchType}
                  </span>
                  {song.confidence > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-900 text-gray-400 border border-gray-700">
                      {song.confidence}% Match
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-red-500/10 text-red-500' : 'bg-gray-700/30 text-gray-400 hover:bg-red-500/10 hover:text-red-500'}`}
                  onClick={() => toggleFavorite(song)}
                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                </button>
                
                <button 
                  className="w-8 h-8 rounded-full bg-jacare-500/10 text-jacare-500 flex items-center justify-center hover:bg-jacare-500 hover:text-white transition-all"
                  onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.titulo} ${song.artista}`)}`, '_blank')}
                  title="Search on YouTube"
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-jacare-900 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md px-6 pt-8 pb-4 flex items-center gap-3">
        <div className="p-2 bg-jacare-800 rounded-lg border border-jacare-500/30">
          <Search className="text-jacare-500" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">JacareFinder</h1>
          <p className="text-gray-400 text-xs">AI Powered Music Discovery</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-md px-5 mb-4">
        <div className="flex w-full bg-jacare-800/50 p-1 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-jacare-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Search size={16} /> Search
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-jacare-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Heart size={16} fill={activeTab === 'favorites' ? "currentColor" : "none"} /> Favorites
            {favorites.length > 0 && (
              <span className="bg-white text-jacare-600 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="w-full max-w-md px-5 flex flex-col gap-6 pb-20">
        
        {activeTab === 'search' ? (
          <>
            {/* Input Section */}
            <div className="bg-jacare-800/50 p-4 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-sm">
              <textarea
                className="w-full bg-jacare-900/50 text-white rounded-xl p-4 min-h-[100px] border border-gray-700 focus:border-jacare-500 focus:ring-1 focus:ring-jacare-500 outline-none resize-none placeholder-gray-600 transition-all text-sm"
                placeholder="e.g. 'That sad piano song from the end of the movie Inception' or 'Lyrics about falling in the deep end'..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <AudioRecorder 
                key={audioData ? 'has-audio' : 'no-audio'} 
                onRecordingComplete={handleAudioComplete} 
                onClear={handleClearAudio} 
              />
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-red-200 text-sm">{state.error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSearch}
                disabled={state.isLoading}
                className="w-full bg-jacare-500 hover:bg-jacare-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-jacare-900/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Find Music
                  </>
                )}
              </button>

              {hasContent && !state.isLoading && (
                <button 
                  onClick={clearAll}
                  className="text-gray-500 text-xs font-medium hover:text-white transition-colors flex items-center justify-center gap-1 py-2"
                >
                  <X size={14} /> Clear All
                </button>
              )}
            </div>

            {/* Results List */}
            {state.results.length > 0 && (
               <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-2">
                 Results <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{state.results.length}</span>
               </h2>
            )}
            
            {renderSongList(state.results, !state.isLoading && searchText && !state.error ? "No results found yet." : "Search results will appear here.")}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h2 className="text-lg font-bold text-white mb-4">Your Library</h2>
             {renderSongList(favorites, "You haven't added any songs to your favorites yet.")}
          </div>
        )}
      </main>
    </div>
  );
}