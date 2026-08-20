export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-gray-200 border-t-primary-600 ${sizes[size]} ${className}`}
      style={{ borderWidth: size === 'md' || size === 'sm' ? '3px' : '4px' }}
    />
  );
}
