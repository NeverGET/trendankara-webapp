'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog-reui';
import { cn } from '@/lib/utils';

interface LegacyConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  error?: string | null;
  showRetry?: boolean;
  onRetry?: () => void;
  retryCount?: number;
}

const variantConfig = {
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
    confirmClasses: 'bg-primary text-primary-foreground hover:bg-primary/90'
  },
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
    confirmClasses: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  },
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
    confirmClasses: 'bg-primary text-primary-foreground hover:bg-primary/90'
  },
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
    confirmClasses: 'bg-primary text-primary-foreground hover:bg-primary/90'
  }
};

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
}: LegacyConfirmDialogProps) {
  const config = variantConfig[variant] || variantConfig.default;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon */}
            <div className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full',
              variant === 'danger' && 'bg-red-500/10',
              variant === 'warning' && 'bg-yellow-500/10',
              variant === 'info' && 'bg-blue-500/10'
            )}>
              <div className={config.iconColor}>
                {config.icon}
              </div>
            </div>

            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              {title}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </AlertDialogDescription>

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
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={loading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {cancelText}
          </AlertDialogCancel>

          {showRetry && onRetry ? (
            <AlertDialogAction
              onClick={onRetry}
              disabled={loading}
              className={config.confirmClasses}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                'Tekrar Dene'
              )}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={config.confirmClasses}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                confirmText
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Export as default for drop-in replacement
export default ConfirmDialog;