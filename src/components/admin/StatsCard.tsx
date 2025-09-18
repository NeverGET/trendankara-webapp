import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  className
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
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
    <Card className={cn('p-6 transition-all duration-200 hover:shadow-lg', className)}>
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className="p-2 bg-dark-surface-primary rounded-lg text-brand-red-600">
            {icon}
          </div>
        )}
        {trend && (
          <span className={cn(
            'text-sm font-medium flex items-center gap-1',
            trend.isPositive ? 'text-green-500' : 'text-red-500'
          )}>
            {trend.isPositive ? '↑' : '↓'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-sm text-dark-text-secondary mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-dark-text-primary">
          {value}
        </p>
      </div>
    </Card>
  );
}