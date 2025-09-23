import React from 'react';
import { Button as ReUIButton, ButtonProps as ReUIButtonProps } from '@/components/ui/button-reui';
import { cn } from '@/lib/utils';

interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'compact' | 'small' | 'medium' | 'large' | 'giant';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// Map legacy variants to ReUI variants
const variantMap: Record<string, ReUIButtonProps['variant']> = {
  'primary': 'default',
  'secondary': 'secondary',
  'danger': 'destructive',
  'ghost': 'ghost'
};

// Map legacy sizes to ReUI sizes
const sizeMap: Record<string, ReUIButtonProps['size']> = {
  'compact': 'sm',
  'small': 'sm',
  'medium': 'default',
  'large': 'lg',
  'giant': 'lg'
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
}: LegacyButtonProps) {
  // Transform props for ReUI Button
  const reuiVariant = variantMap[variant] || 'default';
  const reuiSize = sizeMap[size] || 'default';

  // Add additional styling for sizes that need extra customization
  const sizeClasses = {
    'compact': 'h-auto py-1',
    'small': 'min-h-[44px] md:min-h-[40px] min-w-[44px] md:min-w-[40px]',
    'medium': 'min-h-[44px] md:min-h-[48px] min-w-[44px]',
    'large': 'min-h-[48px] md:min-h-[56px] min-w-[48px]',
    'giant': 'min-h-[56px] md:min-h-[72px] min-w-[56px] md:min-w-[72px] text-lg md:text-xl'
  };

  // Add gradient styling for primary and danger variants
  const gradientClasses = {
    'primary': 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 hover:from-brand-red-700 hover:to-brand-red-800 text-white border-0',
    'danger': 'bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white border-0'
  };

  return (
    <ReUIButton
      variant={reuiVariant}
      size={reuiSize}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        variant === 'primary' && gradientClasses['primary'],
        variant === 'danger' && gradientClasses['danger'],
        sizeClasses[size],
        fullWidth && 'w-full',
        'transition-all duration-300',
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
    </ReUIButton>
  );
}

// Export as default for drop-in replacement
export default Button;