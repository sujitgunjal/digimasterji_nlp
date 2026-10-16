import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { 
  UserPlus, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  Flame, 
  Award, 
  Settings,
  ChevronRight,
  Edit2
} from 'lucide-react';

export const ProfileSelectionPage = () => {
  const { profiles, loading, refreshProfiles, activateProfile } = useProfile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const handleSelectProfile = async (profileId) => {
    try {
      await activateProfile(profileId);
      navigate('/chat');
    } catch (err) {
      console.error('Failed to activate profile:', err);
    }
  };

  const getAvatarGradient = (idx) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-600',
      'from-pink-500 to-rose-600',
      'from-cyan-400 to-blue-600',
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">DigiMasterJi</h1>
            <p className="text-xs text-slate-400">Account: {user?.full_name || user?.email || 'Master'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin"
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-violet-300 border border-violet-500/30 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span>Admin RAG</span>
          </Link>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Who is learning today?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Select a student profile to continue your AI-guided science journey
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {profiles && profiles.length > 0 ? (
            profiles.map((prof, idx) => {
              const profileId = prof._id || prof.id;
              return (
                <div
                  key={profileId}
                  className="group relative bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 flex flex-col justify-between"
                >
                  <div
                    onClick={() => handleSelectProfile(profileId)}
                    className="cursor-pointer flex flex-col items-center text-center"
                  >
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        idx
                      )} flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-4 group-hover:scale-105 transition-transform duration-300`}
                    >
                      {prof.name ? prof.name.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
                      {prof.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3">
                      <span>Grade {prof.grade || '6-10'}</span>
                      <span>•</span>
                      <span className="capitalize">{prof.language || 'English'}</span>
                    </div>

                    {/* Stats Pill */}
                    <div className="flex items-center space-x-3 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
                      <span className="flex items-center space-x-1 text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{prof.streak_count || 0}d</span>
                      </span>
                      <span className="flex items-center space-x-1 text-violet-400">
                        <Award className="w-3.5 h-3.5" />
                        <span>{prof.xp || 0} XP</span>
                      </span>
                    </div>
                  </div>

                  {/* Edit profile icon */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <Link
                      to={`/profiles/${profileId}/edit`}
                      className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>

                    <button
                      onClick={() => handleSelectProfile(profileId)}
                      className="inline-flex items-center space-x-1 text-violet-400 group-hover:text-violet-300 font-semibold"
                    >
                      <span>Start</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : null}

          {/* Add Profile Card */}
          <Link
            to="/profiles/create"
            className="bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-violet-500/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[220px] group"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:bg-violet-600/20 group-hover:scale-105 transition-all">
              <UserPlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Add Student Profile</h3>
            <p className="text-xs text-slate-400">Create a personalized space for another child</p>
          </Link>
        </div>
      </main>
    </div>
  );
};
