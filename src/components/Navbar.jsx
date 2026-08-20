import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', href: '/', hash: null },
    { name: 'Explore Groups', href: '/explore', hash: null },
    { name: 'Features', href: '/', hash: 'features' },
    { name: 'About', href: '/', hash: 'about' },
  ];

  const handleNavClick = (link) => {
    setIsOpen(false);
    if (link.hash) {
      if (window.location.pathname === '/') {
        const el = document.getElementById(link.hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(link.hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    } else {
      navigate(link.href);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-xl group-hover:shadow-primary-500/30 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              StudyGroup
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link)}
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-outline"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/explore')}
                  className="btn-primary"
                >
                  Explore
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-ghost text-sm font-semibold text-gray-700 hover:text-primary-600 hover:bg-primary-50"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link)}
                  className="px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:text-primary-600 transition-colors text-left"
                >
                  {link.name}
                </button>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setIsOpen(false);
                      }}
                      className="btn-outline w-full"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        navigate('/explore');
                        setIsOpen(false);
                      }}
                      className="btn-primary w-full"
                    >
                      Explore Groups
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigate('/login');
                        setIsOpen(false);
                      }}
                      className="btn-outline w-full"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        navigate('/signup');
                        setIsOpen(false);
                      }}
                      className="btn-primary w-full"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
