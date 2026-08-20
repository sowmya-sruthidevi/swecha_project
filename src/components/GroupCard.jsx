import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, UserCircle, ArrowRight, Lock, Edit2, Trash2, Loader2 } from 'lucide-react';
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

  const cardClasses =
    variant === 'minimal'
      ? 'card p-5 card-hover cursor-pointer'
      : 'card p-6 card-hover cursor-pointer';

  return (
    <div
      onClick={() => navigate(`/groups/${group.groupId}`)}
      className={`${cardClasses} group ${anyLoading ? 'pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="badge bg-primary-100 text-primary-700">
              {group.subject}
            </span>
            {!seatsAvailable && (
              <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Full
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {group.groupName}
          </h3>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">
        {group.description}
      </p>

      <div className="space-y-3 mb-5">
        {(group.date || group.time || group.schedule) && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="truncate">
              {[group.date, group.time].filter(Boolean).join(' at ') || group.schedule || 'Schedule TBD'}
            </span>
          </div>
        )}
        {group.location && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="truncate">{group.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <UserCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <span className="truncate">by {group.creatorName || group.createdBy?.fullName || 'Unknown'}</span>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="w-4 h-4 text-primary-500" />
            <span>
              <span className="font-semibold text-gray-900">
                {group.currentMembers || group.members?.length || 0}
              </span>
              <span className="text-gray-400"> / {group.maxMembers}</span>
            </span>
          </div>
          <span className={`text-xs font-semibold ${seatsAvailable ? 'text-emerald-600' : 'text-amber-600'}`}>
            {seatsAvailable
              ? `${group.maxMembers - (group.currentMembers || group.members?.length || 0)} spots left`
              : 'Waitlist'}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              seatsAvailable
                ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                : 'bg-gradient-to-r from-amber-500 to-amber-600'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {!hideActions && (
        <div className="flex gap-2">
          {group.isCreator ? (
            <>
              <button
                onClick={handleEdit}
                className="flex-1 btn-outline py-2.5 text-sm gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl text-red-600 border border-red-200 hover:bg-red-50 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : group.isMember ? (
            <button
              onClick={handleLeave}
              disabled={leaveLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-60"
            >
              {leaveLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {leaveLoading ? 'Leaving...' : 'Leave Group'}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={!seatsAvailable || joinLoading}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                seatsAvailable
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              {joinLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : seatsAvailable ? (
                <>
                  Join Group
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Group Full'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
