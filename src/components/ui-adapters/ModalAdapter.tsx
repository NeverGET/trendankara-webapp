'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog-reui';
import { cn } from '@/lib/utils';
import React from 'react';

interface LegacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  children: React.ReactNode;
}

// Removed unused variable

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'large',
  children
}: LegacyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          // ReUI enhanced styling - solid background
          'bg-background border-border',
          'shadow-2xl shadow-black/20',
          // Size classes matching dialog-reui defaults
          size === 'small' && 'sm:max-w-xl',
          size === 'medium' && 'sm:max-w-2xl md:max-w-3xl',
          size === 'large' && 'sm:max-w-3xl md:max-w-4xl lg:max-w-4xl',
          size === 'fullscreen' && 'max-w-[95vw] min-h-[95vh] rounded-none'
        )}
      >
        {title && (
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="w-full">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export as default for drop-in replacement
export default Modal;