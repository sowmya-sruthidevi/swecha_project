import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import { groupApi } from '../services/api.js';
import {
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Hash,
  FileText,
  Users,
  Clock,
  Video,
  Monitor,
} from 'lucide-react';
import { parseTimeParts, to24Hour } from '../utils/time.js';

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

export default function EditGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const defaultTime = parseTimeParts('');
  const [form, setForm] = useState({
    groupName: '',
    subject: '',
    description: '',
    date: '',
    time: '',
    location: '',
    meetingLink: '',
    maxMembers: 8,
    mode: 'Offline',
  });
  const [timeHhmm, setTimeHhmm] = useState(defaultTime.hhmm);
  const [timePeriod, setTimePeriod] = useState(defaultTime.period);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const res = await groupApi.getGroup(id);
        const g = res.data.group;
        const p = parseTimeParts(g.time || '');
        setTimeHhmm(p.hhmm);
        setTimePeriod(p.period);
        setForm({
          groupName: g.groupName || '',
          subject: g.subject || '',
          description: g.description || '',
          date: g.date || '',
          time: g.time || '',
          location: g.location || '',
          meetingLink: g.meetingLink || '',
          maxMembers: g.maxMembers || 8,
          mode: g.mode || 'Offline',
        });
      } catch {
        toast.error('Failed to load group');
        navigate('/my-groups');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGroup();
  }, [id, navigate]);

  useEffect(() => {
    if (!timeHhmm) {
      setForm((f) => ({ ...f, time: '' }));
      return;
    }
    const t24 = to24Hour(timeHhmm, timePeriod);
    setForm((f) => ({ ...f, time: t24 }));
  }, [timeHhmm, timePeriod]);

  const validate = () => {
    const e = {};
    if (!form.groupName.trim()) e.groupName = 'Group name is required';
    else if (form.groupName.length < 3) e.groupName = 'Name must be at least 3 characters';
    if (!form.subject) e.subject = 'Please select a subject';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (form.mode === 'Offline' && !form.location.trim()) {
      e.location = 'Location is required for offline meetings';
    }
    if (form.mode === 'Online' && !form.meetingLink.trim()) {
      e.meetingLink = 'Meeting link is required for online meetings';
    }
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
    setSaving(true);
    try {
      await groupApi.updateGroup(id, form);
      toast.success('Group updated successfully! ✨');
      setTimeout(() => navigate(`/groups/${id}`), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="my-groups">
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="my-groups">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Edit Study Group
            </h2>
            <p className="text-gray-500 mt-1">Update your group's details and settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-5">
              <InputField
                label="Group Name"
                name="groupName"
                value={form.groupName}
                onChange={handleChange}
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
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.subject && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.subject}</p>
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
                  rows={5}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 resize-none font-medium outline-none ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                  }`}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Meeting Details</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mode <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: 'Offline' }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold ${
                      form.mode === 'Offline'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    Offline
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: 'Online' }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold ${
                      form.mode === 'Online'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    Online
                  </button>
                </div>
              </div>
              <InputField
                label="Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                icon={Calendar}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={timeHhmm}
                    onChange={(e) => setTimeHhmm(e.target.value)}
                    className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 outline-none font-medium bg-white"
                  />
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 outline-none font-semibold bg-white text-gray-700 min-w-[100px]"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {timeHhmm ? `${timeHhmm} ${timePeriod}` : 'Not set'}
                </p>
              </div>
              {form.mode === 'Offline' && (
                <div className="sm:col-span-2">
                  <InputField
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    icon={MapPin}
                    error={errors.location}
                    required={form.mode === 'Offline'}
                  />
                </div>
              )}
              {form.mode === 'Online' && (
                <div className="sm:col-span-2">
                  <InputField
                    label="Meeting Link"
                    type="url"
                    name="meetingLink"
                    value={form.meetingLink}
                    onChange={handleChange}
                    icon={LinkIcon}
                    error={errors.meetingLink}
                    required={form.mode === 'Online'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Group Settings</h3>
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
                  value={form.maxMembers}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, maxMembers: parseInt(e.target.value) }));
                    if (errors.maxMembers) setErrors((er) => ({ ...er, maxMembers: null }));
                  }}
                  className="flex-1 h-2 rounded-full bg-gray-200 accent-primary-600"
                />
                <div className="w-20 h-14 rounded-xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">{form.maxMembers}</span>
                </div>
              </div>
              {errors.maxMembers && (
                <p className="mt-2 text-sm text-red-500 font-medium">{errors.maxMembers}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(`/groups/${id}`)}
              className="btn-outline"
            >
              <ArrowLeft className="w-5 h-5" />
              Cancel
            </button>
            <Button type="submit" fullWidth loading={saving} size="lg">
              {!saving && <Save className="w-5 h-5" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
