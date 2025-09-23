'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  children: React.ReactNode;
}

const sizeClasses = {
  small: 'max-w-full md:max-w-md',
  medium: 'max-w-full md:max-w-2xl',
  large: 'max-w-full md:max-w-4xl',
  fullscreen: 'max-w-full h-full'
};

const marginClasses = {
  small: 'm-4 md:mx-auto',
  medium: 'm-4 md:mx-auto',
  large: 'm-4 md:mx-auto',
  fullscreen: 'm-0'
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      (previousFocus.current as HTMLElement)?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full animate-slide-up my-8',
          'bg-dark-surface-primary rounded-lg border border-dark-border-primary',
          'shadow-2xl shadow-black/50',
          sizeClasses[size],
          marginClasses[size],
          size === 'fullscreen' && 'rounded-none my-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-dark-border-primary">
            <h2 id="modal-title" className="text-lg md:text-xl font-semibold text-dark-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-secondary transition-all flex items-center justify-center"
              aria-label="Kapat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className={cn(
          'p-4 md:p-6',
          size === 'fullscreen' && 'h-[calc(100vh-80px)]',
          size === 'large' && 'max-h-[calc(100vh-200px)] overflow-y-auto',
          size === 'medium' && 'max-h-[calc(100vh-200px)] overflow-y-auto',
          size === 'small' && 'max-h-[calc(100vh-200px)] overflow-y-auto'
        )}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}