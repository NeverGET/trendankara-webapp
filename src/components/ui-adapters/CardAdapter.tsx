import React from 'react';
import {
  Card as ReUICard,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card-reui';
import { cn } from '@/lib/utils';

interface LegacyCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}

export function Card({
  title,
  footer,
  children,
  className,
  compact = false,
  ...props
}: LegacyCardProps) {
  // Apply the dark theme gradient styling to match the legacy look
  const cardClasses = cn(
    'bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50',
    'border-dark-border-primary/50',
    'transition-all duration-300',
    'hover:shadow-2xl hover:shadow-black/30 hover:border-dark-border-primary',
    'backdrop-blur-sm relative overflow-hidden',
    'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none',
    className
  );

  return (
    <ReUICard className={cardClasses} {...props}>
      {title && (
        <CardHeader
          className={cn(
            "border-b border-dark-border-primary/50 bg-gradient-to-r from-transparent to-dark-surface-primary/30",
            compact ? "p-2" : "p-3"
          )}
        >
          <CardTitle className="text-base md:text-lg font-semibold text-dark-text-primary bg-gradient-to-r from-dark-text-primary to-dark-text-secondary bg-clip-text">
            {title}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={cn("relative z-10", compact ? "p-2" : "p-3 md:p-3")}>
        {children}
      </CardContent>

      {footer && (
        <CardFooter
          className={cn(
            "border-t border-dark-border-primary/50 bg-gradient-to-r from-dark-surface-secondary/30 to-dark-surface-secondary/50 rounded-b-xl backdrop-blur-sm",
            compact ? "p-2" : "p-3"
          )}
        >
          {footer}
        </CardFooter>
      )}
    </ReUICard>
  );
}

// Export as default for drop-in replacement
export default Card;