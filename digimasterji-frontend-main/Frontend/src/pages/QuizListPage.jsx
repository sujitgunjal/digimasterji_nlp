import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { quizzesApi } from '../api/quizzes';
import { SUBJECT_OPTIONS } from '../api/admin';
import { 
  BookOpen, 
  ArrowLeft, 
  Play, 
  Award, 
  Flame, 
  Loader2,
  BrainCircuit,
  X,
  AlertCircle
} from 'lucide-react';

export const QuizListPage = () => {
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [pickerError, setPickerError] = useState('');
  const [activeTab, setActiveTab] = useState('todo'); // 'todo' | 'completed'

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setListError('');
        const res = await quizzesApi.getPendingQuizzes();
        setQuizzes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
        setQuizzes([]);
        setListError(err.response?.data?.detail || 'Could not load quizzes.');
      } finally {
        setLoading(false);
      }
    };

    if (activeProfile) {
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, [activeProfile]);

  const openPicker = () => {
    setPickerOpen(true);
    setSubject('');
    setChapters([]);
    setSelectedChapter('');
    setPickerError('');
  };

  const handleSubjectChange = async (nextSubject) => {
    setSubject(nextSubject);
    setSelectedChapter('');
    setChapters([]);
    setPickerError('');
    if (!nextSubject) return;

    setChaptersLoading(true);
    try {
      const res = await quizzesApi.getChapters(nextSubject);
      setChapters(Array.isArray(res.data) ? res.data : []);
      if (!res.data?.length) {
        setPickerError(`No ${nextSubject} chapters are in the knowledge base yet. Upload that textbook first.`);
      }
    } catch (err) {
      console.error('Failed to load chapters:', err);
      setPickerError(err.response?.data?.detail || 'Could not load chapters.');
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!subject || !selectedChapter) {
      setPickerError('Choose a subject and the chapter you are studying.');
      return;
    }

    setGenerating(true);
    setPickerError('');
    try {
      const res = await quizzesApi.generateQuiz({
        subject,
        source_file: selectedChapter,
        difficulty: 'medium',
      });
      const quizId = res.data?._id || res.data?.id;
      if (!quizId) {
        setPickerError('The quiz was created, but no id was returned.');
        return;
      }
      navigate(`/quiz/${quizId}`);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      const detail = err.response?.data?.detail;
      setPickerError(typeof detail === 'string' ? detail : err.message || 'Failed to generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <Link
            to="/chat"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              <span>Assessment & Quizzes</span>
            </h1>
            <p className="text-xs text-slate-400">Test your concepts and earn XP for your streak</p>
          </div>
        </div>

        <button
          onClick={openPicker}
          disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-600/30 flex items-center space-x-2 transition-all duration-200"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BrainCircuit className="w-4 h-4" />
          )}
          <span>Generate AI Quiz</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-6 flex-1">
        {/* Streak Bar Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keep Your Daily Streak Burning!</h2>
              <p className="text-xs text-slate-400">Complete 1 quiz every day to level up your XP multiplier</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-2xl font-extrabold text-amber-400">{activeProfile?.streak_count || 1} Days</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-3 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('todo')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'todo'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Quizzes
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed History
          </button>
        </div>

        {/* Quizzes List */}
        {listError && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{listError}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-2" />
            <p className="text-xs">Loading available quizzes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.length === 0 && (
              <div className="md:col-span-2 p-10 text-center text-sm text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
                No quizzes yet. Generate one from the chapter you are studying.
              </div>
            )}
            {quizzes.map((quiz) => (
              <div
                key={quiz._id || quiz.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                      {quiz.topic || 'Science'}
                    </span>
                    <span className="flex items-center space-x-1 text-xs text-amber-400 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      <span>+{quiz.xp_reward || 50} XP</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{quiz.topic || quiz.title || 'STEM Concept Quiz'}</h3>
                  <p className="text-xs text-slate-400 mb-4 flex items-center space-x-3">
                    <span>{quiz.total_questions || quiz.question_count || 5} Questions</span>
                    <span>•</span>
                    <span>Difficulty: {quiz.difficulty || 'Medium'}</span>
                  </p>
                </div>

                <Link
                  to={`/quiz/${quiz._id || quiz.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-violet-600/25 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Quiz</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        {pickerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Generate a chapter quiz</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Pick the subject, then the chapter you are studying. Questions come from that textbook plus the tutor’s own knowledge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !generating && setPickerOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={generating}
                className="w-full mb-4 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a subject</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Chapter</label>
              <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
                {chaptersLoading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading chapters...</span>
                  </div>
                )}
                {!chaptersLoading && subject && chapters.length === 0 && (
                  <p className="text-xs text-slate-500 py-3">No chapters found for this subject.</p>
                )}
                {chapters.map((chapter) => (
                  <button
                    key={chapter.source_file}
                    type="button"
                    disabled={generating}
                    onClick={() => setSelectedChapter(chapter.source_file)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      selectedChapter === chapter.source_file
                        ? 'border-violet-500 bg-violet-600/15 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-semibold">{chapter.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{chapter.source_file}</span>
                  </button>
                ))}
              </div>

              {pickerError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {pickerError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={generating || !selectedChapter}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                <span>{generating ? 'Writing quiz from this chapter...' : 'Generate quiz'}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
