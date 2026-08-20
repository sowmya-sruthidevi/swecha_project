import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import GroupCard from '../components/GroupCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  PlusCircle,
  Compass,
  FileEdit,
  Users,
  Trash2,
  AlertTriangle,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';

export default function MyGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId || user?.id;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [groups, setGroups] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const res = await groupApi.getGroups();
        setGroups(res.data.groups || []);
      } catch {
        toast.error('Failed to load your groups');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchGroups();
  }, [userId]);

  const created = groups.filter(
    (g) => g.createdBy === userId || g.createdBy?._id === userId
  );
  const joined = groups.filter((g) => {
    const isCreator = g.createdBy === userId || g.createdBy?._id === userId;
    const isMember = g.members?.some(
      (m) => (typeof m === 'string' ? m === userId : m._id === userId)
    );
    return isMember && !isCreator;
  });

  const display =
    activeTab === 'created' ? created : activeTab === 'joined' ? joined : [...created, ...joined];

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await groupApi.deleteGroup(deleteModal.groupId || deleteModal._id);
      setGroups((prev) =>
        prev.filter((g) => (g.groupId || g._id) !== (deleteModal.groupId || deleteModal._id))
      );
      toast.success(`${deleteModal.groupName} deleted`);
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async (group) => {
    const gid = group.groupId || group._id;
    try {
      setLeavingId(gid);
      const res = await groupApi.leaveGroup(gid);
      const updated = res.data.group;
      setGroups((prev) =>
        prev.map((g) =>
          (g.groupId || g._id) === (updated.groupId || updated._id) ? updated : g
        )
      );
      toast.success(`Left ${group.groupName}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="my-groups">
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'all', label: 'All Groups', count: created.length + joined.length, icon: Users },
    { id: 'created', label: 'Created by Me', count: created.length, icon: FileEdit },
    { id: 'joined', label: "I've Joined", count: joined.length, icon: Compass },
  ];

  return (
    <DashboardLayout active="my-groups">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 animate-slide-up">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              My Study Groups
            </h2>
            <p className="text-gray-500">
              Manage the groups you've created and joined
            </p>
          </div>
          <Button onClick={() => navigate('/create-group')}>
            <PlusCircle className="w-5 h-5" />
            Create New Group
          </Button>
        </div>

        <div className="card p-2 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {display.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {display.map((group) => {
              const gid = group.groupId || group._id;
              const isCreator = group.createdBy === userId || group.createdBy?._id === userId;
              return (
                <div
                  key={gid}
                  className="relative card p-0 overflow-hidden card-hover animate-fade-in"
                >
                  <GroupCard
                    group={{
                      ...group,
                      groupId: gid,
                      isCreator,
                      isMember: true,
                    }}
                    variant="default"
                    leaveLoading={leavingId === gid}
                  />
                  <div className="flex gap-2 p-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                    {isCreator ? (
                      <>
                        <button
                          onClick={() => navigate(`/groups/${gid}/edit`)}
                          disabled={deleting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileEdit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteModal(group)}
                          disabled={deleting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleLeave(group)}
                        disabled={leavingId === gid}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {leavingId === gid ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Leaving...
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            Leave Group
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={
              activeTab === 'all'
                ? "You don't have any groups yet"
                : activeTab === 'created'
                ? "You haven't created any groups yet"
                : "You haven't joined any groups yet"
            }
            description={
              activeTab === 'all'
                ? 'Start your first group or explore existing ones to find your study community.'
                : activeTab === 'created'
                ? 'Start your first study group and invite friends to join you.'
                : 'Browse groups and find study partners who share your interests.'
            }
            icon="groups"
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/explore')}>
                  <Compass className="w-4 h-4" />
                  Explore Groups
                </Button>
                <Button onClick={() => navigate('/create-group')}>
                  <PlusCircle className="w-4 h-4" />
                  Create First Group
                </Button>
              </div>
            }
          />
        )}

        {deleteModal && (
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
                  onClick={() => setDeleteModal(null)}
                  className="ml-auto w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900">"{deleteModal.groupName}"</strong>?
                This will permanently remove the group and all its data.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="btn-outline"
                  disabled={deleting}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-primary !bg-red-600 !hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
