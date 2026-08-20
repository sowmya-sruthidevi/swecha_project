export default function StatCard({ title, value, icon: Icon, change, color = 'primary' }) {
  const colors = {
    primary: {
      bg: 'bg-primary-100',
      icon: 'text-primary-600',
      gradient: 'from-primary-500 to-primary-700',
    },
    accent: {
      bg: 'bg-accent-100',
      icon: 'text-accent-600',
      gradient: 'from-accent-500 to-accent-700',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-700',
    },
    orange: {
      bg: 'bg-orange-100',
      icon: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
    },
  };

  const c = colors[color];

  return (
    <div className="card p-6 card-hover relative overflow-hidden">
      <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-5`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-2 font-medium flex items-center gap-1 ${
              change > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% this week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
