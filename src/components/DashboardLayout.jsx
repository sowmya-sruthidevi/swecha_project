import Sidebar from './Sidebar.jsx';
import DashboardTopbar from './DashboardTopbar.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';

export default function DashboardLayout({ children, active }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar active={active} />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav active={active} />

      {/* Main content wrapper */}
      <div className="flex-1 w-full max-w-[100vw] lg:max-w-none min-w-0 transition-all duration-300 lg:peer-[.w-64]:ml-64 lg:peer-[.w-20]:ml-20 overflow-x-hidden lg:overflow-x-visible pb-16 lg:pb-0">
        <DashboardTopbar />
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in w-full box-border">{children}</main>
      </div>
    </div>
  );
}
