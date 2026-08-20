import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import GroupCard from '../components/GroupCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  Users,
  Compass,
  PlusCircle,
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId || user?.id;
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({
    groupsCreated: 0,
    groupsJoined: 0,
    availableGroups: 0,
    upcomingSessions: 0,
  });
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupsRes, statsRes] = await Promise.all([
          groupApi.getGroups(),
          groupApi.getDashboardStats(),
        ]);
        setGroups(groupsRes.data.groups || []);
        setStats(statsRes.data.stats || stats);
      } catch {
        toast.error('Failed to load dashboard data');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const isMemberOf = (g) =>
    g.createdBy === userId ||
    g.createdBy?._id === userId ||
    (g.members?.some((m) => (typeof m === 'string' ? m === userId : m._id === userId)));

  const myCreated = groups.filter(
    (g) => g.createdBy === userId || g.createdBy?._id === userId
  );
  const myJoined = groups.filter((g) => isMemberOf(g) && !(g.createdBy === userId || g.createdBy?._id === userId));
  const allMyGroups = [...myCreated, ...myJoined];

  const recommended = groups
    .filter((g) => !isMemberOf(g))
    .slice(0, 4);

  const upcoming = allMyGroups.slice(0, 3);

  const handleJoinGroup = async (group) => {
    const gid = group.groupId || group._id;
    setJoiningId(gid);
    try {
      const res = await groupApi.joinGroup(gid);
      const updatedGroup = res.data.group;
      setGroups((prev) =>
        prev.map((g) =>
          (g.groupId || g._id) === (updatedGroup.groupId || updatedGroup._id) ? updatedGroup : g
        )
      );
      setStats((s) => ({
        ...s,
        groupsJoined: s.groupsJoined + 1,
        upcomingSessions: s.upcomingSessions + 1,
        availableGroups: Math.max(0, s.availableGroups - 1),
      }));
      toast.success(`Joined ${group.groupName}! 🎉`);
      setTimeout(() => navigate(`/groups/${gid}`), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="dashboard">
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="sm:hidden mb-6 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Student'} 👋
          </h2>
          <p className="text-gray-500 text-sm">
            Find a group, collaborate, and make your next study session productive.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 p-8 lg:p-10 text-white animate-slide-up">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-4">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Pro tip of the day
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 leading-tight">
                Ready to ace your next exam?
              </h2>
              <p className="text-primary-100 text-base lg:text-lg leading-relaxed">
                Join a study group today and start collaborating with students who share your academic goals.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/create-group')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-primary-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <PlusCircle className="w-5 h-5" />
                Create Group
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/15 backdrop-blur text-white font-bold rounded-xl border border-white/25 hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Compass className="w-5 h-5" />
                Explore Groups
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Groups Created"
            value={stats.groupsCreated}
            icon={PlusCircle}
            color="primary"
          />
          <StatCard
            title="Groups Joined"
            value={stats.groupsJoined}
            icon={Users}
            color="accent"
          />
          <StatCard
            title="Available Groups"
            value={stats.availableGroups}
            icon={Compass}
            color="purple"
          />
          <StatCard
            title="Upcoming Sessions"
            value={stats.upcomingSessions}
            icon={Calendar}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Recommended Groups</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Groups we think you'll love
                </p>
              </div>
              <button
                onClick={() => navigate('/explore')}
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recommended.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {recommended.map((group) => (
                  <GroupCard
                    key={group.groupId || group._id}
                    group={{
                      ...group,
                      groupId: group.groupId || group._id,
                    }}
                    onJoin={handleJoinGroup}
                    joinLoading={joiningId === (group.groupId || group._id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recommendations yet"
                description="Explore groups to get personalized recommendations based on your interests."
                icon="explore"
                action={
                  <Button onClick={() => navigate('/explore')}>
                    Explore Groups
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                }
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Upcoming Sessions</h3>
                    <p className="text-xs text-gray-500">Your next study meetings</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/my-groups')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {(upcoming.length > 0 ? upcoming : []).map((g) => {
                  const gid = g.groupId || g._id;
                  return (
                    <button
                      key={gid}
                      onClick={() => navigate(`/groups/${gid}`)}
                      className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {g.groupName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                            {g.groupName}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {[g.date, g.time].filter(Boolean).join(' at ') ||
                              g.schedule ||
                              'Schedule TBD'}
                          </p>
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            {g.subject}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {allMyGroups.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No sessions yet. Explore groups!
                  </p>
                )}
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-amber-50 via-white to-pink-50 border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Activity</h3>
                  <p className="text-xs text-gray-500">Your study overview</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Total Groups</span>
                  <span className="text-sm font-bold text-primary-600">
                    {allMyGroups.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Created</span>
                  <span className="text-sm font-bold text-accent-600">
                    {myCreated.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Joined</span>
                  <span className="text-sm font-bold text-purple-600">
                    {myJoined.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {allMyGroups.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">My Active Groups</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Continue studying with your groups
                </p>
              </div>
              <button
                onClick={() => navigate('/my-groups')}
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Manage all
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allMyGroups.slice(0, 3).map((group) => {
                const gid = group.groupId || group._id;
                return (
                  <GroupCard
                    key={gid}
                    group={{
                      ...group,
                      groupId: gid,
                      isCreator: group.createdBy === userId || group.createdBy?._id === userId,
                      isMember: true,
                    }}
                    variant="default"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
