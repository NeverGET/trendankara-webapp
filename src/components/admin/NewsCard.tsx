import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiClock,
  FiUser,
  FiMessageSquare,
  FiTrendingUp
} from 'react-icons/fi';

interface NewsCardProps {
  id: number;
  title: string;
  excerpt?: string;
  category: string;
  author?: string;
  publishedAt: string;
  viewCount?: number;
  commentCount?: number;
  imageUrl?: string;
  status: 'published' | 'draft' | 'archived';
  isHot?: boolean;
  isBreaking?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
}

const categoryColors: Record<string, string> = {
  'MAGAZIN': 'purple',
  'SANATÇI': 'pink',
  'ALBÜM': 'info',
  'KONSER': 'success',
  'HABER': 'warning'
};

export function NewsCard({
  id,
  title,
  excerpt,
  category,
  author = 'Admin',
  publishedAt,
  viewCount = 0,
  commentCount = 0,
  imageUrl,
  status,
  isHot = false,
  isBreaking = false,
  onEdit,
  onDelete,
  onView
}: NewsCardProps) {
  return (
    <div className={cn(
      "group relative bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50",
      "rounded-xl border border-dark-border-primary/50",
      "hover:shadow-2xl hover:shadow-black/30 hover:border-dark-border-primary",
      "transition-all duration-300 hover:-translate-y-1",
      "overflow-hidden"
    )}>
      {/* Image Section */}
      {imageUrl ? (
        <div className="relative h-48 overflow-hidden bg-dark-surface-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-dark-surface-secondary to-dark-surface-primary flex items-center justify-center">
          <FiMessageSquare className="w-12 h-12 text-dark-text-secondary/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Badge
          variant={categoryColors[category] as any || 'default'}
          size="sm"
          pill
        >
          {category}
        </Badge>
        {isHot && (
          <Badge variant="error" size="sm" pill animated>
            🔥 HOT
          </Badge>
        )}
        {isBreaking && (
          <Badge variant="warning" size="sm" pill animated>
            ⚡ SON DAKİKA
          </Badge>
        )}
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <Badge
          variant={
            status === 'published' ? 'success' :
            status === 'draft' ? 'warning' :
            'default'
          }
          size="sm"
          pill
        >
          {status === 'published' ? 'Yayında' :
           status === 'draft' ? 'Taslak' :
           'Arşiv'}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
          {title}
        </h3>

        {excerpt && (
          <p className="text-sm text-dark-text-secondary mb-4 line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-4 text-xs text-dark-text-secondary">
          <div className="flex items-center gap-1">
            <FiUser className="w-3 h-3" />
            <span>{author}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span>{publishedAt}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <FiEye className="w-4 h-4 text-purple-500" />
            <span className="text-dark-text-secondary">{viewCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <FiMessageSquare className="w-4 h-4 text-pink-500" />
            <span className="text-dark-text-secondary">{commentCount}</span>
          </div>
          {viewCount > 100 && (
            <div className="flex items-center gap-1 text-sm">
              <FiTrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 text-xs">Popüler</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-dark-border-primary/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(id)}
            className="flex-1"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(id)}
            className="flex-1"
          >
            <FiEdit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(id)}
            className="flex-1 text-red-500 hover:text-red-400"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}