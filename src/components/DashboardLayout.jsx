import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import DashboardTopbar from './DashboardTopbar.jsx';

export default function DashboardLayout({ children, active }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar active={active} />
      </div>

      <div className="hidden lg:block">
        <Sidebar active={active} />
      </div>

      <div className="lg:ml-64 lg:[&:has(~aside.w-20)]:ml-20 transition-all duration-300">
        <DashboardTopbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
