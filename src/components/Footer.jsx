import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Twitter, Github, Linkedin, Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  const links = {
    Product: [
      { name: 'Home', href: '/', hash: null },
      { name: 'Explore Groups', href: '/explore', hash: null },
      { name: 'Features', href: '/', hash: 'features' },
    ],
    Account: [
      { name: 'Login', href: '/login', hash: null },
      { name: 'Sign Up', href: '/signup', hash: null },
      { name: 'Profile', href: '/profile', hash: null },
    ],
    Company: [
      { name: 'About', href: '/', hash: 'about' },
      { name: 'Blog', href: '#', hash: null, external: true },
      { name: 'Contact', href: '#', hash: null, external: true },
    ],
  };

  const handleClick = (item) => {
    if (item.external) return;
    if (item.hash) {
      if (window.location.pathname === '/') {
        const el = document.getElementById(item.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(item.hash);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } else {
      navigate(item.href);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">StudyGroup Finder</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6 max-w-sm">
              The modern platform for university students to find study partners, create groups,
              and collaborate on academic goals. Learn better together.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.name}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <button
                        onClick={() => handleClick(item)}
                        className="text-sm text-gray-400 hover:text-white transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {year} StudyGroup Finder. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
}
