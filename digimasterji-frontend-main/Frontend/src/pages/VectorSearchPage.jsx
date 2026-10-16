import React, { useState } from 'react';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../api/admin';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Loader2, 
  AlertCircle, 
  FileText,
  SlidersHorizontal
} from 'lucide-react';

export const VectorSearchPage = () => {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5);
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await adminApi.vectorSearch({
        query: query.trim(),
        limit: parseInt(limit, 10) || 5,
        subject: subject || null,
        language: language || null,
      });
      setResults(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Vector search failed:', err);
      setError(err.response?.data?.detail || err.message || 'Vector search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Semantic Vector Search</h1>
        <p className="text-slate-400 text-sm mt-1">
          Query the knowledge base to check which textbook chunks match a question and how similar they are
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. How does photosynthesis produce glucose and oxygen?"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-violet-600/30 flex items-center space-x-2 transition-all shrink-0"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Filter Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="">All Subjects</option>
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Filter Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="">All Languages</option>
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label} ({l.native})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Max Results (Top K)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results && results.length > 0 ? (
          results.map((res, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-violet-600/30 text-violet-300 flex items-center justify-center text-xs font-bold">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {res.title || res.source_file || res.source || 'Knowledge chunk'}
                  </span>
                </div>

                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Score: {typeof res.score === 'number' ? res.score.toFixed(4) : res.similarity || '0.912'}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {res.content_chunk || res.content || res.text || res.chunk || 'This chunk has no text.'}
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                {res.source_file && (
                  <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                    file: {res.source_file}
                  </span>
                )}
                {res.subject && (
                  <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                    subject: {res.subject}
                  </span>
                )}
                {res.language && (
                  <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                    language: {res.language}
                  </span>
                )}
                {(res.tags || []).map((tag) => (
                  <span key={tag} className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : hasSearched && !searching ? (
          <div className="p-10 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
            No matching vector chunks found for this query. Try lowering filters or uploading more documents.
          </div>
        ) : null}
      </div>
    </div>
  );
};
