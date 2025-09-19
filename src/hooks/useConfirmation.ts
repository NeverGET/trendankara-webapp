import { useState, useCallback } from 'react';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'danger' | 'warning' | 'info';
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  showRetry: boolean;
}

interface ConfirmationOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'info';
  maxRetries?: number;
  onRetry?: () => Promise<void>;
}

interface UseConfirmationReturn {
  // State
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'danger' | 'warning' | 'info';
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  showRetry: boolean;

  // Actions
  confirm: (options?: ConfirmationOptions) => Promise<boolean>;
  close: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleConfirm: () => void;
  handleRetry: () => void;
}

export function useConfirmation(): UseConfirmationReturn {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: 'Onaylama',
    message: 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?',
    confirmText: 'Onayla',
    cancelText: 'İptal',
    variant: 'default',
    isLoading: false,
    error: null,
    retryCount: 0,
    showRetry: false,
  });

  const [pendingResolve, setPendingResolve] = useState<((value: boolean) => void) | null>(null);
  const [retryOptions, setRetryOptions] = useState<ConfirmationOptions>({});

  const confirm = useCallback((options: ConfirmationOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        isOpen: true,
        title: options.title ?? 'Onaylama',
        message: options.message ?? 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?',
        confirmText: options.confirmText ?? 'Onayla',
        cancelText: options.cancelText ?? 'İptal',
        variant: options.variant ?? 'default',
        isLoading: false,
        error: null,
        retryCount: 0,
        showRetry: false,
      }));

      setRetryOptions(options);
      setPendingResolve(() => resolve);
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      error: null,
      retryCount: 0,
      showRetry: false,
    }));

    if (pendingResolve) {
      pendingResolve(false);
      setPendingResolve(null);
    }
    setRetryOptions({});
  }, [pendingResolve]);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => {
      const maxRetries = retryOptions.maxRetries ?? 3;
      const canRetry = prev.retryCount < maxRetries && !!retryOptions.onRetry;

      return {
        ...prev,
        error,
        isLoading: false,
        showRetry: error !== null && canRetry,
      };
    });
  }, [retryOptions]);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    if (pendingResolve) {
      pendingResolve(true);
      setPendingResolve(null);
    }
    setState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      error: null,
      retryCount: 0,
      showRetry: false,
    }));
    setRetryOptions({});
  }, [pendingResolve]);

  // Handle retry for failed operations
  const handleRetry = useCallback(async () => {
    if (!retryOptions.onRetry) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: prev.retryCount + 1,
      showRetry: false,
    }));

    try {
      await retryOptions.onRetry();
      // Success - close dialog and resolve
      if (pendingResolve) {
        pendingResolve(true);
        setPendingResolve(null);
      }
      setState(prev => ({
        ...prev,
        isOpen: false,
        isLoading: false,
        error: null,
        retryCount: 0,
        showRetry: false,
      }));
      setRetryOptions({});
    } catch (error) {
      // Failed again - show error and retry option if retries left
      const errorMessage = error instanceof Error ? error.message : 'İşlem başarısız oldu';
      setError(errorMessage);
    }
  }, [retryOptions, pendingResolve, setError]);

  return {
    // State
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    isLoading: state.isLoading,
    error: state.error,
    retryCount: state.retryCount,
    showRetry: state.showRetry,

    // Actions
    confirm,
    close,
    setLoading,
    setError,
    handleConfirm,
    handleRetry,
  };
}