import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Languages, 
  Calendar, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../api/admin';

const AVATARS = ['🚀', '🌟', '🔬', '🦁', '🦉', '🎨', '⚡', '🤖', '🦊', '🌺'];

const GRADE_LEVELS = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
  10: '10th',
  11: '11th',
  12: '12th',
};

const formatApiError = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : '';
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join(' ');
  }
  return err.message || fallback;
};

export const CreateProfilePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '12',
    grade: '7',
    language: 'hi',
    avatar: '🚀',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createProfile } = useProfile();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const age = parseInt(formData.age, 10);
    const gradeNum = parseInt(formData.grade, 10);
    const language = LANGUAGE_OPTIONS.find((option) => option.value === formData.language);

    if (name.length < 2 || name.length > 50) {
      setError('Student name must be between 2 and 50 characters');
      return;
    }
    if (!Number.isInteger(age) || age < 5 || age > 18) {
      setError('Age must be between 5 and 18');
      return;
    }
    if (!GRADE_LEVELS[gradeNum]) {
      setError('Grade must be between 1st and 12th');
      return;
    }
    if (!language) {
      setError('Please choose a supported learning language');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProfile({
        name,
        age,
        grade_level: GRADE_LEVELS[gradeNum],
        preferred_language: language.label,
        avatar: formData.avatar,
      });
      navigate('/profiles');
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError(formatApiError(err, 'Failed to create profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-lg">
        {/* Top Back Link */}
        <Link
          to="/profiles"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profiles</span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Student Profile</h2>
            <p className="text-slate-400 text-sm mt-1">Set up learning preferences and target grade</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Choose Avatar
              </label>
              <div className="flex flex-wrap gap-2.5">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: emoji })}
                    className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      formData.avatar === emoji
                        ? 'bg-violet-600/30 border-2 border-violet-500 scale-110 shadow-lg shadow-violet-500/20'
                        : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Student Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Aarav"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Grade */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Grade / Class
                </label>
                <div className="relative">
                  <GraduationCap className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-slate-900 text-slate-100">
                        Class {i + 1}
                      </option>
                    ))}
                    <option value="11" className="bg-slate-900 text-slate-100">Class 11 (Science)</option>
                    <option value="12" className="bg-slate-900 text-slate-100">Class 12 (Science)</option>
                  </select>
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Age
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="age"
                    min="5"
                    max="18"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Preferred Learning Language
              </label>
              <div className="relative">
                <Languages className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-100">
                      {lang.label} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
