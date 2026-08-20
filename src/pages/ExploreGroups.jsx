import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import GroupCard from '../components/GroupCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  Search,
  Filter,
  Compass,
  ArrowRight,
  PlusCircle,
  X,
} from 'lucide-react';

const SUBJECTS = [
  'All Subjects',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Economics',
  'History',
  'Psychology',
  'Engineering',
  'Business',
  'Other',
];

export default function ExploreGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = user?.userId || user?.id;
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const searchTimer = useRef(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter !== 'All Subjects') params.subject = subjectFilter;
      if (search.trim()) params.search = search.trim();
      if (sortBy) params.sort = sortBy;
      const res = await groupApi.getGroups(params);
      setGroups(res.data.groups || []);
    } catch {
      toast.error('Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [userId, subjectFilter, sortBy, search]);

  useEffect(() => {
    if (!userId) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchGroups();
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [fetchGroups, userId]);

  const handleJoin = async (group) => {
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
      toast.success(`Joined ${group.groupName}! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoiningId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSubjectFilter('All Subjects');
    setSortBy('newest');
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

  const hasActiveFilters = search || subjectFilter !== 'All Subjects' || sortBy !== 'newest';

  return (
    <DashboardLayout active="explore">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="animate-slide-up">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              Explore Groups
            </h2>
            <p className="text-gray-500">
              Discover study groups that match your interests and goals
            </p>
          </div>
          <Button onClick={() => navigate('/create-group')} className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <PlusCircle className="w-5 h-5" />
            Create New Group
          </Button>
        </div>

        <div className="card p-5 lg:p-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups by name, subject, or keywords..."
                className="w-full pl-12 pr-10 py-3.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`lg:hidden inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border-2 ${
                  filtersOpen ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                } transition-all font-semibold`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </button>

              <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full lg:w-auto px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 font-medium bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="available">Most Spots</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block pt-5 mt-5 border-t border-gray-100`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Subjects:</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubjectFilter(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      subjectFilter === s
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {groups.length > 0 ? (
          <>
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-4">
                <p className="text-gray-600 font-medium">
                  Found <span className="font-bold text-primary-600">{groups.length}</span> group
                  {groups.length !== 1 && 's'}
                  {hasActiveFilters && ' matching your search'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const gid = group.groupId || group._id;
                const isCreator = group.createdBy === userId || group.createdBy?._id === userId;
                const isMember = group.members?.some(
                  (m) => (typeof m === 'string' ? m === userId : m._id === userId)
                );
                return (
                  <GroupCard
                    key={gid}
                    group={{
                      ...group,
                      groupId: gid,
                      isCreator,
                      isMember,
                    }}
                    onJoin={handleJoin}
                    joinLoading={joiningId === gid}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            title="No groups found"
            description={
              hasActiveFilters
                ? "We couldn't find any groups matching your search. Try adjusting your filters or create a new group."
                : "Be the first to create a study group! Start a group for your subject and invite friends to join."
            }
            icon="explore"
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => navigate('/create-group')}>
                  <PlusCircle className="w-4 h-4" />
                  Create First Group
                </Button>
              </div>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
