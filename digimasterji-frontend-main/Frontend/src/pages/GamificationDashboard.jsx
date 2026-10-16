import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { quizzesApi } from '../api/quizzes';
import { 
  Award, 
  Flame, 
  Trophy, 
  ArrowLeft, 
  Sparkles, 
  Medal, 
  CheckCircle2, 
  Lock, 
  TrendingUp,
  Users
} from 'lucide-react';

const BADGES = [
  { id: 'first_chat', title: 'Curious Mind', desc: 'Ask your first question to DigiMasterJi', icon: '🌱', unlocked: true },
  { id: 'streak_3', title: 'Consistency Champion', desc: 'Maintain a 3-day study streak', icon: '🔥', unlocked: true },
  { id: 'quiz_master', title: 'Quiz Whiz', desc: 'Score 100% in any STEM quiz', icon: '🎯', unlocked: true },
  { id: 'science_guru', title: 'Einstein in Training', desc: 'Complete 25 science lessons', icon: '⚡', unlocked: false },
  { id: 'polyglot', title: 'Bilingual Scholar', desc: 'Learn topics in 2 different languages', icon: '🌐', unlocked: false },
  { id: 'streak_10', title: 'Streak Legend', desc: 'Reach a 10-day unbroken streak', icon: '🏆', unlocked: false },
];

export const GamificationDashboard = () => {
  const { activeProfile } = useProfile();
  const [leaderboard, setLeaderboard] = useState([]);
  const [scope, setScope] = useState('family'); // 'family' | 'global'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await quizzesApi.getLeaderboard(scope);
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([
          { name: activeProfile?.name || 'You', xp: 320, streak: 3, rank: 1 },
          { name: 'Priya Sharma', xp: 280, streak: 2, rank: 2 },
          { name: 'Rohan Verma', xp: 210, streak: 1, rank: 3 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [scope, activeProfile]);

  const currentXP = activeProfile?.xp || 320;
  const level = Math.floor(currentXP / 100) + 1;
  const nextLevelXP = level * 100;
  const progressToNext = ((currentXP % 100) / 100) * 100;

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
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Progress & Trophies</span>
            </h1>
            <p className="text-xs text-slate-400">Track your learning journey, unlock badges, and rise</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full p-6 flex-1 space-y-8">
        {/* Level & XP Card */}
        <div className="bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-violet-600/30">
                {activeProfile?.avatar || '🚀'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">{activeProfile?.name || 'Student'}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Level {level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Total XP: <span className="text-violet-300 font-bold">{currentXP} XP</span> • {nextLevelXP - currentXP} XP to Level {level + 1}
                </p>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="flex items-center space-x-3 bg-slate-950/60 px-5 py-3 rounded-2xl border border-slate-800">
              <Flame className="w-8 h-8 text-amber-400 fill-amber-400/20" />
              <div>
                <div className="text-lg font-black text-amber-400">{activeProfile?.streak_count || 3} Days</div>
                <div className="text-[11px] text-slate-400">Daily Streak</div>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges Showcase */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-violet-400" />
            <span>Achievement Badges</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                  b.unlocked
                    ? 'bg-slate-900/80 border-violet-500/30 shadow-lg shadow-violet-500/5'
                    : 'bg-slate-900/30 border-slate-800/60 opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl mb-2">{b.icon}</div>
                <h4 className="text-xs font-bold text-white mb-1">{b.title}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
                <div className="mt-3">
                  {b.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Medal className="w-5 h-5 text-amber-400" />
              <span>Leaderboard</span>
            </h3>

            <div className="flex space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setScope('family')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  scope === 'family' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Family
              </button>
              <button
                onClick={() => setScope('global')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  scope === 'global' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Global
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                          : 'text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <p className="text-xs text-slate-400">{item.streak || 1} day streak</p>
                    </div>
                  </div>

                  <div className="text-sm font-extrabold text-violet-400">
                    {item.xp || 0} XP
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
