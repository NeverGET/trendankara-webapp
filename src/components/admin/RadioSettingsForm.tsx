'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      statusCode?: number;
      responseTime?: number;
      contentType?: string;
    };
  } | null>(null);

  const [isTesting, setIsTesting] = useState(false);

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

  const handleTestStream = async () => {
    if (!streamUrlValue) {
      setTestResult({
        success: false,
        message: 'Lütfen test etmek için bir stream URL\'si girin'
      });
      return;
    }

    // Validate URL format before testing
    if (!isValidUrl(streamUrlValue)) {
      setTestResult({
        success: false,
        message: 'Geçerli bir URL formatı girin'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/settings/radio/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamUrl: streamUrlValue }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Stream URL başarıyla test edildi',
          details: data.details
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Stream URL\'sine erişilemiyor - önceki çalışan konfigürasyon korunacak',
          details: data.details
        });
      }
    } catch (error) {
      console.error('Stream test error:', error);
      setTestResult({
        success: false,
        message: 'Test sırasında bir hata oluştu - önceki çalışan konfigürasyon korunacak'
      });
    } finally {
      setIsTesting(false);
    }
  };

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

    try {
      await onSubmit(data);
      setTestResult(null);
      setInlineValidationErrors({});

      // Dispatch event for real-time sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radioSettingsUpdated'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setTestResult({
        success: false,
        message: 'Ayarlar kaydedilirken bir hata oluştu - önceki konfigürasyon korundu'
      });
    }
  };

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
        <div className="w-full">
          <label className="block text-sm font-medium text-dark-text-primary mb-2">
            Açıklama <span className="text-brand-red-600 ml-1">*</span>
          </label>
          <textarea
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
            className={cn(
              'w-full px-4 py-2 rounded-lg min-h-[100px] resize-y',
              'bg-dark-surface-secondary border border-dark-border-primary',
              'text-dark-text-primary placeholder-dark-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              errors.description && 'border-red-600 focus:ring-red-600'
            )}
            placeholder="Radyo istasyonu hakkında kısa bir açıklama girin"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

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

          {/* Test Button and Result */}
          <div className="mt-3 space-y-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleTestStream}
              loading={isTesting}
              disabled={!streamUrlValue || isTesting}
            >
              Stream URL Test Et
            </Button>

            {testResult && (
              <div className={cn(
                'p-3 rounded-lg text-sm',
                testResult.success
                  ? 'bg-green-900/20 border border-green-600/30 text-green-400'
                  : 'bg-red-900/20 border border-red-600/30 text-red-400'
              )}>
                <div className="font-medium">{testResult.message}</div>
                {testResult.details && (
                  <div className="mt-2 text-xs opacity-75 space-y-1">
                    {testResult.details.statusCode && (
                      <div>Status Code: {testResult.details.statusCode}</div>
                    )}
                    {testResult.details.responseTime && (
                      <div>Response Time: {testResult.details.responseTime}ms</div>
                    )}
                    {testResult.details.contentType && (
                      <div>Content Type: {testResult.details.contentType}</div>
                    )}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}