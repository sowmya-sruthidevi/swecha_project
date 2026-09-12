import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import { notificationApi } from '../services/api.js';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(
        notifications.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar active="notifications" />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:hidden transition-transform duration-300 ease-in-out z-40 w-64 bg-white`}
      >
        <Sidebar active="notifications" />
      </div>

      <main className="flex-1 lg:ml-64 min-w-0 flex flex-col h-screen">
        <DashboardTopbar onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Everything happening in your study groups
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500">
                  {unreadCount} unread
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-500">When someone creates a group, you'll see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => !notification.isRead && handleMarkRead(notification._id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 sm:gap-5 ${notification.isRead
                        ? 'bg-white border-gray-100 hover:border-gray-200'
                        : 'bg-primary-50/50 border-primary-100 hover:bg-primary-50'
                      }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-gray-100' : 'bg-primary-100'
                        }`}>
                        <Bell className={`w-5 h-5 ${notification.isRead ? 'text-gray-500' : 'text-primary-600'
                          }`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                            Study group created
                          </p>
                          <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
