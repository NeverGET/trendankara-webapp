'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PollSkeletonProps {
  className?: string;
  variant?: 'grid' | 'list';
}

/**
 * PollSkeleton Component
 *
 * Loading skeleton that matches the layout of poll cards
 * Features:
 * - Shimmer animation effect
 * - Responsive design for grid/list views
 * - Matches PollCard component structure
 * - Dark theme compatible
 */
export function PollSkeleton({ className = '', variant = 'grid' }: PollSkeletonProps) {
  const shimmer = (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
  );

  if (variant === 'list') {
    return (
      <div className={cn(
        "bg-gradient-to-r from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-4",
        className
      )}>
        <div className="flex items-start gap-4">
          {/* Selection Checkbox Skeleton */}
          <div className="mt-1 relative overflow-hidden">
            <div className="w-4 h-4 bg-dark-surface-secondary rounded"></div>
            {shimmer}
          </div>

          <div className="flex-1">
            {/* Title and Badges Skeleton */}
            <div className="flex items-center gap-3 mb-2">
              <div className="relative overflow-hidden">
                <div className="h-6 bg-dark-surface-secondary rounded w-48"></div>
                {shimmer}
              </div>
              <div className="relative overflow-hidden">
                <div className="h-5 bg-dark-surface-secondary rounded-full w-20"></div>
                {shimmer}
              </div>
              <div className="relative overflow-hidden">
                <div className="h-5 bg-dark-surface-secondary rounded-full w-16"></div>
                {shimmer}
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="relative overflow-hidden mb-2">
              <div className="h-4 bg-dark-surface-secondary rounded w-3/4"></div>
              {shimmer}
            </div>

            {/* Stats Skeleton */}
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1">
                <div className="relative overflow-hidden">
                  <div className="w-3 h-3 bg-dark-surface-secondary rounded"></div>
                  {shimmer}
                </div>
                <div className="relative overflow-hidden">
                  <div className="h-3 bg-dark-surface-secondary rounded w-12"></div>
                  {shimmer}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative overflow-hidden">
                  <div className="w-3 h-3 bg-dark-surface-secondary rounded"></div>
                  {shimmer}
                </div>
                <div className="relative overflow-hidden">
                  <div className="h-3 bg-dark-surface-secondary rounded w-16"></div>
                  {shimmer}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative overflow-hidden">
                  <div className="w-3 h-3 bg-dark-surface-secondary rounded"></div>
                  {shimmer}
                </div>
                <div className="relative overflow-hidden">
                  <div className="h-3 bg-dark-surface-secondary rounded w-24"></div>
                  {shimmer}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Skeleton */}
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="relative overflow-hidden">
                <div className="w-8 h-8 bg-dark-surface-secondary rounded"></div>
                {shimmer}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn(
      "group relative bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50",
      "rounded-xl border border-dark-border-primary/50 overflow-hidden",
      className
    )}>
      {/* Header Skeleton */}
      <div className="relative p-6 pb-4 border-b border-dark-border-primary/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Icon Skeleton */}
            <div className="relative overflow-hidden">
              <div className="p-2 bg-dark-surface-secondary rounded-lg w-10 h-10"></div>
              {shimmer}
            </div>
            {/* Badge Skeleton */}
            <div className="relative overflow-hidden">
              <div className="h-5 bg-dark-surface-secondary rounded-full w-24"></div>
              {shimmer}
            </div>
          </div>

          {/* Status Badge Skeleton */}
          <div className="relative overflow-hidden">
            <div className="h-5 bg-dark-surface-secondary rounded-full w-16"></div>
            {shimmer}
          </div>
        </div>

        {/* Title Skeleton */}
        <div className="relative overflow-hidden mb-2">
          <div className="h-6 bg-dark-surface-secondary rounded w-3/4"></div>
          {shimmer}
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="relative overflow-hidden">
            <div className="h-4 bg-dark-surface-secondary rounded w-full"></div>
            {shimmer}
          </div>
          <div className="relative overflow-hidden">
            <div className="h-4 bg-dark-surface-secondary rounded w-2/3"></div>
            {shimmer}
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="p-6 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Stat Cards */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-dark-surface-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative overflow-hidden">
                  <div className="w-4 h-4 bg-dark-surface-secondary rounded"></div>
                  {shimmer}
                </div>
                <div className="relative overflow-hidden">
                  <div className="h-3 bg-dark-surface-secondary rounded w-16"></div>
                  {shimmer}
                </div>
              </div>
              <div className="relative overflow-hidden">
                <div className="h-6 bg-dark-surface-secondary rounded w-12"></div>
                {shimmer}
              </div>
            </div>
          ))}
        </div>

        {/* Top Options Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="relative overflow-hidden mb-2">
            <div className="h-3 bg-dark-surface-secondary rounded w-20"></div>
            {shimmer}
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Rank Skeleton */}
              <div className="relative overflow-hidden">
                <div className="w-6 h-6 bg-dark-surface-secondary rounded-full"></div>
                {shimmer}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="relative overflow-hidden">
                    <div className="h-4 bg-dark-surface-secondary rounded w-24"></div>
                    {shimmer}
                  </div>
                  <div className="relative overflow-hidden">
                    <div className="h-3 bg-dark-surface-secondary rounded w-8"></div>
                    {shimmer}
                  </div>
                </div>
                {/* Progress Bar Skeleton */}
                <div className="w-full h-2 bg-dark-surface-secondary rounded-full overflow-hidden">
                  <div className="relative overflow-hidden">
                    <div className="h-full bg-dark-surface-tertiary rounded-full w-1/2"></div>
                    {shimmer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Date Info Skeleton */}
        <div className="flex items-center justify-between text-xs border-t border-dark-border-primary/30 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="relative overflow-hidden">
                <div className="w-3 h-3 bg-dark-surface-secondary rounded"></div>
                {shimmer}
              </div>
              <div className="relative overflow-hidden">
                <div className="h-3 bg-dark-surface-secondary rounded w-16"></div>
                {shimmer}
              </div>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="relative overflow-hidden">
                <div className="w-3 h-3 bg-dark-surface-secondary rounded"></div>
                {shimmer}
              </div>
              <div className="relative overflow-hidden">
                <div className="h-3 bg-dark-surface-secondary rounded w-16"></div>
                {shimmer}
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden">
            <div className="h-4 bg-dark-surface-secondary rounded w-20"></div>
            {shimmer}
          </div>
        </div>

        {/* Participation Rate Skeleton */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="relative overflow-hidden">
              <div className="h-3 bg-dark-surface-secondary rounded w-20"></div>
              {shimmer}
            </div>
            <div className="relative overflow-hidden">
              <div className="h-3 bg-dark-surface-secondary rounded w-8"></div>
              {shimmer}
            </div>
          </div>
          <div className="w-full h-1 bg-dark-surface-secondary rounded-full overflow-hidden">
            <div className="relative overflow-hidden">
              <div className="h-full bg-dark-surface-tertiary rounded-full w-2/3"></div>
              {shimmer}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex gap-2 p-6 pt-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 relative overflow-hidden">
            <div className="h-8 bg-dark-surface-secondary rounded"></div>
            {shimmer}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PollSkeleton;