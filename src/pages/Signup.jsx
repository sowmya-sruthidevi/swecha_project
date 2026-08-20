import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, GraduationCap, Users, Sparkles, BookOpen } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (form.fullName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';

    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

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
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      toast.success('Account created successfully! Welcome aboard 🎉');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
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
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200/40 to-primary-200/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="hidden lg:block animate-slide-up">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-600 mb-6">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Join 10,000+ students already learning together
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Start Your <span className="gradient-text">Study Journey</span> Today
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Create your account and start collaborating with students from around the world.
                  Find your study partners and achieve academic excellence.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Connect with students who share your goals' },
                  { icon: GraduationCap, text: 'Access expert-curated study groups' },
                  { icon: BookOpen, text: 'Track progress and achieve better grades' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="text-gray-700 font-medium pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full animate-fade-in">
              <div className="card p-8 sm:p-10 shadow-xl shadow-primary-500/5">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                  <p className="text-gray-600">Join the smartest way to study together</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputField
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    icon={User}
                    error={errors.fullName}
                    required
                  />

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
                    placeholder="Create a strong password"
                    icon={Lock}
                    error={errors.password}
                    required
                  />

                  <InputField
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    icon={Lock}
                    error={errors.confirmPassword}
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    size="lg"
                  >
                    {!loading && (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                    {loading && 'Creating account...'}
                  </Button>

                  <p className="text-center text-sm text-gray-600 pt-2">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Login
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
