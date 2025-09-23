'use client';

import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Enhanced toast functions with RED/BLACK/WHITE theme
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <CheckCircle className="h-5 w-5" />,
      className: 'bg-dark-surface-primary border-green-600',
      action: options?.action,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="h-5 w-5" />,
      className: 'bg-dark-surface-primary border-red-600',
      action: options?.action,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <AlertCircle className="h-5 w-5" />,
      className: 'bg-dark-surface-primary border-yellow-600',
      action: options?.action,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <Info className="h-5 w-5" />,
      className: 'bg-dark-surface-primary border-blue-600',
      action: options?.action,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  },

  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },

  custom: (jsx: React.ReactNode, options?: any) => {
    return sonnerToast.custom(jsx, options);
  },
};

export default toast;