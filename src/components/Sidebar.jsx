import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Compass, PlusCircle, Users, User, LogOut, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { notificationApi } from '../services/api.js';

export default function Sidebar({ active }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
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
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard', key: 'dashboard' },
    { name: 'Explore Groups', icon: Compass, href: '/explore', key: 'explore' },
    { name: 'Create Study Group', icon: PlusCircle, href: '/create-group', key: 'create' },
    { name: 'My Study Groups', icon: Users, href: '/my-groups', key: 'mygroups' },
    { name: 'Notifications', icon: Bell, href: '/notifications', key: 'notifications' },
    { name: 'Profile', icon: User, href: '/profile', key: 'profile' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-40 hidden lg:flex flex-col peer ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex items-center justify-between px-5 py-5 border-b border-gray-100 ${collapsed ? 'justify-center lg:justify-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent whitespace-nowrap">
              StudyGroup
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
              {!collapsed && <span className="whitespace-nowrap flex-1">{item.name}</span>}
              {!collapsed && item.key === 'notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
              {collapsed && item.key === 'notifications' && unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span>Logout</span>}
        </button>

        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
