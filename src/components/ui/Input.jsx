import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className, 
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all duration-200',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
            'placeholder:text-warm-400 text-warm-900',
            Icon && 'pl-10',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-warm-200',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;