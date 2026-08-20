import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function InputField({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon: Icon,
  required = false,
  className = '',
  as = 'input',
  rows = 4,
  options = [],
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const baseClasses = `
    w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-800 placeholder-gray-400
    focus:bg-white transition-all duration-200 outline-none
    ${error
      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100'
      : 'border-gray-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100'
    }
    ${Icon ? 'pl-11' : ''}
    ${isPassword ? 'pr-11' : ''}
  `;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id || name} className="input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        )}
        {as === 'textarea' ? (
          <textarea
            id={id || name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            className={`${baseClasses} resize-none`}
          />
        ) : as === 'select' ? (
          <select
            id={id || name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={baseClasses}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            id={id || name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={baseClasses}
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
