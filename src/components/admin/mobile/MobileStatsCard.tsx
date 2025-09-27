/**
 * Mobile Stats Card Component
 * Displays statistics for mobile content
 * Requirements: 3.3 - Dashboard statistics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-reui';
import { LucideIcon } from 'lucide-react';

interface MobileStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorClasses = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  yellow: 'text-yellow-600 bg-yellow-100',
  red: 'text-red-600 bg-red-100',
  purple: 'text-purple-600 bg-purple-100',
};

export function MobileStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue'
}: MobileStatsCardProps) {
  const iconColorClass = colorClasses[color];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${iconColorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">
              önceki aya göre
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}