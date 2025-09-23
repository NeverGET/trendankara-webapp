'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/ui-adapters/TextareaAdapter';
import { StreamTestButton } from '@/components/admin/StreamTestButton';
import { StreamTestResult } from '@/components/admin/StreamTestResult';
import { StreamPreviewSection } from '@/components/admin/StreamPreviewSection';
import { cn } from '@/lib/utils';
import type { StreamTestResult as StreamTestResultType, StreamTestResponse, StreamMetadata } from '@/types/radioSettings';

interface RadioSettingsFormData {
  stationName: string;
  description: string;
  streamUrl: string;
  backupStreamUrl?: string;
  websiteUrl?: string;
  socialUrl?: string;
}

interface RadioSettingsFormProps {
  initialData?: Partial<RadioSettingsFormData>;
  onSubmit: (data: RadioSettingsFormData) => Promise<void>;
  isLoading?: boolean;
}

// URL validation utility
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Basic URL pattern - must start with http:// or https://
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function RadioSettingsForm({
  initialData,
  onSubmit,
  isLoading = false
}: RadioSettingsFormProps) {
  const [testResults, setTestResults] = useState<StreamTestResultType | null>(null);
  const [streamMetadata, setStreamMetadata] = useState<StreamMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const previewCleanupRef = useRef<(() => void) | null>(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RadioSettingsFormData | null>(null);

  const [inlineValidationErrors, setInlineValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    setError,
    clearErrors
  } = useForm<RadioSettingsFormData>({
    defaultValues: {
      stationName: initialData?.stationName || '',
      description: initialData?.description || '',
      streamUrl: initialData?.streamUrl || '',
      backupStreamUrl: initialData?.backupStreamUrl || '',
      websiteUrl: initialData?.websiteUrl || '',
      socialUrl: initialData?.socialUrl || ''
    }
  });

  const streamUrlValue = watch('streamUrl');
  const backupStreamUrlValue = watch('backupStreamUrl');
  const websiteUrlValue = watch('websiteUrl');
  const socialUrlValue = watch('socialUrl');

  // Debounced values for validation
  const debouncedStreamUrl = useDebounce(streamUrlValue, 500);
  const debouncedBackupStreamUrl = useDebounce(backupStreamUrlValue, 500);
  const debouncedWebsiteUrl = useDebounce(websiteUrlValue, 500);
  const debouncedSocialUrl = useDebounce(socialUrlValue, 500);

  // Debounced validation effect
  const validateUrlField = useCallback((value: string, fieldName: string) => {
    if (!value) {
      setInlineValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return;
    }

    if (!isValidUrl(value)) {
      setInlineValidationErrors(prev => ({
        ...prev,
        [fieldName]: 'Geçerli bir URL girin (http:// veya https:// ile başlamalı)'
      }));
    } else {
      setInlineValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, []);

  useEffect(() => {
    validateUrlField(debouncedStreamUrl, 'streamUrl');
  }, [debouncedStreamUrl, validateUrlField]);

  useEffect(() => {
    validateUrlField(debouncedBackupStreamUrl, 'backupStreamUrl');
  }, [debouncedBackupStreamUrl, validateUrlField]);

  useEffect(() => {
    validateUrlField(debouncedWebsiteUrl, 'websiteUrl');
  }, [debouncedWebsiteUrl, validateUrlField]);

  useEffect(() => {
    validateUrlField(debouncedSocialUrl, 'socialUrl');
  }, [debouncedSocialUrl, validateUrlField]);

  // Cleanup preview on component unmount
  useEffect(() => {
    return () => {
      if (previewCleanupRef.current) {
        previewCleanupRef.current();
      }
    };
  }, []);

  // Cleanup preview on URL change (navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (previewCleanupRef.current) {
        previewCleanupRef.current();
      }
    };

    const handlePopState = () => {
      if (previewCleanupRef.current) {
        previewCleanupRef.current();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle test completion from StreamTestButton
  const handleTestComplete = useCallback((response: StreamTestResponse) => {
    setTestResults(response.result);
    if (response.metadata) {
      setStreamMetadata(response.metadata);
    }
  }, []);

  // Handle test error from StreamTestButton
  const handleTestError = useCallback((error: string) => {
    setTestResults({
      success: false,
      message: error,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Handle retry from StreamTestResult
  const handleRetry = useCallback(() => {
    setTestResults(null);
    setStreamMetadata(null);
    if (previewCleanupRef.current) {
      previewCleanupRef.current();
    }
  }, []);

  const handleFormSubmit = async (data: RadioSettingsFormData) => {
    // Clear any previous inline validation errors
    setInlineValidationErrors({});

    // Validate all URLs before submission
    const validationErrors: { [key: string]: string } = {};

    if (data.streamUrl && !isValidUrl(data.streamUrl)) {
      validationErrors.streamUrl = 'Geçerli bir stream URL formatı girin';
    }

    if (data.backupStreamUrl && !isValidUrl(data.backupStreamUrl)) {
      validationErrors.backupStreamUrl = 'Geçerli bir yedek stream URL formatı girin';
    }

    if (data.websiteUrl && !isValidUrl(data.websiteUrl)) {
      validationErrors.websiteUrl = 'Geçerli bir website URL formatı girin';
    }

    if (data.socialUrl && !isValidUrl(data.socialUrl)) {
      validationErrors.socialUrl = 'Geçerli bir sosyal medya URL formatı girin';
    }

    if (Object.keys(validationErrors).length > 0) {
      setInlineValidationErrors(validationErrors);
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field as keyof RadioSettingsFormData, {
          type: 'manual',
          message
        });
      });
      return;
    }

    // Check if stream URL has changed and show confirmation dialog
    const originalStreamUrl = initialData?.streamUrl || '';
    const hasStreamUrlChanged = data.streamUrl !== originalStreamUrl;

    if (hasStreamUrlChanged) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
      return;
    }

    // If no stream URL change, proceed with normal submission
    await performFormSubmission(data);
  };

  // Separate function to handle the actual form submission
  const performFormSubmission = async (data: RadioSettingsFormData) => {
    try {
      await onSubmit(data);
      setTestResults(null);
      setStreamMetadata(null);
      setInlineValidationErrors({});

      // Cleanup preview on successful save
      if (previewCleanupRef.current) {
        previewCleanupRef.current();
      }

      // Dispatch event for real-time sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radioSettingsUpdated'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setTestResults({
        success: false,
        message: 'Ayarlar kaydedilirken bir hata oluştu - önceki konfigürasyon korundu',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Confirmation dialog callbacks
  const handleConfirmUrlChange = useCallback(async () => {
    if (pendingFormData) {
      setShowConfirmDialog(false);
      await performFormSubmission(pendingFormData);
      setPendingFormData(null);
    }
  }, [pendingFormData]);

  const handleCancelUrlChange = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  }, []);

  // Preview management callbacks
  const handlePreviewStart = useCallback(() => {
    // Store cleanup function for later use
    previewCleanupRef.current = () => {
      // This will be set by the AudioPreviewPlayer component
    };
  }, []);

  const handlePreviewStop = useCallback(() => {
    previewCleanupRef.current = null;
  }, []);

  // Enhanced URL validation with custom validator
  const urlValidator = {
    validate: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      return isValidUrl(value) || 'Geçerli bir URL girin (http:// veya https:// ile başlamalı)';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-dark-surface-primary rounded-lg border border-dark-border-primary">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dark-text-primary mb-2">
          Radyo Ayarları
        </h2>
        <p className="text-dark-text-secondary">
          Radyo istasyonu bilgilerini ve stream ayarlarını düzenleyin
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Station Name */}
        <Input
          label="İstasyon Adı"
          required
          {...register('stationName', {
            required: 'İstasyon adı gereklidir',
            minLength: {
              value: 2,
              message: 'İstasyon adı en az 2 karakter olmalıdır'
            },
            maxLength: {
              value: 100,
              message: 'İstasyon adı en fazla 100 karakter olabilir'
            }
          })}
          error={errors.stationName?.message}
          placeholder="Radyo istasyonu adını girin"
        />

        {/* Description */}
        <Textarea
          label="Açıklama"
          required
          {...register('description', {
            required: 'Açıklama gereklidir',
            minLength: {
              value: 10,
              message: 'Açıklama en az 10 karakter olmalıdır'
            },
            maxLength: {
              value: 500,
              message: 'Açıklama en fazla 500 karakter olabilir'
            }
          })}
          error={errors.description?.message}
          placeholder="Radyo istasyonu hakkında kısa bir açıklama girin"
          rows={4}
          className="min-h-[100px]"
        />

        {/* Stream URL */}
        <div className="w-full">
          <Input
            label="Ana Stream URL"
            required
            {...register('streamUrl', {
              required: 'Ana stream URL gereklidir',
              validate: urlValidator.validate
            })}
            error={errors.streamUrl?.message || inlineValidationErrors.streamUrl}
            placeholder="https://stream.example.com:8000/stream"
          />

          {/* Stream Test Integration */}
          <div className="mt-3 space-y-3">
            <StreamTestButton
              streamUrl={streamUrlValue}
              onTestComplete={handleTestComplete}
              onTestError={handleTestError}
              size="small"
              variant="secondary"
              disabled={!streamUrlValue || isLoading}
            />

            {testResults && (
              <StreamTestResult
                testResult={testResults}
                onRetry={handleRetry}
                className="mt-3"
              />
            )}

            {/* Stream Preview Section - only shown after successful test */}
            <StreamPreviewSection
              testResult={testResults}
              streamUrl={streamUrlValue}
              metadata={streamMetadata}
              metadataLoading={metadataLoading}
              onPreviewStart={handlePreviewStart}
              onPreviewStop={handlePreviewStop}
              className="mt-4"
            />
          </div>
        </div>

        {/* Backup Stream URL */}
        <Input
          label="Yedek Stream URL"
          {...register('backupStreamUrl', {
            validate: urlValidator.validate
          })}
          error={errors.backupStreamUrl?.message || inlineValidationErrors.backupStreamUrl}
          placeholder="https://backup.example.com:8000/stream"
        />

        {/* Website URL */}
        <Input
          label="Web Site URL"
          {...register('websiteUrl', {
            validate: urlValidator.validate
          })}
          error={errors.websiteUrl?.message || inlineValidationErrors.websiteUrl}
          placeholder="https://www.example.com"
        />

        {/* Social URL */}
        <Input
          label="Sosyal Medya URL"
          {...register('socialUrl', {
            validate: urlValidator.validate
          })}
          error={errors.socialUrl?.message || inlineValidationErrors.socialUrl}
          placeholder="https://instagram.com/example"
        />

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-dark-border-primary">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
          >
            İptal
          </Button>

          <Button
            type="submit"
            loading={isLoading}
            disabled={!isDirty || isLoading || Object.keys(inlineValidationErrors).length > 0}
          >
            Ayarları Kaydet
          </Button>
        </div>
      </form>

      {/* URL Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelUrlChange}
        onConfirm={handleConfirmUrlChange}
        title="Stream URL Değişikliği"
        message={`Stream URL'si değiştirilecek, onaylıyor musunuz?

Mevcut URL: ${initialData?.streamUrl || 'Belirlenmemiş'}
Yeni URL: ${pendingFormData?.streamUrl || ''}`}
        variant="warning"
        confirmText="Onayla"
        cancelText="İptal"
        loading={isLoading}
      />
    </div>
  );
}