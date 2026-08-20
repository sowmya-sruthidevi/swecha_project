import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { groupApi } from '../services/api.js';
import {
  ArrowRight,
  Users,
  Calendar,
  UserPlus,
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Star,
  ChevronRight,
} from 'lucide-react';

const HERO_IMG =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=diverse%20group%20of%20multiethnic%20students%20studying%20and%20collaborating%20together%20around%20a%20wooden%20table%20with%20laptops%20open%2C%20textbooks%2C%20notebooks%2C%20pens%2C%20educational%20materials%2C%20everyone%20smiling%20and%20discussing%2C%20bright%20modern%20study%20room%2C%20clean%20vector%20illustration%20style%2C%20purple%20indigo%20blue%20and%20soft%20pastel%20color%20palette%2C%20high%20quality&image_size=landscape_16_9';

const FEATURES_IMG =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=educational%20collaboration%20network%20concept%20illustration%20featuring%20connected%20nodes%2C%20open%20books%2C%20student%20avatars%2C%20chat%20bubbles%2C%20graduation%20caps%2C%20lightbulb%20ideas%2C%20interconnected%20lines%20forming%20a%20network%20graph%2C%20clean%20vector%20art%20style%2C%20purple%20blue%20and%20soft%20pastel%20colors%2C%20minimal%20white%20background%2C%20modern%20flat%20design&image_size=landscape_4_3';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [publicStats, setPublicStats] = useState({ totalUsers: 0, totalGroups: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await groupApi.getPublicStats();
        setPublicStats(res.data.stats || { totalUsers: 0, totalGroups: 0 });
      } catch {
        setPublicStats({ totalUsers: 0, totalGroups: 0 });
      }
    };
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  const features = [
    {
      icon: Users,
      title: 'Create Study Groups',
      description: 'Create a group for any subject or course. Invite classmates and collaborate effectively.',
      color: 'from-primary-500 to-primary-700',
      bg: 'bg-primary-100',
    },
    {
      icon: UserPlus,
      title: 'Join Study Groups',
      description: 'Discover and join groups created by other students who share your interests.',
      color: 'from-accent-500 to-accent-700',
      bg: 'bg-accent-100',
    },
    {
      icon: LayoutDashboard,
      title: 'Manage Your Groups',
      description: 'Track groups you created and groups you joined. All in one beautiful dashboard.',
      color: 'from-purple-500 to-purple-700',
      bg: 'bg-purple-100',
    },
    {
      icon: MessageSquare,
      title: 'Connect With Students',
      description: 'Collaborate with students who share similar academic goals. Build your network.',
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-100',
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Add study schedules, set meeting times and locations. Never miss a session.',
      color: 'from-pink-500 to-pink-700',
      bg: 'bg-pink-100',
    },
    {
      icon: ShieldCheck,
      title: 'Easy Group Management',
      description: 'Manage members, update group details, and keep everything organized.',
      color: 'from-emerald-500 to-emerald-700',
      bg: 'bg-emerald-100',
    },
  ];

  const testimonials = [
    {
      name: 'Ananya Sharma',
      role: 'Computer Science',
      avatar: 'AS',
      text: 'Found my perfect study group for algorithms! We aced our midterms together. This platform is a game-changer.',
      rating: 5,
    },
    {
      name: 'Rohan Mehta',
      role: 'Mechanical Engineering',
      avatar: 'RM',
      text: 'The group scheduling feature is amazing. No more WhatsApp chaos trying to find a time that works for everyone.',
      rating: 5,
    },
    {
      name: 'Priya Reddy',
      role: 'Medical Student',
      avatar: 'PR',
      text: 'Joined 3 study groups and met some incredible people. Learning together is so much more fun!',
      rating: 5,
    },
  ];

  const displayStudents = publicStats.totalUsers > 0 ? publicStats.totalUsers : 0;
  const displayGroups = publicStats.totalGroups > 0 ? publicStats.totalGroups : 0;
  const displayUniv = displayGroups > 0 ? Math.max(1, Math.round(displayGroups / 5)) : 0;
  const displayRate = displayGroups > 0 ? '98%' : '—';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-primary-200/60 to-accent-200/60 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200/50 to-primary-200/50 rounded-full blur-3xl animate-pulse-slow" />

          <BookOpen className="absolute top-32 left-[10%] w-8 h-8 text-primary-400/40 animate-float" />
          <GraduationCap className="absolute top-48 right-[15%] w-10 h-10 text-accent-400/40 animate-float-delay" />
          <MessageSquare className="absolute bottom-40 left-[18%] w-7 h-7 text-purple-400/40 animate-float-delay" />
          <Sparkles className="absolute bottom-32 right-[20%] w-6 h-6 text-orange-400/50 animate-float" />
          <Users className="absolute top-[28%] left-[5%] w-6 h-6 text-primary-400/30 animate-float" />
          <Star className="absolute top-60 left-[40%] w-5 h-5 text-yellow-400/50 animate-float-delay" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-600 mb-6">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {displayStudents > 0
                  ? `Join ${displayStudents.toLocaleString()}+ students`
                  : 'Start your study journey'}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Find Your Study Partners.
                <span className="block gradient-text mt-2">Learn Better Together.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Discover study groups, collaborate with fellow students, and achieve your
                academic goals together. The smarter way to study.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary text-base"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/explore')}
                  className="btn-secondary text-base"
                >
                  Explore Groups
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearch} className="max-w-lg">
                <SearchBar
                  placeholder="Search for a study group, subject, or course..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="bg-white shadow-lg shadow-gray-200/50"
                />
              </form>
            </div>

            {/* Hero Illustration - Single image on the right */}
            <div className="relative animate-fade-in lg:ml-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary-400/25 via-purple-400/15 to-accent-400/25 rounded-[3rem] blur-3xl" />
                <div className="relative card p-4 shadow-2xl shadow-primary-500/10 border-0 overflow-hidden rounded-3xl">
                  <img
                    src={HERO_IMG}
                    alt="Students studying and collaborating together around a table with laptops, books, and notes"
                    className="w-full h-auto aspect-video object-cover rounded-2xl"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: displayStudents > 0 ? `${displayStudents.toLocaleString()}+` : 'Growing', label: 'Active Students' },
              { value: displayGroups > 0 ? `${displayGroups.toLocaleString()}+` : 'Start First', label: 'Study Groups' },
              { value: displayUniv > 0 ? `${displayUniv}+` : '—', label: 'Universities' },
              { value: displayRate, label: 'Success Rate' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{s.value}</p>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with secondary illustration */}
      <section id="features" className="section-gradient py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Everything You Need to{' '}
              <span className="gradient-text">Study Smarter</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Powerful features designed to help students collaborate effectively and
              achieve academic excellence together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-6 lg:gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="card p-8 card-hover group relative overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`absolute -right-8 -top-8 w-32 h-32 ${feature.bg} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-gray-800" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features Illustration - on the right side of features section */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-8">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-purple-400/20 via-primary-400/10 to-accent-400/20 rounded-[3rem] blur-3xl" />
                <div className="relative card p-5 shadow-xl shadow-primary-500/10 border-0 overflow-hidden rounded-3xl">
                  <img
                    src={FEATURES_IMG}
                    alt="Educational collaboration network with connected nodes, books, students, chat bubbles, and graduation icons"
                    className="w-full h-auto object-cover rounded-2xl"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Get Started in{' '}
              <span className="gradient-text">3 Easy Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up in seconds with your email. It\'s completely free for students.',
                color: 'from-primary-500 to-primary-700',
              },
              {
                step: '02',
                title: 'Find or Create a Group',
                description: 'Browse existing study groups or create your own based on your courses.',
                color: 'from-purple-500 to-purple-700',
              },
              {
                step: '03',
                title: 'Start Learning Together',
                description: 'Join sessions, collaborate, and boost your grades with study partners.',
                color: 'from-accent-500 to-accent-700',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden lg:block absolute top-20 -right-6 w-12 border-t-2 border-dashed border-gray-200" />
                )}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${item.color} text-white text-2xl font-bold shadow-xl shadow-primary-500/20 mb-6`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-gradient py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Loved by{' '}
              <span className="gradient-text">Students Everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-8 card-hover">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <circle cx="100" cy="100" r="150" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="700" cy="300" r="200" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Study Smarter?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who are already collaborating and achieving more together.
            Your perfect study group is just one click away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 hover:bg-primary-50 transition-all duration-300"
            >
              Create an Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300"
            >
              Explore Study Groups
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-3 text-primary-200 text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Free for all students · No credit card required
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
