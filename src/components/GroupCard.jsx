import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, ArrowRight, Lock, Edit2, Trash2, Loader2, Video, Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupCard({
  group,
  onJoin,
  onLeave,
  onDelete,
  onEdit,
  hideActions = false,
  variant = 'default',
  joinLoading = false,
  leaveLoading = false,
}) {
  const navigate = useNavigate();
  const seatsAvailable = (group.maxMembers - (group.currentMembers || group.members?.length || 0)) > 0;
  const fillPercent = Math.min(
    ((group.currentMembers || group.members?.length || 0) / group.maxMembers) * 100,
    100
  );
  const anyLoading = joinLoading || leaveLoading;

  const handleJoin = (e) => {
    e.stopPropagation();
    if (joinLoading) return;
    if (onJoin) onJoin(group);
    else {
      toast.success(`Joined ${group.groupName}!`);
      navigate(`/groups/${group.groupId}`);
    }
  };

  const handleLeave = (e) => {
    e.stopPropagation();
    if (leaveLoading) return;
    if (onLeave) onLeave(group);
    else toast.success(`Left ${group.groupName}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(group);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(group);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/groups/${group.groupId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    if (group.meetingLink) {
      navigator.clipboard.writeText(group.meetingLink).then(() => {
        toast.success('Meeting link copied!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  const creatorName = group.creatorName || group.createdBy?.fullName || 'Unknown';
  const initial = creatorName.charAt(0).toUpperCase();

  const cardClasses =
    variant === 'minimal'
      ? 'card p-5 card-hover cursor-pointer'
      : 'card p-6 card-hover cursor-pointer';

  return (
    <div
      onClick={() => navigate(`/groups/${group.groupId}`)}
      className={`${cardClasses} group ${anyLoading ? 'pointer-events-none' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
          {group.groupName}
        </h3>
        {group.mode === 'Online' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold whitespace-nowrap">
            <Video className="w-3.5 h-3.5" />
            Online
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 mb-4">
        {group.subject} · Beginner
      </p>

      {/* Description */}
      <p className="text-gray-700 mb-6 line-clamp-2 leading-relaxed">
        {group.description}
      </p>

      {/* Details */}
      <div className="space-y-3 mb-6">
        {(group.date || group.time || group.schedule) && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {[group.date, group.time].filter(Boolean).join(', ') || group.schedule || 'Schedule TBD'}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>
            {group.currentMembers || group.members?.length || 0}/{group.maxMembers} members
            <span className="mx-1.5">·</span>
            <span className={seatsAvailable ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
              {seatsAvailable
                ? `${group.maxMembers - (group.currentMembers || group.members?.length || 0)} seats left`
                : 'Waitlist'}
            </span>
          </span>
        </div>

        {group.mode === 'Online' && (
          <div className="flex items-center gap-2.5 text-sm">
            <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button 
              onClick={handleCopyLink}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Copy meeting link
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-sm text-gray-600 pt-2">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initial}
          </div>
          <span className="truncate">by {creatorName}</span>
        </div>
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="flex items-center gap-2 mt-auto">
          {group.isCreator ? (
            <>
              <button
                onClick={handleEdit}
                className="flex-1 btn-outline py-2.5 text-sm gap-1.5 font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => navigate(`/groups/${group.groupId}`)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200"
              >
                View details
              </button>
            </>
          ) : group.isMember ? (
            <>
              <button
                onClick={handleLeave}
                disabled={leaveLoading}
                className="flex-1 btn-primary py-2.5 text-sm font-semibold !bg-primary-300 !text-white hover:!bg-primary-400 transition-colors disabled:opacity-60"
              >
                {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Joined'}
              </button>
              <button
                onClick={() => navigate(`/groups/${group.groupId}`)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200"
              >
                View details
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleJoin}
                disabled={!seatsAvailable || joinLoading}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                  seatsAvailable
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {joinLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Group'
                )}
              </button>
              <button
                onClick={() => navigate(`/groups/${group.groupId}`)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200"
              >
                View details
              </button>
            </>
          )}
          
          <button 
            onClick={handleShare}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 border border-transparent hover:border-gray-200"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
