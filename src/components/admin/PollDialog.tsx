'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ValidationModal } from '@/components/ui/ValidationModal';
import { AlertTriangle, Save, X, CheckCircle } from 'lucide-react';
import { usePollForm, PollFormData, PollItem } from '@/hooks/usePollForm';
import { createPollWithItems, updatePollWithItems } from '@/lib/api/admin-polls';
import PollFormFields from './PollFormFields';
import PollScheduler from './PollScheduler';
import { PollItemsManager } from './PollItemsManager';

interface PollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  poll?: any; // Poll data for editing
  mode?: 'create' | 'edit';
  onSubmit?: (data: PollFormData) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * PollDialog Component Shell
 *
 * Provides a modal dialog structure for creating and editing polls
 * Features:
 * - Modal dialog wrapper with proper focus management
 * - Form submission handling with loading states
 * - Error state management
 * - Close confirmation for dirty forms
 * - Responsive design for mobile and desktop
 */
export function PollDialog({
  isOpen,
  onClose,
  poll,
  mode = 'create',
  onSubmit,
  onSuccess
}: PollDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Initialize form with poll data for editing - use poll ID for stable memoization
  const formDefaultValues = React.useMemo(() => {
    if (mode === 'edit' && poll) {
      return {
        title: poll.title || '',
        description: poll.description || '',
        poll_type: poll.poll_type || 'custom',
        start_date: poll.start_date || '',
        end_date: poll.end_date || '',
        is_active: poll.is_active ?? true,
        show_on_homepage: poll.show_on_homepage ?? true,
        show_results: poll.show_results || 'after_voting',
        items: poll.items || []
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, poll?.id]); // Use poll ID for stability, not the entire poll object

  // Initialize form hook
  const {
    control,
    handleSubmit,
    submitForm,
    hasUnsavedChanges,
    isSubmitting,
    isValid,
    reset,
    errors,
    watch,
    setValue,
    getValues,
    getMinDate,
    trigger
  } = usePollForm({
    defaultValues: formDefaultValues,
    mode,
    onSubmit: async (data: PollFormData) => {
      console.log('🔥 onSubmit callback called with data:', data);
      setIsLoading(true);
      setError(null);

      try {
        let result;

        if (mode === 'create') {
          // Create new poll with items
          console.log('📝 Calling createPollWithItems...');
          result = await createPollWithItems(data);
          console.log('✅ createPollWithItems result:', result);
        } else if (mode === 'edit' && poll?.id) {
          // Update existing poll with items
          console.log('📝 Calling updatePollWithItems...');
          result = await updatePollWithItems(poll.id, data);
          console.log('✅ updatePollWithItems result:', result);
        } else {
          throw new Error('Invalid mode or missing poll ID');
        }

        if (!result.success) {
          console.error('❌ API returned error:', result.error);
          throw new Error(result.error || 'İşlem başarısız oldu');
        }

        // Call custom onSubmit if provided
        if (onSubmit) {
          await onSubmit(data);
        }

        // Show success message
        const successMsg = mode === 'create'
          ? 'Anket başarıyla oluşturuldu!'
          : 'Anket başarıyla güncellendi!';
        console.log('✅ Success! Showing message:', successMsg);
        setSuccessMessage(successMsg);

        // Clear success message after delay and close
        setTimeout(() => {
          console.log('⏰ Timeout complete, closing dialog');
          setSuccessMessage(null);
          reset();
          onSuccess?.();
          onClose();
        }, 1500);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
        console.error('❌ Poll submission error:', err);
        setError(errorMessage);
      } finally {
        console.log('🔄 Setting isLoading to false');
        setIsLoading(false);
      }
    }
  });

  // Watch form values for components
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const pollItems = watch('items');

  // Determine if poll is "online" (started and active)
  const isPollOnline = React.useMemo(() => {
    if (mode !== 'edit' || !poll) return false;

    const now = new Date();
    const start = new Date(poll.start_date);
    const isActive = poll.is_active;

    // Poll is online if it's active AND start time has passed
    return isActive && now >= start;
  }, [mode, poll]);

  // Keep a stable reference to poll items
  const pollItemsRef = React.useRef(pollItems);
  React.useEffect(() => {
    pollItemsRef.current = pollItems;
  }, [pollItems]);

  // Keep track of previous poll ID to detect actual changes
  const prevPollIdRef = React.useRef<number | undefined>(undefined);

  // Reset form when dialog opens/closes or poll actually changes
  useEffect(() => {
    const pollId = poll?.id;
    const prevPollId = prevPollIdRef.current;

    // Only reset if dialog just opened or poll actually changed
    if (isOpen && (prevPollId !== pollId || !prevPollIdRef.current)) {
      if (poll && mode === 'edit') {
        reset(formDefaultValues);
      } else if (mode === 'create') {
        reset();
      }
      prevPollIdRef.current = pollId;
    }

    // Clear error when dialog opens
    if (isOpen) {
      setError(null);
    }

    // Clear ref when dialog closes
    if (!isOpen) {
      prevPollIdRef.current = undefined;
    }
  }, [isOpen, poll?.id, mode, formDefaultValues, reset]);

  // Handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isOpen) {
        e.preventDefault();
        e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?';
        return e.returnValue;
      }
    };

    if (isOpen) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [hasUnsavedChanges, isOpen]);

  // Handle close with confirmation if form is dirty
  const handleClose = () => {
    if (hasUnsavedChanges && !isLoading) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Confirm close without saving
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    reset(); // Reset form to clear dirty state
    onClose();
  };

  // Cancel close confirmation
  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  // Save and close handler
  const handleSaveAndClose = async () => {
    console.log('handleSaveAndClose called');

    // Early validation checks
    if (isLoading || isSavingAndClosing) {
      console.log('Blocked by loading state:', { isLoading, isSavingAndClosing });
      return;
    }

    setIsSavingAndClosing(true);
    setShowCloseConfirm(false);
    setError(null);

    try {
      // Manually trigger form validation
      console.log('Triggering validation...');
      const isFormValid = await trigger();
      console.log('Validation result:', isFormValid);

      if (!isFormValid) {
        console.log('Validation failed, showing error');
        setIsSavingAndClosing(false);
        setError('Lütfen tüm zorunlu alanları doldurun');
        return;
      }

      // Get current form values
      const formData = getValues();
      console.log('Form data:', formData);

      // Call submitForm which directly invokes the onSubmit handler
      console.log('Calling submitForm...');
      await submitForm();

      // Success - reset the saving state
      // The onSubmit handler in usePollForm will close the dialog after showing success message
      console.log('submitForm completed successfully');
      setIsSavingAndClosing(false);
    } catch (error) {
      console.error('Error saving before close:', error);
      setError(error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu');
      setIsSavingAndClosing(false);
    }
  };

  // Form submission handler
  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    // Show validation modal if form is invalid
    if (!isValid) {
      setShowValidationSummary(true);
      return;
    }

    setShowValidationSummary(false);
    await handleSubmit();
  };

  // Build validation errors array for ValidationModal
  const validationErrors = React.useMemo(() => {
    const errorList: Array<{ field: string; message: string }> = [];
    if (errors.title) {
      errorList.push({ field: 'Anket Başlığı', message: errors.title.message || 'Bu alan zorunludur' });
    }
    if (errors.start_date) {
      errorList.push({ field: 'Başlangıç Tarihi', message: errors.start_date.message || 'Bu alan zorunludur' });
    }
    if (errors.end_date) {
      errorList.push({ field: 'Bitiş Tarihi', message: errors.end_date.message || 'Bu alan zorunludur' });
    }
    if (errors.items) {
      errorList.push({ field: 'Anket Seçenekleri', message: errors.items.message || 'En az 2 seçenek gereklidir' });
    }
    return errorList;
  }, [errors]);

  // Dialog title based on mode
  const dialogTitle = mode === 'create' ? 'Yeni Anket Oluştur' : 'Anket Düzenle';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={dialogTitle}
        size="large"
      >
        <form onSubmit={onSubmitHandler} className="space-y-6">
          {/* Success Display */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Başarılı!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-brand-red-600 dark:text-brand-red-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-brand-red-800 dark:text-brand-red-200">
                    Hata Oluştu
                  </h4>
                  <p className="text-sm text-brand-red-700 dark:text-brand-red-300 mt-1">
                    {error}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-brand-red-600 dark:text-brand-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Note: Validation errors now shown in ValidationModal instead of inline banner */}

          {/* Form Content */}
          <div className="space-y-8">
            {/* Online Poll Warning for Edit Mode */}
            {isPollOnline && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Canlı Anket - Kısıtlı Düzenleme
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Bu anket başlamış ve oylamaya açık. Sadece açıklama düzenlenebilir. Diğer alanlar ve seçenekler değiştirilemez.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Poll Basic Information */}
            <PollFormFields
              control={control}
              errors={errors}
              disabled={isLoading || (isPollOnline && mode === 'edit')} // Disable all fields for online polls except description
              descriptionOnly={isPollOnline} // Special prop to only enable description
            />

            {/* Poll Scheduling */}
            <PollScheduler
              startDate={startDate || ''}
              endDate={endDate || ''}
              onStartDateChange={(date) => setValue('start_date', date, { shouldDirty: true })}
              onEndDateChange={(date) => setValue('end_date', date, { shouldDirty: true })}
              startDateError={errors.start_date?.message}
              endDateError={errors.end_date?.message}
              disabled={isLoading || isPollOnline} // Disable for online polls
              minDate={getMinDate()}
              isEditMode={mode === 'edit'}
            />

            {/* Poll Options Management */}
            <PollItemsManager
              pollId={poll?.id}
              items={pollItems || []}
              onChange={(items: PollItem[]) => setValue('items', items, { shouldDirty: true })}
              readOnly={isLoading || isPollOnline} // Disable for online polls
            />

            {/* Items Validation Error */}
            {errors.items && (
              <div className="bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-brand-red-600 dark:text-brand-red-400" />
                  <div className="text-sm text-brand-red-700 dark:text-brand-red-300">
                    {errors.items.message}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-dark-border-secondary">
            <div className="flex-1">
              {hasUnsavedChanges && (
                <div className="text-xs text-dark-text-tertiary">
                  Kaydedilmemiş değişiklikler var
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                İptal
              </Button>

              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                className={`min-w-[120px] flex items-center gap-2 transition-all ${
                  !isValid ? 'opacity-75 hover:opacity-100' : ''
                }`}
                title={!isValid ? 'Formu tamamlayın' : ''}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" hideText />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{mode === 'create' ? 'Oluştur' : 'Güncelle'}</span>
                    {!isValid && <span className="text-xs">*</span>}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Validation Errors Modal */}
      <ValidationModal
        isOpen={showValidationSummary && !isValid}
        onClose={() => setShowValidationSummary(false)}
        errors={validationErrors}
        title="Form Doğrulama Hataları"
        description="Formu kaydetmek için lütfen aşağıdaki hataları düzeltin:"
      />

      {/* Close Confirmation Dialog */}
      <Modal
        isOpen={showCloseConfirm}
        onClose={handleCancelClose}
        title="Kaydedilmemiş Değişiklikler"
        size="medium"
      >
        <div className="space-y-6">
          {/* Warning Icon and Message */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-600/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark-text-primary mb-2">
                Değişiklikleri kaydetmeden çıkmak istediğinizden emin misiniz?
              </h3>
              <p className="text-dark-text-secondary">
                Formda kaydedilmemiş değişiklikleriniz var. Çıkarsanız bu değişiklikler kaybolacaktır.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-border-secondary">
            <Button
              onClick={handleCancelClose}
              variant="secondary"
              className="flex-1 sm:flex-initial min-w-[100px]"
              disabled={isSavingAndClosing}
            >
              İptal
            </Button>
            <div className="flex gap-3 flex-1 sm:flex-initial">
              <Button
                onClick={handleConfirmClose}
                variant="destructive"
                className="flex-1 min-w-[120px]"
                disabled={isSavingAndClosing}
              >
                Çık (Kaydetme)
              </Button>
              <Button
                onClick={handleSaveAndClose}
                variant="default"
                className="flex-1 min-w-[120px] flex items-center gap-2"
                disabled={!isValid || isSavingAndClosing}
              >
                {isSavingAndClosing ? (
                  <>
                    <LoadingSpinner size="small" hideText />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Kaydet ve Çık</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default PollDialog;