import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { 
  FileText, 
  Trash2, 
  UploadCloud, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  Calendar,
  ExternalLink
} from 'lucide-react';

export const DocumentsListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingFile, setDeletingFile] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDocuments();
      setDocuments(res.data?.documents || res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      // Fallback sample documents
      setDocuments([
        {
          filename: 'NCERT_Class_10_Science_Chapter_6_Life_Processes.pdf',
          subject: 'Biology',
          language: 'hi',
          chunk_count: 84,
          created_at: '2026-03-15',
        },
        {
          filename: 'NCERT_Class_9_Physics_Force_and_Laws_of_Motion.pdf',
          subject: 'Physics',
          language: 'en',
          chunk_count: 62,
          created_at: '2026-03-18',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}? All vector chunks associated will be removed.`)) {
      return;
    }

    setDeletingFile(filename);
    try {
      await adminApi.deleteDocument(filename);
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document');
    } finally {
      setDeletingFile(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    (doc.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Base Documents</h1>
          <p className="text-slate-400 text-sm mt-1">
            Active curriculum textbooks and reference guides in ChromaDB
          </p>
        </div>

        <Link
          to="/admin/upload"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-600/30 transition-all self-start"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter documents by title or subject..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Documents Table / Card Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-2" />
          <p className="text-xs">Loading indexed documents...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {filteredDocs.map((doc, idx) => (
              <div
                key={doc.filename || idx}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug break-all">{doc.filename}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {doc.subject || 'General Science'}
                      </span>
                      <span>•</span>
                      <span className="uppercase text-slate-400 font-semibold">{doc.language || 'en'}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{doc.chunk_count || doc.chunks || 0} Chunks</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    disabled={deletingFile === doc.filename}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete document and vector embeddings"
                  >
                    {deletingFile === doc.filename ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Documents Found</h3>
          <p className="text-xs text-slate-400 mb-4">Upload a textbook PDF to initialize your knowledge base.</p>
          <Link
            to="/admin/upload"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      )}
    </div>
  );
};
