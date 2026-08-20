import LoadingSpinner from './LoadingSpinner.jsx';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  fullWidth = false,
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl hover:shadow-primary-500/30 focus:ring-primary-500/30',
    secondary:
      'bg-white text-primary-700 border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 focus:ring-primary-500/20',
    outline:
      'text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-100',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 focus:ring-red-500/30',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200 focus:outline-none focus:ring-4
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        hover:-translate-y-0.5 active:translate-y-0
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" className={loading && children ? 'mr-2' : ''} />}
      {!loading || (loading && children)}
      {children}
    </button>
  );
}
