import { useState, useEffect } from 'react';
import { User, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { notificationApi } from '../services/api.js';

export default function DashboardTopbar({ onToggleMobileSidebar }) {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count', error);
      }
    };
    fetchUnreadCount();
  }, []);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-900">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-sm text-gray-500 hidden md:block">
              Find a group, collaborate, and make your next study session productive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/notifications" className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group block">
            <Bell className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 pr-2 sm:pr-4 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
