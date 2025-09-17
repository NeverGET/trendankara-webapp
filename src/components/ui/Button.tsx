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
  primary: 'bg-brand-red-600 text-white hover:bg-brand-red-700 active:bg-brand-red-800 focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 focus:ring-offset-dark-bg-primary',
  secondary: 'bg-dark-surface-secondary text-dark-text-primary hover:bg-dark-surface-tertiary active:bg-dark-surface-primary border border-dark-border-primary',
  danger: 'bg-red-900 text-white hover:bg-red-800 active:bg-red-950',
  ghost: 'bg-transparent text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary active:bg-dark-surface-secondary'
};

const sizeClasses = {
  small: 'h-10 px-3 text-sm min-w-[40px]',
  medium: 'h-12 px-4 text-base min-w-[48px]',
  large: 'h-14 px-6 text-lg min-w-[56px]',
  giant: 'h-[72px] px-8 text-xl min-w-[72px]'
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
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none',
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
            className="animate-spin h-5 w-5"
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