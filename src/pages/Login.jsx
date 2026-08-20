import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, LogIn, Sparkles, Users, BookOpen, Award } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success('Welcome back! 🎉');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'The details are incorrect';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await login({ email: 'demo@studygroup.com', password: 'demopass123' });
      toast.success('Logged in as demo user! 🎉');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch {
      const msg = 'Demo account not found. Please signup first!';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 hero-gradient relative overflow-hidden py-12 lg:py-16 flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 -right-20 w-80 h-80 bg-gradient-to-br from-primary-200/40 to-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -left-20 w-72 h-72 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="hidden lg:block animate-slide-up">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-600 mb-6">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Welcome back! Great to see you
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Continue Your <span className="gradient-text">Learning Adventure</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Sign in to access your study groups, upcoming sessions, and collaborate with your study partners.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Users, label: 'Active Groups', value: '500+' },
                  { icon: BookOpen, label: 'Study Sessions', value: '10K+' },
                  { icon: Award, label: 'Success Stories', value: '98%' },
                ].slice(0, 2).map((item, i) => (
                  <div key={i} className="card p-5 shadow-sm">
                    <item.icon className="w-8 h-8 text-primary-500 mb-3" />
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="card p-5 border-l-4 border-primary-500">
                <p className="text-gray-700 italic mb-3">
                  "This platform completely transformed how I study. I joined 3 groups and improved my GPA by a full point!"
                </p>
                <p className="font-semibold text-gray-900 text-sm">— Ananya S., CS Student</p>
              </div>
            </div>

            <div className="w-full animate-fade-in">
              <div className="card p-8 sm:p-10 shadow-xl shadow-primary-500/5">
                <div className="text-center mb-8">
                  <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl items-center justify-center shadow-lg shadow-primary-500/25 mb-4">
                    <LogIn className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-gray-600">Sign in to continue studying</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputField
                    label="Email Address"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@university.edu"
                    icon={Mail}
                    error={errors.email}
                    required
                  />

                  <InputField
                    label="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    icon={Lock}
                    error={errors.password}
                    required
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600 font-medium">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    size="lg"
                  >
                    {!loading && (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                    {loading && 'Signing in...'}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemo}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-semibold rounded-xl border-2 border-amber-200 hover:border-amber-300 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    Try Demo Account (Signup first!)
                  </button>

                  <p className="text-center text-sm text-gray-600 pt-2">
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
