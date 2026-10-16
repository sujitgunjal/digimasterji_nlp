import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Mic, 
  BookOpen, 
  Award, 
  WifiOff, 
  Languages, 
  ArrowRight,
  BrainCircuit,
  GraduationCap,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-violet-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
              DigiMasterJi
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2 rounded-lg shadow-md shadow-violet-600/30 transition-all duration-200 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Multilingual Science Tutor</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight sm:leading-none mb-6">
            Learn Science in{' '}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              Your Own Language
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
            DigiMasterJi is an intelligent, voice-first AI tutor tailored for Indian students. 
            Speak or type in Hindi, English, or regional languages, learn STEM concepts, and conquer daily quizzes even offline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 transition-all duration-200 hover:scale-[1.02]"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-base font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all duration-200"
            >
              <span>Explore as Parent / Teacher</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Built for Every Indian Learner
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Empowering students from tier 2 and rural regions with high-fidelity STEM education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4 group-hover:bg-violet-600/30">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Voice-First Experience</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Speak directly to DigiMasterJi. Ask questions naturally with voice recording and listen to spoken answers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-600/30">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multilingual Mastery</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Supports English, Hindi, Bengali, Tamil, Telugu, Marathi, and more with localized terminology.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600/30">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Offline-Ready Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                IndexedDB-backed local storage lets learners study, take quizzes, and cache answers without constant internet.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-600/30">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Streaks & Gamification</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Earn XP, maintain daily study streaks, unlock achievement badges, and climb family and regional leaderboards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:bg-cyan-600/30">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">RAG Knowledge Base</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Curated textbook content ingested into ChromaDB ensures mathematically and scientifically accurate responses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all duration-200 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4 group-hover:bg-rose-600/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Profile Family Hub</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                One master account for parents to manage multiple children profiles with independent progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-sm text-slate-500">
        <p>© 2026 DigiMasterJi. AI-Powered Vernacular Learning Platform.</p>
      </footer>
    </div>
  );
};
