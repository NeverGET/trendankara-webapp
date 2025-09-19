'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * Props for the ConfirmDialog component
 */
interface ConfirmDialogProps {
  /** Whether the dialog is open/visible */
  isOpen: boolean;
  /** Callback function called when the dialog should be closed */
  onClose: () => void;
  /** Callback function called when the user confirms the action */
  onConfirm: () => void | Promise<void>;
  /** Title text displayed at the top of the dialog */
  title: string;
  /** Main message content displayed in the dialog */
  message: string;
  /** Visual variant that determines the styling and icon */
  variant?: 'danger' | 'warning' | 'info';
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Whether the dialog is in a loading state */
  loading?: boolean;
  /** Error message to display when an operation fails */
  error?: string | null;
  /** Whether to show the retry button instead of confirm button */
  showRetry?: boolean;
  /** Callback function called when the retry button is clicked */
  onRetry?: () => void;
  /** Current retry attempt count for display purposes */
  retryCount?: number;
}

/**
 * Configuration object for different dialog variants
 * Maps variant types to their visual properties
 */
const variantConfig = {
  /** Default variant - neutral styling for general confirmations */
  default: {
    iconColor: 'text-gray-500',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    confirmVariant: 'primary' as const
  },
  /** Danger variant - red styling for destructive actions */
  danger: {
    iconColor: 'text-red-500',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    confirmVariant: 'danger' as const
  },
  /** Warning variant - yellow styling for cautionary actions */
  warning: {
    iconColor: 'text-yellow-500',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    confirmVariant: 'primary' as const
  },
  /** Info variant - blue styling for informational confirmations */
  info: {
    iconColor: 'text-blue-500',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    confirmVariant: 'primary' as const
  }
};

/**
 * ConfirmDialog Component
 *
 * A modal dialog component for user confirmations with support for different variants,
 * loading states, error handling, and retry functionality. Commonly used for
 * destructive actions like deletions that require user confirmation.
 *
 * @example
 * ```tsx
 * // Basic usage for deletion confirmation
 * <ConfirmDialog
 *   isOpen={isDeleteDialogOpen}
 *   onClose={() => setIsDeleteDialogOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Öğeyi Sil"
 *   message="Bu öğeyi silmek istediğinizden emin misiniz?"
 *   variant="danger"
 *   confirmText="Sil"
 *   cancelText="İptal"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Usage with error handling and retry
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onConfirm={handleAction}
 *   title="İşlemi Onayla"
 *   message="Bu işlemi gerçekleştirmek istediğiniz emin misiniz?"
 *   loading={isLoading}
 *   error={errorMessage}
 *   showRetry={showRetry}
 *   onRetry={handleRetry}
 *   retryCount={retryCount}
 *   variant="warning"
 * />
 * ```
 *
 * @param props - The props for the ConfirmDialog component
 * @returns The rendered ConfirmDialog component
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmText = 'Onayla',
  cancelText = 'İptal',
  loading = false,
  error,
  showRetry = false,
  onRetry,
  retryCount = 0
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  /**
   * Handles the confirm action with error catching
   * @private
   */
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling can be implemented here if needed
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full',
          variant === 'default' && 'bg-gray-500/10',
          variant === 'danger' && 'bg-red-500/10',
          variant === 'warning' && 'bg-yellow-500/10',
          variant === 'info' && 'bg-blue-500/10'
        )}>
          <div className={config.iconColor}>
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-dark-text-primary">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-dark-text-secondary leading-relaxed">
          {message}
        </p>

        {/* Error Message */}
        {error && (
          <div className="w-full p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
            {retryCount > 0 && (
              <p className="text-xs text-red-400/70 mt-1">
                Deneme {retryCount}/3
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 w-full pt-2">
          <Button
            variant="secondary"
            size="medium"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          {showRetry && onRetry ? (
            <Button
              variant="primary"
              size="medium"
              fullWidth
              onClick={onRetry}
              loading={loading}
              disabled={loading}
            >
              Tekrar Dene
            </Button>
          ) : (
            <Button
              variant={config.confirmVariant}
              size="medium"
              fullWidth
              onClick={handleConfirm}
              loading={loading}
              disabled={loading}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}