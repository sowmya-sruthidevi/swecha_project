import { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  FileText,
  Star,
  Send,
  Upload,
  Download,
  Loader2
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
  const [activeTab, setActiveTab] = useState('Overview');

  const [message, setMessage] = useState('');
  const [mockMessages, setMockMessages] = useState([
    { id: 1, text: 'hello', sender: 'bhanu', time: '09:41 PM', isMe: true }
  ]);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resource', file);

    try {
      const res = await groupApi.uploadResource(id, formData);
      setGroup(prev => ({
        ...prev,
        resources: [...(prev.resources || []), res.data.resource]
      }));
      toast.success('Resource uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const now = new Date();
    setMockMessages([...mockMessages, {
      id: Date.now(),
      text: message,
      sender: user?.fullName || 'Me',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }]);
    setMessage('');
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

  const spotsLeft = group.maxMembers - (group.currentMembers || group.members?.length || 0);
  const isFull = spotsLeft <= 0;

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: null },
    { id: 'Discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'Sessions', label: 'Sessions', icon: Clock },
    { id: 'Members', label: 'Members', icon: Users },
    { id: 'Reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <DashboardLayout active="explore">
      <div className="max-w-6xl mx-auto space-y-6 lg:p-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to browse
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {group.groupName}
              </h1>
              <p className="text-sm text-gray-500">
                {group.subject} · Beginner
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isCreator ? (
                <>
                  <Button variant="outline" onClick={() => navigate(`/groups/${id}/edit`)}>
                    <FileEdit className="w-4 h-4" />
                    Edit
                  </Button>
                </>
              ) : isMember ? (
                <Button variant="outline" onClick={handleLeave}>
                  <LogOut className="w-4 h-4" />
                  Leave
                </Button>
              ) : (
                <Button loading={joinLoading} onClick={handleJoin} disabled={isFull}>
                  {!joinLoading && <PlusCircle className="w-4 h-4" />}
                  {isFull ? 'Full' : 'Join Group'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="pt-4">
          {activeTab === 'Overview' && (
            <div className="card p-6 lg:p-8 animate-fade-in max-w-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700">
                  {group.mode || 'Offline'}
                </span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700">
                  Beginner
                </span>
              </div>

              <p className="text-gray-700 mb-8 whitespace-pre-wrap leading-relaxed">
                {group.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {group.date ? `${group.date}, ${group.time}` : 'TBD'}
                </div>
                {group.mode === 'Offline' && group.location && (
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    {group.location}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Users className="w-5 h-5 text-gray-400" />
                  {group.members.length}/{group.maxMembers} members ·{' '}
                  <span className={spotsLeft > 0 ? 'text-emerald-600' : 'text-red-500'}>
                    {spotsLeft} seats left
                  </span>
                </div>
              </div>

              {group.mode === 'Online' && group.meetingLink && (
                <div className="mb-8">
                  <a
                    href={group.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 font-semibold text-sm hover:underline"
                  >
                    Open meeting link
                  </a>
                </div>
              )}

              <div className="flex items-center gap-4 pt-6 mt-6 border-t border-gray-100">
                {isCreator && (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="flex items-center gap-2 text-red-600 font-semibold text-sm hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" /> Delete group
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-700 font-semibold text-sm hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Discussion' && (
            <div className="card h-[600px] flex flex-col border border-gray-100 shadow-sm animate-fade-in bg-white">
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-900">{msg.sender}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <div className="flex gap-2">
                      {!msg.isMe && (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {msg.sender[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl max-w-md ${
                        msg.isMe 
                          ? 'bg-primary-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.isMe && (
                        <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {msg.sender[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'Members' && (
            <div className="card p-6 lg:p-8 animate-fade-in max-w-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Members ({group.members?.length || 0})
              </h3>
              <div className="space-y-4">
                {group.members?.map((m, i) => {
                  const member = typeof m === 'string' ? { _id: m, fullName: 'Student', email: '' } : m;
                  const memberCreator = member._id === (group.createdBy?._id || group.createdBy);
                  const name = member.fullName || 'Student';
                  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  
                  return (
                    <div key={member._id || i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{name}</p>
                          {memberCreator && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Host</span>}
                        </div>
                        {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {(activeTab === 'Sessions' || activeTab === 'Reviews') && (
            <div className="card p-12 animate-fade-in text-center border border-gray-100 shadow-sm max-w-3xl">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                {activeTab === 'Sessions' && <Clock className="w-8 h-8 text-gray-400" />}
                {activeTab === 'Reviews' && <Star className="w-8 h-8 text-gray-400" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{activeTab} Coming Soon</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                This feature is currently under development. Check back later for updates!
              </p>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {showDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="card p-6 max-w-md w-full animate-slide-up shadow-2xl">
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
                Are you sure you want to delete <strong className="text-gray-900">"{group.groupName}"</strong>? This will permanently remove the group for all members.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <button onClick={() => setShowDelete(false)} className="btn-outline">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleDelete} className="btn-primary !bg-red-600 !hover:bg-red-700">
                  <Trash2 className="w-4 h-4" /> Delete Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
