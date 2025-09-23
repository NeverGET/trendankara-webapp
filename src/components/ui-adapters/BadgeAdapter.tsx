import React from 'react';
import { Badge as ReUIBadge } from '@/components/ui/badge-reui';
import { cn } from '@/lib/utils';

interface LegacyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink';
  size?: 'small' | 'medium' | 'large';
  pill?: boolean;
  animated?: boolean;
  interactive?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// Map legacy variants to ReUI + custom styling
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
  medium: 'text-xs px-2.5 py-1',
  large: 'text-base px-4 py-2 md:px-4 md:py-2.5'
};

const interactiveSizeClasses = {
  small: 'min-h-[32px] text-xs px-3 py-1.5',
  medium: 'min-h-[40px] text-sm px-4 py-2',
  large: 'min-h-[44px] text-base px-5 py-2.5'
};

export function Badge({
  variant = 'default',
  size = 'medium',
  pill = false,
  animated = false,
  interactive = false,
  icon,
  children,
  className,
  ...props
}: LegacyBadgeProps) {
  // ReUI Badge doesn't support all these variants directly, so we apply custom styles
  const reUIVariant = variant === 'error' ? 'destructive' : 'default';

  return (
    <ReUIBadge
      variant={reUIVariant}
      className={cn(
        'inline-flex items-center font-medium border shadow-sm',
        pill ? 'rounded-full' : 'rounded-md',
        variantClasses[variant],
        interactive ? interactiveSizeClasses[size] : sizeClasses[size],
        interactive && 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105',
        animated && 'animate-pulse',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="w-3 h-3 flex-shrink-0 mr-1">
          {icon}
        </span>
      )}
      {children}
    </ReUIBadge>
  );
}

// Export as default for drop-in replacement
export default Badge;