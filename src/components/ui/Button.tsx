import { cn } from '@/utils/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          {
            'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100':
              variant === 'primary',
            'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-300 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700':
              variant === 'secondary',
            'text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-800':
              variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300':
              variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
