import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink';
  size?: 'small' | 'medium' | 'large';
  pill?: boolean;
  animated?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  default: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-gray-800',
  success: 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-800',
  warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-yellow-800',
  error: 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-800',
  info: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-800',
  purple: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-800',
  pink: 'bg-gradient-to-r from-pink-600 to-pink-700 text-white border-pink-800'
};

const sizeClasses = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-2.5 py-1',
  large: 'text-base px-3 py-1.5'
};

export function Badge({
  variant = 'default',
  size = 'medium',
  pill = false,
  animated = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border shadow-sm',
        pill ? 'rounded-full' : 'rounded-md',
        variantClasses[variant],
        sizeClasses[size],
        animated && 'animate-pulse',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}