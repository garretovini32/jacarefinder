import React, { useState, useCallback } from 'react';
import { Search, Music2, AlertCircle, Play, Loader2, X } from 'lucide-react';
import { Song, SearchState } from './types';
import { searchMusic } from './services/geminiService';
import AudioRecorder from './components/AudioRecorder';

export default function App() {
  const [searchText, setSearchText] = useState('');
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string } | null>(null);
  
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    results: [],
  });

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

    try {
      const results = await searchMusic(searchText, audioData?.base64 || null, audioData?.mimeType);
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
    // Note: AudioRecorder needs to be reset via key or ref if we want to force reset it from here,
    // but typically the user uses the recorder's own discard button.
    // For simplicity, we render a key on AudioRecorder to force re-mount when fully clearing.
  };

  const hasContent = searchText.length > 0 || audioData !== null || state.results.length > 0;

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

      <main className="w-full max-w-md px-5 flex flex-col gap-6 pb-20">
        
        {/* Intro Text */}
        <div className="text-center mb-2">
           <p className="text-gray-400 text-sm">
             Describe a scene, type partial lyrics, or hum a melody. We'll find the track.
           </p>
        </div>

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
        <div className="flex flex-col gap-4 mt-2">
          {state.results.length > 0 && (
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Results <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{state.results.length}</span>
            </h2>
          )}

          {state.results.map((song) => (
            <div 
              key={song.id} 
              className="bg-jacare-800 p-4 rounded-xl border border-gray-700/50 flex items-center gap-4 group hover:border-jacare-500/50 transition-colors"
            >
              {/* Cover Placeholder */}
              <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                <Music2 className="text-gray-400 group-hover:text-jacare-500 transition-colors" size={24} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base truncate">{song.titulo}</h3>
                <p className="text-gray-400 text-sm truncate mb-1">{song.artista}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-jacare-500 border border-gray-700">
                    {song.matchType}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-900 text-gray-400 border border-gray-700">
                    {song.confidence}% Match
                  </span>
                </div>
              </div>

              {/* Action */}
              <button 
                className="w-10 h-10 rounded-full bg-jacare-500/10 text-jacare-500 flex items-center justify-center hover:bg-jacare-500 hover:text-white transition-all"
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.titulo} ${song.artista}`)}`, '_blank')}
                title="Search on YouTube"
              >
                <Play size={18} fill="currentColor" />
              </button>
            </div>
          ))}

          {!state.isLoading && state.results.length === 0 && searchText && !state.error && (
             <div className="text-center py-10 opacity-50">
               <Music2 size={48} className="mx-auto mb-3 text-gray-600" />
               <p className="text-gray-400 text-sm">No results found yet.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}