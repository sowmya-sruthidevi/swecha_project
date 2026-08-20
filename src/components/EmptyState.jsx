import { FileQuestion, Compass, PlusCircle, AlertCircle, Users } from 'lucide-react';

const iconsMap = {
  groups: Users,
  explore: Compass,
  create: PlusCircle,
  error: AlertCircle,
};

export default function EmptyState({
  title = 'Nothing to see here',
  description = 'There are no items to display right now.',
  icon = 'groups',
  action = null,
  className = '',
}) {
  const IconComponent = iconsMap[icon] || FileQuestion;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl blur-2xl opacity-60 scale-110" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center">
          <IconComponent className="w-12 h-12 text-primary-600" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
