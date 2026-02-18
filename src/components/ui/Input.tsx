import { cn } from '@/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm',
              'transition-all duration-200 placeholder:text-neutral-400',
              'focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100',
              'dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500',
              'dark:focus:border-neutral-600 dark:focus:ring-neutral-700',
              icon && 'pl-10',
              error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
