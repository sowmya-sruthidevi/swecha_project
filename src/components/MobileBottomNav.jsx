import { Link } from 'react-router-dom';
import { Home, Compass, PlusCircle, Users } from 'lucide-react';

export default function MobileBottomNav({ active }) {
  const navItems = [
    { name: 'Home', icon: Home, href: '/dashboard', key: 'dashboard' },
    { name: 'Explore', icon: Compass, href: '/explore', key: 'explore' },
    { name: 'Create', icon: PlusCircle, href: '/create-group', key: 'create' },
    { name: 'Groups', icon: Users, href: '/my-groups', key: 'mygroups' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2 sm:px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-primary-50' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-primary-100' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
