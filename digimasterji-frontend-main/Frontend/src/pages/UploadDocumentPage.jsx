import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../api/admin';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Tag, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const UploadDocumentPage = () => {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].value);
  const [language, setLanguage] = useState('en');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported for textbook ingestion.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF document to upload');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await adminApi.uploadDocument(file, subject, language, tags);
      setResult(res.data);
    } catch (err) {
      console.error('Failed to upload document:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to ingest document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Upload Curriculum Document</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ingest NCERT chapters or science PDFs into ChromaDB vector index
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Document Ingested Successfully!</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
              Generated <strong>{result.chunks_created || result.chunks_count || result.chunks || 'multiple'}</strong> semantic chunks with embeddings.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate('/admin/documents')}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl"
              >
                View Documents
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-violet-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-white mb-1">
                  {file ? file.name : 'Click to select PDF document'}
                </span>
                <span className="text-xs text-slate-500">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'NCERT chapters, textbook guides (Max 50MB)'}
                </span>
              </label>
            </div>

            {/* Subject and Language Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Subject Category
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub.value} value={sub.value} className="bg-slate-900 text-slate-100">
                      {sub.emoji} {sub.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Document Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-100">
                      {lang.label} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Topic Tags (Comma-separated)
              </label>
              <div className="relative">
                <Tag className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Chapter 6, Class 10, Life Processes"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing & Generating Vector Embeddings...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  <span>Ingest Document into Vector DB</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
