import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'giant';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white hover:from-brand-red-700 hover:to-brand-red-800 active:from-brand-red-800 active:to-brand-red-900 shadow-lg shadow-brand-red-900/30 hover:shadow-xl hover:shadow-brand-red-900/40 focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 focus:ring-offset-dark-bg-primary transform hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-dark-surface-secondary text-dark-text-primary hover:bg-dark-surface-tertiary active:bg-dark-surface-primary border border-dark-border-primary shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0',
  danger: 'bg-gradient-to-r from-red-900 to-red-800 text-white hover:from-red-800 hover:to-red-700 active:from-red-950 active:to-red-900 shadow-lg shadow-red-950/30 hover:shadow-xl hover:shadow-red-950/40 transform hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'bg-transparent text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary/50 active:bg-dark-surface-secondary backdrop-blur-sm'
};

const sizeClasses = {
  // Mobile-first responsive sizing with touch optimization (Requirement 2.1, 2.5)
  small: 'min-h-[44px] md:min-h-[40px] px-3 md:px-3 text-sm min-w-[44px] md:min-w-[40px]',
  medium: 'min-h-[44px] md:min-h-[48px] px-4 md:px-4 text-sm md:text-base min-w-[44px]',
  large: 'min-h-[48px] md:min-h-[56px] px-5 md:px-6 text-base md:text-lg min-w-[48px]',
  giant: 'min-h-[56px] md:min-h-[72px] px-6 md:px-8 text-lg md:text-xl min-w-[56px] md:min-w-[72px]'
};

export function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 relative overflow-hidden',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        'focus:outline-none',
        'before:absolute before:inset-0 before:bg-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 md:h-5 md:w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Yükleniyor...</span>
        </span>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}