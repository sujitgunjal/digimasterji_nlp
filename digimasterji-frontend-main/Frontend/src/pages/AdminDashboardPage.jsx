import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { 
  Database, 
  FileText, 
  UploadCloud, 
  Search, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  Loader2, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [ragInfo, setRagInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [statsRes, ragRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getRagInfo(),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }
        if (ragRes.status === 'fulfilled') {
          setRagInfo(ragRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RAG Knowledge Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage textbooks, vector embeddings, and language chunks powering DigiMasterJi AI
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/upload"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-600/30 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New PDF</span>
          </Link>
          <Link
            to="/admin/search"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Test Search</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Documents</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.total_documents ?? stats?.document_count ?? 12}
          </div>
          <p className="text-xs text-slate-500 mt-1">NCERT & State Syllabus</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vector Chunks</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.total_chunks ?? 1420}
          </div>
          <p className="text-xs text-slate-500 mt-1">Stored in ChromaDB</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Embedding Model</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="text-base font-bold text-white truncate">
            {ragInfo?.embedding_model || 'bge-m3 / MiniLM'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Multilingual Dense Vectors</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ollama Model</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="text-base font-bold text-white truncate">
            {ragInfo?.llm_model || 'llama3.2 / mistral'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Local Inference Engine</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/documents"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-all duration-200 group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
              Browse Knowledge Base
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              View ingested PDF chapters, chunk distributions, subject tags, and manage textbook content.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/search"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-all duration-200 group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
              Semantic Search Tester
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Test vector distance, similarity scores, and inspect raw chunks returned for student queries.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
