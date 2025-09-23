'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { StreamTestIndicator } from '@/components/admin/StreamTestIndicator';
import { cn } from '@/lib/utils';
import { StreamUrlValidator } from '@/lib/utils/streamUrlValidator';
import { testStreamWithMetadata } from '@/lib/utils/streamMetadata';
import type {
  StreamConfigurationData,
  URLValidationResult,
  StreamTestResult,
  StreamMetadata
} from '@/types/radioSettings';

interface StreamUrlConfigFormData {
  streamUrl: string;
}

interface StreamUrlConfigFormProps {
  /** Initial stream configuration data */
  initialData?: Pick<StreamConfigurationData, 'stream_url'>;
  /** Callback fired when form is submitted successfully */
  onSubmit: (streamUrl: string) => Promise<void>;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StreamUrlConfigForm - Complete admin interface for stream URL configuration
 *
 * Features:
 * - Real-time URL validation using StreamUrlValidator
 * - Stream connectivity testing with testStreamConnection
 * - StreamTestIndicator integration for displaying results
 * - Save functionality with proper error handling
 * - Turkish language interface with dark theme styling
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function StreamUrlConfigForm({
  initialData,
  onSubmit,
  isLoading = false,
  className
}: StreamUrlConfigFormProps) {
  // Form state
  const [validationResult, setValidationResult] = useState<URLValidationResult | null>(null);
  const [testResult, setTestResult] = useState<StreamTestResult | null>(null);
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    setValue,
    setError,
    clearErrors
  } = useForm<StreamUrlConfigFormData>({
    defaultValues: {
      streamUrl: initialData?.stream_url || ''
    }
  });

  const streamUrlValue = watch('streamUrl');
  const validator = new StreamUrlValidator();

  // Real-time URL validation (Requirement 1.2)
  useEffect(() => {
    if (!streamUrlValue || streamUrlValue.trim() === '') {
      setValidationResult(null);
      setTestResult(null);
      setMetadata(null);
      clearErrors('streamUrl');
      return;
    }

    const result = validator.validateUrl(streamUrlValue.trim());
    setValidationResult(result);

    // Clear any previous test results when URL changes
    setTestResult(null);
    setMetadata(null);

    if (!result.isValid) {
      setError('streamUrl', {
        type: 'validation',
        message: result.message
      });
    } else {
      clearErrors('streamUrl');
    }
  }, [streamUrlValue, validator, setError, clearErrors]);

  // Test stream connectivity (Requirement 1.3)
  const handleTestStream = useCallback(async () => {
    if (!streamUrlValue || !validationResult?.isValid) {
      return;
    }

    setIsTestingStream(true);
    setTestResult(null);
    setMetadata(null);
    setSaveError(null);

    try {
      const result = await testStreamWithMetadata(streamUrlValue.trim(), 15000);
      setTestResult(result.testResult);

      if (result.metadata) {
        setMetadata(result.metadata);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stream testi sırasında bilinmeyen bir hata oluştu';
      setTestResult({
        success: false,
        message: `Stream test hatası: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        details: {
          errorCode: 'TEST_ERROR',
          errorMessage: errorMessage
        }
      });
    } finally {
      setIsTestingStream(false);
    }
  }, [streamUrlValue, validationResult]);

  // Save functionality with validation (Requirement 1.3, 1.4)
  const handleFormSubmit = async (data: StreamUrlConfigFormData) => {
    setSaveError(null);
    setSaveSuccess(false);

    const trimmedUrl = data.streamUrl.trim();

    // Final validation before save (Requirement 1.4)
    if (!trimmedUrl) {
      setError('streamUrl', {
        type: 'required',
        message: 'Stream URL gereklidir'
      });
      return;
    }

    const finalValidation = validator.validateUrl(trimmedUrl);
    if (!finalValidation.isValid) {
      setError('streamUrl', {
        type: 'validation',
        message: finalValidation.message
      });
      setSaveError(`URL format hatası: ${finalValidation.message}`);
      return;
    }

    // Attempt connection test before saving (Requirement 1.3)
    try {
      const testResult = await testStreamWithMetadata(trimmedUrl, 10000);

      if (!testResult.testResult.success) {
        setSaveError('Stream bağlantısı başarısız. Lütfen URL\'yi kontrol edin ve tekrar deneyin.');
        setTestResult(testResult.testResult);
        return;
      }

      // If test passes, proceed with save
      await onSubmit(trimmedUrl);
      setSaveSuccess(true);
      setTestResult(testResult.testResult);

      if (testResult.metadata) {
        setMetadata(testResult.metadata);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kaydetme işlemi sırasında bilinmeyen bir hata oluştu';
      setSaveError(`Kaydetme hatası: ${errorMessage}`);
    }
  };

  // Auto-correct URL format if validator suggests improvements
  useEffect(() => {
    if (validationResult?.suggestions && validationResult.suggestions.length > 0) {
      const suggestionWithUrl = validationResult.suggestions.find(s => s.startsWith('Suggested URL:'));
      if (suggestionWithUrl) {
        const suggestedUrl = suggestionWithUrl.replace('Suggested URL: ', '');
        if (suggestedUrl !== streamUrlValue) {
          // Show the suggestion but don't auto-apply it
          // User can manually accept the suggestion
        }
      }
    }
  }, [validationResult, streamUrlValue]);

  return (
    <Card
      title="Stream URL Konfigürasyonu"
      subtitle="Radyo stream URL'sini yapılandırın ve test edin"
      className={cn('w-full max-w-4xl', className)}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Success Alert */}
        {saveSuccess && (
          <Alert
            variant="success"
            title="Başarılı!"
            className="border-green-500/30 bg-gradient-to-br from-green-900/10 to-dark-surface-secondary/50"
          >
            Stream URL başarıyla kaydedildi ve doğrulandı.
          </Alert>
        )}

        {/* Error Alert */}
        {saveError && (
          <Alert
            variant="error"
            title="Hata"
            dismissible
            onDismiss={() => setSaveError(null)}
            className="border-red-500/30 bg-gradient-to-br from-red-900/10 to-dark-surface-secondary/50"
          >
            {saveError}
          </Alert>
        )}

        {/* Stream URL Input Field (Requirement 1.1) */}
        <div className="space-y-4">
          <Input
            label="Stream URL"
            required
            {...register('streamUrl', {
              required: 'Stream URL gereklidir',
              minLength: {
                value: 10,
                message: 'Stream URL en az 10 karakter olmalıdır'
              }
            })}
            error={errors.streamUrl?.message}
            placeholder="https://stream.example.com:8000/"
            className="font-mono"
          />

          {/* Real-time validation feedback (Requirement 1.2) */}
          {validationResult && streamUrlValue && (
            <div className="space-y-2">
              {validationResult.isValid ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-4 h-4 rounded-full bg-green-400/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <span>URL formatı geçerli</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <div className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  </div>
                  <span>{validationResult.message}</span>
                </div>
              )}

              {/* URL suggestions */}
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-xs font-semibold text-blue-300 mb-2">Öneriler:</p>
                  <ul className="space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-blue-200">
                        {suggestion.startsWith('Suggested URL:') ? (
                          <div className="flex items-center gap-2">
                            <span>{suggestion}</span>
                            <Button
                              type="button"
                              size="small"
                              variant="ghost"
                              onClick={() => {
                                const suggestedUrl = suggestion.replace('Suggested URL: ', '');
                                setValue('streamUrl', suggestedUrl);
                              }}
                              className="text-xs"
                            >
                              Uygula
                            </Button>
                          </div>
                        ) : (
                          suggestion
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Stream Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestStream}
            disabled={!validationResult?.isValid || isTestingStream || isLoading}
            loading={isTestingStream}
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300"
          >
            {isTestingStream ? 'Stream Test Ediliyor...' : 'Stream\'i Test Et'}
          </Button>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={!isDirty || !validationResult?.isValid || isLoading}
            loading={isLoading}
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white"
          >
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>

        {/* Stream Test Results (Integration with StreamTestIndicator) */}
        <StreamTestIndicator
          testResult={testResult}
          metadata={metadata}
          isLoading={isTestingStream}
          loadingMessage="Stream bağlantısı test ediliyor..."
        />

        {/* Additional Information */}
        <div className="p-4 bg-dark-surface-secondary/50 rounded-lg border border-dark-border-primary/30">
          <h4 className="text-sm font-semibold text-dark-text-primary mb-2">
            Stream URL Gereksinimleri:
          </h4>
          <ul className="text-xs text-dark-text-secondary space-y-1 list-disc list-inside">
            <li>HTTP veya HTTPS protokolü kullanmalıdır</li>
            <li>Geçerli bir domain adı içermelidir</li>
            <li>Audio stream formatını desteklemelidir (MP3, AAC, OGG, FLAC)</li>
            <li>Shoutcast veya Icecast sunucu tiplerini destekler</li>
            <li>Güvenlik için HTTPS protokolü önerilir</li>
          </ul>
        </div>
      </form>
    </Card>
  );
}