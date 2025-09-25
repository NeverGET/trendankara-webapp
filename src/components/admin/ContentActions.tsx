'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { cn } from '@/lib/utils';
import {
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiGlobe
} from 'react-icons/fi';

interface ContentActionsProps {
  /** Content ID */
  id: number | string;
  /** Content title for confirmation messages */
  title: string;
  /** Content preview/excerpt (optional) */
  preview?: string;
  /** Content thumbnail URL (optional) */
  thumbnailUrl?: string;
  /** Current publication status */
  status: 'published' | 'draft' | 'archived' | 'scheduled';
  /** Content type for context */
  contentType: 'news' | 'poll' | 'page' | 'post';
  /** Show success notifications after action */
  showNotifications?: boolean;
  /** Callback for publish action */
  onPublish?: (id: number | string) => Promise<void>;
  /** Callback for unpublish action */
  onUnpublish?: (id: number | string) => Promise<void>;
  /** Callback for archive action */
  onArchive?: (id: number | string) => Promise<void>;
  /** Callback for schedule action */
  onSchedule?: (id: number | string) => Promise<void>;
  /** Custom className */
  className?: string;
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Show as icons only */
  iconsOnly?: boolean;
}

const contentTypeLabels = {
  news: 'haber',
  poll: 'anket',
  page: 'sayfa',
  post: 'gönderi'
};

export function ContentActions({
  id,
  title,
  preview,
  thumbnailUrl,
  status,
  contentType,
  showNotifications = true,
  onPublish,
  onUnpublish,
  onArchive,
  onSchedule,
  className,
  size = 'small',
  iconsOnly = false
}: ContentActionsProps) {
  const confirmation = useConfirmation();
  const contentLabel = contentTypeLabels[contentType];

  // Handle publish action
  const handlePublish = async () => {
    const confirmed = await confirmation.confirm({
      title: `${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} Yayınla`,
      message: `"${title}" başlıklı ${contentLabel} yayınlanacak ve herkese görünür hale gelecek.${preview ? `\n\nÖnizleme: ${preview.substring(0, 150)}${preview.length > 150 ? '...' : ''}` : ''}\n\nEmin misiniz?`,
      confirmText: 'Yayınla',
      cancelText: 'İptal',
      variant: 'info'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      await onPublish?.(id);
      if (showNotifications) {
        // TODO: Add toast notification for success
        console.log(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} başarıyla yayınlandı`);
      }
    } catch (error) {
      console.error('Error publishing content:', error);
      confirmation.setError(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} yayınlanırken bir hata oluştu.`);
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Handle unpublish action
  const handleUnpublish = async () => {
    const confirmed = await confirmation.confirm({
      title: `${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} Yayından Kaldır`,
      message: `"${title}" başlıklı ${contentLabel} yayından kaldırılacak ve artık görünür olmayacak.${preview ? `\n\nÖnizleme: ${preview.substring(0, 150)}${preview.length > 150 ? '...' : ''}` : ''}\n\nEmin misiniz?`,
      confirmText: 'Yayından Kaldır',
      cancelText: 'İptal',
      variant: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      await onUnpublish?.(id);
      if (showNotifications) {
        // TODO: Add toast notification for success
        console.log(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} başarıyla yayından kaldırıldı`);
      }
    } catch (error) {
      console.error('Error unpublishing content:', error);
      confirmation.setError(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} yayından kaldırılırken bir hata oluştu.`);
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Handle archive action
  const handleArchive = async () => {
    const confirmed = await confirmation.confirm({
      title: `${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} Arşivle`,
      message: `"${title}" başlıklı ${contentLabel} arşivlenecek.${preview ? `\n\nÖnizleme: ${preview.substring(0, 150)}${preview.length > 150 ? '...' : ''}` : ''}\n\nEmin misiniz?`,
      confirmText: 'Arşivle',
      cancelText: 'İptal',
      variant: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      await onArchive?.(id);
      if (showNotifications) {
        // TODO: Add toast notification for success
        console.log(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} başarıyla arşivlendi`);
      }
    } catch (error) {
      console.error('Error archiving content:', error);
      confirmation.setError(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} arşivlenirken bir hata oluştu.`);
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Handle schedule action
  const handleSchedule = async () => {
    const confirmed = await confirmation.confirm({
      title: `${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} Zamanla`,
      message: `"${title}" başlıklı ${contentLabel} zamanlanacak.${preview ? `\n\nÖnizleme: ${preview.substring(0, 150)}${preview.length > 150 ? '...' : ''}` : ''}\n\nEmin misiniz?`,
      confirmText: 'Zamanla',
      cancelText: 'İptal',
      variant: 'info'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      await onSchedule?.(id);
      if (showNotifications) {
        // TODO: Add toast notification for success
        console.log(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} başarıyla zamanlandı`);
      }
    } catch (error) {
      console.error('Error scheduling content:', error);
      confirmation.setError(`${contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)} zamanlanırken bir hata oluştu.`);
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Map size prop to Button component size
  const buttonSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'default';

  // Render action buttons based on current status
  const renderActions = () => {
    const actions: React.ReactElement[] = [];

    if (status === 'draft') {
      // Draft: can publish or schedule
      if (onPublish) {
        actions.push(
          <Button
            key="publish"
            variant="default"
            size={buttonSize}
            onClick={handlePublish}
            className="flex items-center gap-2"
          >
            <FiGlobe className="w-4 h-4" />
            {!iconsOnly && 'Yayınla'}
          </Button>
        );
      }
      if (onSchedule) {
        actions.push(
          <Button
            key="schedule"
            variant="secondary"
            size={buttonSize}
            onClick={handleSchedule}
            className="flex items-center gap-2"
          >
            <FiClock className="w-4 h-4" />
            {!iconsOnly && 'Zamanla'}
          </Button>
        );
      }
    } else if (status === 'published') {
      // Published: can unpublish or archive
      if (onUnpublish) {
        actions.push(
          <Button
            key="unpublish"
            variant="secondary"
            size={buttonSize}
            onClick={handleUnpublish}
            className="flex items-center gap-2"
          >
            <FiEyeOff className="w-4 h-4" />
            {!iconsOnly && 'Yayından Kaldır'}
          </Button>
        );
      }
      if (onArchive) {
        actions.push(
          <Button
            key="archive"
            variant="secondary"
            size={buttonSize}
            onClick={handleArchive}
            className="flex items-center gap-2"
          >
            <FiXCircle className="w-4 h-4" />
            {!iconsOnly && 'Arşivle'}
          </Button>
        );
      }
    } else if (status === 'scheduled') {
      // Scheduled: can publish now or cancel schedule
      if (onPublish) {
        actions.push(
          <Button
            key="publish-now"
            variant="default"
            size={buttonSize}
            onClick={handlePublish}
            className="flex items-center gap-2"
          >
            <FiCheckCircle className="w-4 h-4" />
            {!iconsOnly && 'Şimdi Yayınla'}
          </Button>
        );
      }
      if (onUnpublish) {
        actions.push(
          <Button
            key="cancel-schedule"
            variant="ghost"
            size={buttonSize}
            onClick={handleUnpublish}
            className="flex items-center gap-2"
          >
            <FiXCircle className="w-4 h-4" />
            {!iconsOnly && 'Zamanlamayı İptal Et'}
          </Button>
        );
      }
    } else if (status === 'archived') {
      // Archived: can publish or delete
      if (onPublish) {
        actions.push(
          <Button
            key="restore"
            variant="secondary"
            size={buttonSize}
            onClick={handlePublish}
            className="flex items-center gap-2"
          >
            <FiEye className="w-4 h-4" />
            {!iconsOnly && 'Geri Yükle'}
          </Button>
        );
      }
    }

    return actions;
  };

  return (
    <>
      <div className={cn("flex gap-2", className)}>
        {renderActions()}
      </div>

      {/* Content Preview in Confirmation */}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant as 'danger' | 'warning' | 'info'}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        loading={confirmation.isLoading}
      />
    </>
  );
}