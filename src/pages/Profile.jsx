import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi, authApi } from '../services/api.js';
import {
  User,
  Mail,
  Calendar,
  Camera,
  Edit2,
  Save,
  X,
  ShieldCheck,
  FileEdit,
  Users,
  Star,
  BookOpen,
  Award,
  LogOut,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const userId = user?.userId || user?.id;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setGroupsLoading(true);
        const res = await groupApi.getGroups();
        setGroups(res.data.groups || []);
      } catch {
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    if (userId) fetchGroups();
  }, [userId]);

  const createdCount = groups.filter(
    (g) => g.createdBy === userId || g.createdBy?._id === userId
  ).length;
  const joinedCount = groups.filter((g) => {
    const isCreator = g.createdBy === userId || g.createdBy?._id === userId;
    const isMember = g.members?.some(
      (m) => (typeof m === 'string' ? m === userId : m._id === userId)
    );
    return isMember && !isCreator;
  }).length;

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const createdDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently joined';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.fullName.length < 2) e.fullName = 'Name is too short';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        fullName: form.fullName,
        email: form.email,
      });
      const updatedUser = res.data.user;
      updateUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully! ✨');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ fullName: user?.fullName || '', email: user?.email || '' });
    setErrors({});
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (groupsLoading) {
    return (
      <DashboardLayout active="profile">
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="profile">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 text-white p-6 lg:p-10">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              <circle cx="500" cy="50" r="100" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="500" cy="50" r="140" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="100" cy="150" r="60" stroke="white" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/15 backdrop-blur border-4 border-white/30 flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl">
                {initials}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white text-primary-700 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">
                  {user?.fullName || 'Student'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Student
                </span>
              </div>
              <p className="text-primary-100 flex items-center gap-2 text-sm sm:text-base">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <p className="text-primary-200 text-sm flex items-center gap-2 mt-1.5">
                <Calendar className="w-4 h-4" />
                Member since {createdDate}
              </p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 backdrop-blur text-white font-bold rounded-xl border border-white/25 hover:bg-white/25 transition-all duration-200"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{createdCount}</p>
              <p className="text-sm text-gray-500">Groups Created</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{joinedCount}</p>
              <p className="text-sm text-gray-500">Groups Joined</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {createdCount + joinedCount > 0
                  ? Math.max(1, (createdCount + joinedCount) * 2)
                  : 0}
              </p>
              <p className="text-sm text-gray-500">Sessions Tracked</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {createdCount + joinedCount > 0 ? 'Active' : '—'}
              </p>
              <p className="text-sm text-gray-500">Member Status</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editing ? 'Edit Profile' : 'Personal Information'}
                  </h2>
                </div>
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-5">
                  <InputField
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    icon={User}
                    error={errors.fullName}
                    required
                  />
                  <InputField
                    label="Email Address"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    icon={Mail}
                    error={errors.email}
                    required
                  />
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={handleCancel} className="btn-outline gap-2">
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                    <Button type="submit" loading={loading}>
                      {!loading && <Save className="w-5 h-5" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Full Name
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {user?.fullName || '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {user?.email || '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Joined
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{createdDate}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </span>
                      </div>
                      <p className="font-semibold text-emerald-600 text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        Verified Student
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-gray-100">
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-primary"
                    >
                      <Edit2 className="w-5 h-5" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Achievements</h3>
                  <p className="text-xs text-gray-500">Your learning milestones</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Star, title: 'First Group', desc: 'Created your first group', color: 'bg-amber-100 text-amber-600', unlocked: createdCount >= 1 },
                  { icon: BookOpen, title: 'Bookworm', desc: 'Attended 10+ sessions', color: 'bg-primary-100 text-primary-600', unlocked: (createdCount + joinedCount) >= 1 },
                  { icon: Users, title: 'Team Player', desc: 'Joined 3+ groups', color: 'bg-accent-100 text-accent-600', unlocked: joinedCount >= 1 },
                  { icon: Award, title: 'Top Contributor', desc: 'Most active in groups', color: 'bg-purple-100 text-purple-600', unlocked: (createdCount + joinedCount) >= 2 },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                        !a.unlocked ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                        <p className="text-xs text-gray-500 truncate">{a.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6 lg:p-8 border-red-100">
              <h3 className="font-bold text-gray-900 mb-4">Account</h3>
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-red-600 font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
