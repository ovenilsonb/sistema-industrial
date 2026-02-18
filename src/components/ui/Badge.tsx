import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300': variant === 'default',
          'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': variant === 'warning',
          'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
