import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { profilesApi } from '../api/profiles';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Languages, 
  Calendar, 
  Loader2, 
  Check, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../api/admin';

const AVATARS = ['🚀', '🌟', '🔬', '🦁', '🦉', '🎨', '⚡', '🤖', '🦊', '🌺'];

export const EditProfilePage = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { refreshProfiles } = useProfile();

  const [formData, setFormData] = useState({
    name: '',
    age: '12',
    grade: '7',
    language: 'hi',
    avatar: '🚀',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await profilesApi.getProfileById(profileId);
        const p = res.data;
        setFormData({
          name: p.name || '',
          age: p.age?.toString() || '12',
          grade: p.grade?.toString() || '7',
          language: p.language || 'hi',
          avatar: p.avatar || '🚀',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to fetch profile details.');
      } finally {
        setLoading(false);
      }
    };
    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await profilesApi.updateProfile(profileId, {
        name: formData.name.trim(),
        age: parseInt(formData.age, 10) || 12,
        grade: formData.grade.toString(),
        language: formData.language,
        avatar: formData.avatar,
      });
      await refreshProfiles();
      navigate('/profiles');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this profile? All chat history and quiz progress for this student will be deleted.')) {
      return;
    }

    setDeleting(true);
    try {
      await profilesApi.deleteProfile(profileId);
      await refreshProfiles();
      navigate('/profiles');
    } catch (err) {
      console.error('Failed to delete profile:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Edit Profile</h2>
              <p className="text-slate-400 text-sm mt-1">Update details for {formData.name}</p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
              title="Delete Profile"
            >
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
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
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
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
                    max="22"
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
              disabled={saving}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
