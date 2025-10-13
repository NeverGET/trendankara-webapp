'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  title?: string;
  description?: string;
}

/**
 * ValidationModal Component
 *
 * A reusable modal for displaying form validation errors.
 * Provides a clear, prominent display of all validation issues.
 *
 * Usage:
 * ```tsx
 * <ValidationModal
 *   isOpen={showValidation}
 *   onClose={() => setShowValidation(false)}
 *   errors={[
 *     { field: 'Anket başlığı', message: 'Bu alan zorunludur' },
 *     { field: 'Başlangıç tarihi', message: 'Geçerli bir tarih giriniz' }
 *   ]}
 * />
 * ```
 */
export function ValidationModal({
  isOpen,
  onClose,
  errors,
  title = 'Form Doğrulama Hataları',
  description = 'Formu kaydetmek için lütfen aşağıdaki hataları düzeltin:'
}: ValidationModalProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >
      <div className="space-y-4">
        {/* Warning Header */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex-shrink-0 w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center mt-0.5">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {description}
            </p>
          </div>
        </div>

        {/* Error List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-dark-text-secondary">
            {`Düzeltilmesi Gereken Alanlar (${errors.length}):`}
          </h4>
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li
                key={index}
                className="flex items-start gap-2 p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary"
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-600/20 text-red-600 dark:text-red-400 text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-text-primary">
                    {error.field}
                  </p>
                  <p className="text-sm text-dark-text-secondary mt-0.5">
                    {error.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-dark-border-secondary">
          <Button
            onClick={onClose}
            variant="default"
            className="min-w-[120px]"
          >
            Anladım
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ValidationModal;
