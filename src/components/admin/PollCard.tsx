import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { getPollStatus, getDaysRemaining, getDaysUntilStart, getTimeRemainingText, isPollEndingSoon } from '@/lib/utils/poll-status';
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiClock,
  FiUsers,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiAward,
  FiExternalLink
} from 'react-icons/fi';

interface PollOption {
  id: number;
  name: string;
  votes: number;
  percentage: number;
  imageUrl?: string;
}

interface PollCardProps {
  id: number;
  title: string;
  description?: string;
  type: 'TOP_50' | 'TOP_10' | 'BEST_OF_MONTH' | 'LISTENER_CHOICE' | 'SPECIAL';
  totalVotes: number;
  uniqueVoters: number;
  options: PollOption[];
  startDate: string;
  endDate: string;
  status?: 'active' | 'scheduled' | 'ended' | 'draft'; // Made optional as we'll calculate it
  start_date: string; // Raw dates for calculation
  end_date: string;
  is_active?: boolean;
  daysRemaining?: number;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  onPreview?: (id: number) => void;
  onToggleStatus?: (id: number) => void;
}

const pollTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'weekly': { label: 'Haftalık', color: 'purple', icon: <FiAward /> },
  'monthly': { label: 'Aylık', color: 'pink', icon: <FiTrendingUp /> },
  'custom': { label: 'Özel', color: 'info', icon: <FiBarChart2 /> },
  'TOP_50': { label: 'Haftanın Top 50', color: 'purple', icon: <FiAward /> },
  'TOP_10': { label: 'Ayın Top 10', color: 'pink', icon: <FiTrendingUp /> },
  'BEST_OF_MONTH': { label: 'Ayın En İyisi', color: 'info', icon: <FiAward /> },
  'LISTENER_CHOICE': { label: 'Dinleyici Seçimi', color: 'success', icon: <FiUsers /> },
  'SPECIAL': { label: 'Özel Anket', color: 'warning', icon: <FiBarChart2 /> }
};

export const PollCard = React.memo(function PollCard({
  id,
  title,
  description,
  type,
  totalVotes,
  uniqueVoters,
  options,
  startDate,
  endDate,
  status,
  start_date,
  end_date,
  is_active,
  daysRemaining,
  onEdit,
  onDelete,
  onView,
  onPreview,
  onToggleStatus
}: PollCardProps) {
  const config = pollTypeConfig[type] || pollTypeConfig['custom'];
  const topOptions = (options || []).slice(0, 3);
  const participationRate = totalVotes > 0 ? Math.round((uniqueVoters / totalVotes) * 100) : 0;

  // Calculate real status from dates
  const realStatus = getPollStatus({ start_date, end_date, is_active });
  const actualDaysRemaining = getDaysRemaining(end_date);
  const timeRemainingText = getTimeRemainingText(end_date);
  const isEndingSoon = isPollEndingSoon(end_date);

  return (
    <div className={cn(
      "group relative bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50",
      "rounded-xl border border-dark-border-primary/50",
      "hover:shadow-2xl hover:shadow-black/30 hover:border-dark-border-primary",
      "transition-all duration-300 hover:-translate-y-1",
      "overflow-hidden"
    )}>
      {/* Header with Type Badge */}
      <div className="relative p-6 pb-4 border-b border-dark-border-primary/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              realStatus === 'active' ? "bg-green-600/20 text-green-500" :
              realStatus === 'scheduled' ? "bg-yellow-600/20 text-yellow-500" :
              realStatus === 'ended' ? "bg-red-600/20 text-red-500" :
              "bg-gray-600/20 text-gray-500"
            )}>
              {config.icon}
            </div>
            <Badge
              variant={config.color as any}
              size="sm"
              pill
            >
              {config.label}
            </Badge>
          </div>

          {/* Status Badge */}
          <Badge
            variant={
              realStatus === 'active' ? 'success' :
              realStatus === 'scheduled' ? 'warning' :
              realStatus === 'ended' ? 'error' :
              'default'
            }
            size="sm"
            pill
            animated={realStatus === 'active'}
          >
            {realStatus === 'active' ? '🟢 Aktif' :
             realStatus === 'scheduled' ? '🕐 Planlandı' :
             realStatus === 'ended' ? '🔴 Sona Erdi' :
             '📝 Taslak'}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-dark-text-primary mb-2 group-hover:text-red-500 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-dark-text-secondary line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Poll Stats */}
      <div className="p-6 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-dark-surface-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiBarChart2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-dark-text-secondary">Toplam Oy</span>
            </div>
            <p className="text-xl font-bold text-white">{totalVotes.toLocaleString('tr-TR')}</p>
          </div>
          <div className="bg-dark-surface-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiUsers className="w-4 h-4 text-pink-500" />
              <span className="text-xs text-dark-text-secondary">Katılımcı</span>
            </div>
            <p className="text-xl font-bold text-white">{uniqueVoters.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        {/* Top 3 Options */}
        {topOptions.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-dark-text-secondary mb-2 font-medium">İLK 3 SEÇİM</p>
            {topOptions.map((option, index) => (
              <div key={option.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  index === 0 ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black" :
                  index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white" :
                  "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-dark-text-primary truncate">{option.name}</span>
                    <span className="text-xs text-dark-text-secondary">{option.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-surface-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        index === 0 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                        index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500" :
                        "bg-gradient-to-r from-orange-600 to-orange-700"
                      )}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Date and Time Info */}
        <div className="flex items-center justify-between text-xs text-dark-text-secondary border-t border-dark-border-primary/30 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3" />
              <span>{startDate}</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3" />
              <span>{endDate}</span>
            </div>
          </div>
          {realStatus === 'active' && (
            <Badge
              variant={isEndingSoon ? 'error' : actualDaysRemaining <= 7 ? 'warning' : 'success'}
              size="sm"
              animated={isEndingSoon}
            >
              {timeRemainingText}
            </Badge>
          )}
          {realStatus === 'scheduled' && (
            <Badge
              variant="info"
              size="sm"
            >
              {getDaysUntilStart(start_date)} gün sonra başlayacak
            </Badge>
          )}
        </div>

        {/* Participation Rate */}
        {totalVotes > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-dark-text-secondary">Katılım Oranı</span>
              <span className="text-xs font-medium text-purple-500">{participationRate}%</span>
            </div>
            <div className="w-full h-1 bg-dark-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${participationRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-6 pt-0">
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
          onClick={() => onPreview?.(id)}
          className="flex-1"
          title="Önizleme"
        >
          <FiExternalLink className="w-4 h-4" />
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
          onClick={() => onToggleStatus?.(id)}
          className="flex-1"
        >
          {realStatus === 'active' ? (
            <FiXCircle className="w-4 h-4 text-orange-500" />
          ) : (
            <FiCheckCircle className="w-4 h-4 text-green-500" />
          )}
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if essential props have changed
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.type === nextProps.type &&
    prevProps.totalVotes === nextProps.totalVotes &&
    prevProps.uniqueVoters === nextProps.uniqueVoters &&
    prevProps.startDate === nextProps.startDate &&
    prevProps.endDate === nextProps.endDate &&
    prevProps.start_date === nextProps.start_date &&
    prevProps.end_date === nextProps.end_date &&
    prevProps.is_active === nextProps.is_active &&
    prevProps.daysRemaining === nextProps.daysRemaining &&
    JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
  );
});