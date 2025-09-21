import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink';
  };
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  badge,
  loading = false,
  className
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn('p-4 md:p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-dark-surface-secondary rounded-lg" />
            <div className="w-16 h-4 bg-dark-surface-secondary rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-20 h-3 bg-dark-surface-secondary rounded" />
            <div className="w-32 h-8 bg-dark-surface-secondary rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'p-4 md:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
      'bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/30',
      'group relative overflow-hidden',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-red-600/5 to-transparent rounded-full blur-2xl group-hover:from-brand-red-600/10 transition-colors duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            {icon && (
              <div className="p-2 md:p-3 bg-gradient-to-br from-brand-red-600/20 to-brand-red-700/10 rounded-xl text-brand-red-500 shadow-lg shadow-brand-red-900/20 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                {icon}
              </div>
            )}
            {badge && (
              <Badge
                variant={badge.variant || 'info'}
                size="small"
                pill
                animated
              >
                {badge.text}
              </Badge>
            )}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-medium text-xs md:text-sm',
              trend.isPositive
                ? 'bg-gradient-to-r from-green-600/20 to-green-700/10 text-green-400'
                : 'bg-gradient-to-r from-red-600/20 to-red-700/10 text-red-400'
            )}>
              <span className="text-sm md:text-lg">
                {trend.isPositive ? '↑' : '↓'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <div>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1 md:mb-2 font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}