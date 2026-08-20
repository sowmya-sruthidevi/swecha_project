import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  Users,
  BookOpen,
  ArrowLeft,
  PlusCircle,
  Sparkles,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Hash,
  FileText,
} from 'lucide-react';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Economics',
  'History',
  'Psychology',
  'Engineering',
  'Business',
  'Other',
];

export default function CreateGroup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    groupName: '',
    subject: '',
    description: '',
    date: '',
    time: '',
    location: '',
    meetingLink: '',
    maxMembers: 8,
  });

  const validate = () => {
    const e = {};
    if (!form.groupName.trim()) e.groupName = 'Group name is required';
    else if (form.groupName.length < 3) e.groupName = 'Name must be at least 3 characters';
    if (!form.subject) e.subject = 'Please select a subject';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.location.trim()) e.location = 'Location is required';
    if (form.maxMembers < 2) e.maxMembers = 'Min 2 members required';
    if (form.maxMembers > 50) e.maxMembers = 'Max 50 members allowed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'maxMembers' ? parseInt(value) || '' : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await groupApi.createGroup(form);
      toast.success('Study group created successfully! 🎉');
      setTimeout(() => navigate('/my-groups'), 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create group';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout active="create-group">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <button
            onClick={() => navigate('/my-groups')}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Create Study Group
            </h2>
            <p className="text-gray-500 mt-1">
              Build your perfect study community — set the details and invite friends
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
                  Basic Information
                </h3>
                <div className="space-y-5">
                  <InputField
                    label="Group Name"
                    name="groupName"
                    value={form.groupName}
                    onChange={handleChange}
                    placeholder="e.g. Advanced Calculus Study Circle"
                    icon={Hash}
                    error={errors.groupName}
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, subject: s }));
                            if (errors.subject) setErrors((e) => ({ ...e, subject: null }));
                          }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            form.subject === s
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 ring-2 ring-primary-500/20'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.subject && (
                      <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="What is this group about? What will you study together? What can members expect?"
                      rows={5}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 resize-none font-medium placeholder:text-gray-400 outline-none ${
                        errors.description
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                      }`}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">
                        {form.description.length}/500 characters
                      </p>
                      {errors.description && (
                        <p className="text-sm text-red-500 font-medium">{errors.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
                  Meeting Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <InputField
                    label="Date"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    icon={Calendar}
                  />
                  <InputField
                    label="Time"
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    icon={Calendar}
                  />
                  <InputField
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Library Room 204, Online, Starbucks..."
                    icon={MapPin}
                    error={errors.location}
                    required
                  />
                  <InputField
                    label="Meeting Link (optional)"
                    type="url"
                    name="meetingLink"
                    value={form.meetingLink}
                    onChange={handleChange}
                    placeholder="https://zoom.us/... or discord link"
                    icon={LinkIcon}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">3</span>
                  Group Settings
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    Maximum Members
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="maxMembers"
                      min="2"
                      max="50"
                      value={form.maxMembers || 8}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, maxMembers: parseInt(e.target.value) }));
                        if (errors.maxMembers) setErrors((er) => ({ ...er, maxMembers: null }));
                      }}
                      className="flex-1 h-2 rounded-full bg-gray-200 accent-primary-600"
                    />
                    <div className="w-20 h-14 rounded-xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {form.maxMembers}
                      </span>
                    </div>
                  </div>
                  {errors.maxMembers && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{errors.maxMembers}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Set the maximum number of students that can join this group (2-50)
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/my-groups')}
                  className="btn-outline"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Cancel
                </button>
                <Button type="submit" fullWidth loading={loading} size="lg">
                  {!loading && (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Create Study Group
                    </>
                  )}
                  {loading && 'Creating Group...'}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="card p-6 bg-gradient-to-br from-primary-50 via-white to-accent-50 border-primary-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Pro Tips</h3>
                  <p className="text-xs text-gray-500">For a great group</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Use a clear descriptive name',
                  'Specify the level (beginner/advanced)',
                  'Add a detailed schedule',
                  'Include exam prep goals',
                  'Choose a convenient location',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary-600">{i + 1}</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                Preview
              </h3>
              <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg mb-3">
                  {form.groupName.charAt(0) || '?'}
                </div>
                <p className="font-bold text-lg truncate">
                  {form.groupName || 'Your Group Name'}
                </p>
                <p className="text-sm text-primary-100 mt-1">
                  {form.subject || 'Subject'}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-200" />
                    <span className="text-sm font-medium text-primary-100">
                      1/{form.maxMembers}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-white/15 text-xs font-semibold">
                    {form.location ? 'Meeting' : 'TBD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
