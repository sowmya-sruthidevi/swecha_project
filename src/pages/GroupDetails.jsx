import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Users,
  PlusCircle,
  LogOut,
  FileEdit,
  Trash2,
  Share2,
  AlertTriangle,
  X,
  ShieldCheck,
  Sparkles,
  Crown,
  ExternalLink,
} from 'lucide-react';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId || user?.id;
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const res = await groupApi.getGroup(id);
        setGroup(res.data.group);
      } catch {
        toast.error('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGroup();
  }, [id]);

  const isCreator = group && (
    group.createdBy === userId ||
    group.createdBy?._id === userId
  );
  const isMember = group && group.members?.some(
    (m) => (typeof m === 'string' ? m === userId : m._id === userId)
  );

  const handleJoin = async () => {
    if (!group) return;
    setJoinLoading(true);
    try {
      const res = await groupApi.joinGroup(group.groupId || group._id);
      setGroup(res.data.group);
      toast.success(`Joined ${group.groupName}! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    try {
      const res = await groupApi.leaveGroup(group.groupId || group._id);
      setGroup(res.data.group);
      toast.success(`You left ${group.groupName}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    try {
      await groupApi.deleteGroup(group.groupId || group._id);
      toast.success(`${group.groupName} deleted`);
      navigate('/my-groups');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.success(`Share this link: ${url}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="explore">
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout active="explore">
        <div className="max-w-3xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Group Not Found</h2>
          <p className="text-gray-500 mb-6">This group may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const creatorName = group.creatorName || group.createdBy?.fullName || 'Unknown';
  const spotsLeft = group.maxMembers - (group.currentMembers || group.members?.length || 0);
  const isFull = spotsLeft <= 0;

  return (
    <DashboardLayout active="explore">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-white font-semibold transition-all duration-200 animate-slide-up"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 p-6 lg:p-10 text-white animate-slide-up">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 600 300" className="w-full h-full">
              <circle cx="550" cy="80" r="120" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="50" cy="250" r="80" stroke="white" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {group.subject}
                  </span>
                  {isCreator && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/30 text-xs font-semibold">
                      <Crown className="w-3.5 h-3.5" />
                      You're the creator
                    </span>
                  )}
                  {isMember && !isCreator && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Member
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                  {group.groupName}
                </h1>
                <p className="text-primary-100 text-base lg:text-lg leading-relaxed max-w-2xl">
                  {group.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-primary-100">
                  <Users className="w-4 h-4" />
                  Created by <span className="font-semibold text-white">{creatorName}</span>
                </div>
              </div>

              <div className="w-full lg:w-64 bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-primary-100">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Members</span>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    isFull ? 'bg-red-500/30 text-red-100' : 'bg-emerald-500/25 text-emerald-100'
                  }`}>
                    {isFull ? 'Full' : `${spotsLeft} spots`}
                  </span>
                </div>
                <p className="text-4xl font-bold">
                  {group.currentMembers || group.members?.length || 0}
                  <span className="text-lg text-primary-200">/{group.maxMembers}</span>
                </p>
                <div className="h-2 bg-white/15 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : 'bg-gradient-to-r from-emerald-300 to-emerald-500'
                    }`}
                    style={{ width: `${((group.currentMembers || group.members?.length || 0) / group.maxMembers) * 100}%` }}
                  />
                </div>
                <div className="mt-5 space-y-2">
                  {isCreator ? (
                    <>
                      <Button fullWidth onClick={() => navigate(`/groups/${id}/edit`)}>
                        <FileEdit className="w-5 h-5" />
                        Edit Group
                      </Button>
                      <button
                        onClick={() => setShowDelete(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-red-100 font-semibold rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Group
                      </button>
                    </>
                  ) : isMember ? (
                    <button
                      onClick={handleLeave}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/25 hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      Leave Group
                    </button>
                  ) : (
                    <Button fullWidth size="lg" loading={joinLoading} onClick={handleJoin} disabled={isFull}>
                      {!joinLoading && <PlusCircle className="w-5 h-5" />}
                      {isFull ? 'Group is Full' : joinLoading ? 'Joining...' : 'Join Group'}
                    </Button>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                    Share this group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 lg:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">A</span>
                About This Group
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {group.description}
              </p>
            </div>

            <div className="card p-6 lg:p-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">S</span>
                Schedule & Location
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Calendar, label: 'Meeting Date', value: group.date || 'TBD', color: 'primary' },
                  { icon: Clock, label: 'Time', value: group.time || 'TBD', color: 'purple' },
                  { icon: MapPin, label: 'Location', value: group.location || 'TBD', color: 'accent' },
                  {
                    icon: group.meetingLink ? ExternalLink : LinkIcon,
                    label: 'Meeting Link',
                    value: group.meetingLink || 'No link provided',
                    color: 'orange',
                    link: group.meetingLink,
                  },
                ].map((info, i) => {
                  const Icon = info.icon;
                  return (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl bg-${info.color}-100 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${info.color}-600`} />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {info.label}
                        </p>
                      </div>
                      {info.link ? (
                        <a
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 text-sm truncate hover:text-primary-600 transition-colors block"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 text-sm">{info.value}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 lg:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">M</span>
                Members ({group.currentMembers || group.members?.length || 0})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {group.members?.map((m, i) => {
                  const member = typeof m === 'string' ? { _id: m, fullName: 'Student', email: '' } : m;
                  const memberCreator = member._id === (group.createdBy?._id || group.createdBy);
                  const name = member.fullName || 'Student';
                  const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={member._id || i}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                          {memberCreator && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        </div>
                        {member.email && (
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {showDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="card p-6 max-w-md w-full animate-slide-up">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Group</h3>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setShowDelete(false)}
                  className="ml-auto w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900">"{group.groupName}"</strong>?
                This will permanently remove the group for all members.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <button onClick={() => setShowDelete(false)} className="btn-outline">
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn-primary !bg-red-600 !hover:bg-red-700">
                  <Trash2 className="w-4 h-4" />
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
