'use client';

import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { FileText, Settings, Eye, Home } from 'lucide-react';
import { PollFormData } from '@/hooks/usePollForm';

interface PollFormFieldsProps {
  control: Control<PollFormData>;
  errors: any;
  disabled?: boolean;
  className?: string;
}

/**
 * PollFormFields Component
 *
 * Provides form fields for poll metadata including:
 * - Title and description inputs
 * - Poll type selector (weekly/monthly/custom)
 * - Show results dropdown with three options
 * - Homepage visibility checkbox
 */
export function PollFormFields({
  control,
  errors,
  disabled = false,
  className = ''
}: PollFormFieldsProps) {

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Temel Bilgiler
          </h3>
        </div>

        {/* Title Field */}
        <div className="space-y-2">
          <Controller
            name="title"
            control={control}
            rules={{
              required: 'Anket başlığı zorunludur',
              minLength: {
                value: 3,
                message: 'Başlık en az 3 karakter olmalıdır'
              },
              maxLength: {
                value: 500,
                message: 'Başlık en fazla 500 karakter olabilir'
              }
            }}
            render={({ field }) => (
              <Input
                {...field}
                label="Anket Başlığı *"
                placeholder="Anket başlığını girin..."
                disabled={disabled}
                error={errors.title?.message}
                maxLength={500}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
            )}
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Controller
            name="description"
            control={control}
            rules={{
              maxLength: {
                value: 2000,
                message: 'Açıklama en fazla 2000 karakter olabilir'
              }
            }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Açıklama
                </label>
                <textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Anket hakkında açıklama yazın... (opsiyonel)"
                  disabled={disabled}
                  maxLength={2000}
                  rows={4}
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    bg-dark-surface-primary border-dark-border-primary
                    text-dark-text-primary placeholder-dark-text-tertiary
                    focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    resize-vertical min-h-[100px] max-h-[200px]
                    ${errors.description ? 'border-brand-red-500' : ''}
                  `}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                />
                {errors.description && (
                  <div className="mt-1 text-sm text-brand-red-600" id="description-error" role="alert">
                    {errors.description.message}
                  </div>
                )}
                <div className="mt-1 text-xs text-dark-text-tertiary">
                  {field.value?.length || 0}/2000 karakter
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Poll Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Anket Ayarları
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Poll Type Selector */}
          <div className="space-y-2">
            <Controller
              name="poll_type"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-dark-text-primary mb-2">
                    Anket Türü
                  </label>
                  <select
                    {...field}
                    disabled={disabled}
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      bg-dark-surface-primary border-dark-border-primary
                      text-dark-text-primary
                      focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <option value="custom">Özel Anket</option>
                    <option value="weekly">Haftalık Anket</option>
                    <option value="monthly">Aylık Anket</option>
                  </select>
                </div>
              )}
            />
          </div>

          {/* Show Results Dropdown */}
          <div className="space-y-2">
            <Controller
              name="show_results"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-dark-text-primary mb-2">
                    Sonuçları Göster
                  </label>
                  <select
                    {...field}
                    disabled={disabled}
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      bg-dark-surface-primary border-dark-border-primary
                      text-dark-text-primary
                      focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <option value="never">Hiçbir Zaman</option>
                    <option value="after_voting">Oy Verdikten Sonra</option>
                    <option value="always">Her Zaman Göster</option>
                  </select>
                  <div className="mt-1 text-xs text-dark-text-tertiary">
                    {field.value === 'never' && 'Sonuçlar hiçbir zaman gösterilmez'}
                    {field.value === 'after_voting' && 'Kullanıcılar oy verdikten sonra sonuçları görebilir'}
                    {field.value === 'always' && 'Sonuçlar her zaman görünür olur'}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Visibility Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Görünürlük Ayarları
          </h3>
        </div>

        <div className="space-y-4">
          {/* Homepage Visibility Checkbox */}
          <div className="space-y-2">
            <Controller
              name="show_on_homepage"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="show_on_homepage"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={disabled}
                      className={`
                        w-4 h-4 border-2 rounded
                        border-dark-border-primary bg-dark-surface-primary
                        text-brand-red-600 focus:ring-brand-red-500 focus:ring-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="show_on_homepage" className="text-sm font-medium text-dark-text-primary cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Ana Sayfada Göster
                      </div>
                    </label>
                    <div className="text-xs text-dark-text-tertiary mt-1">
                      Bu anket ana sayfada öne çıkarılacaktır
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="space-y-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={disabled}
                      className={`
                        w-4 h-4 border-2 rounded
                        border-dark-border-primary bg-dark-surface-primary
                        text-brand-red-600 focus:ring-brand-red-500 focus:ring-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="is_active" className="text-sm font-medium text-dark-text-primary cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Anket Aktif
                      </div>
                    </label>
                    <div className="text-xs text-dark-text-tertiary mt-1">
                      Anket kullanıcılara görünür ve oy alabilir
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Form Validation Summary */}
      {(errors.title || errors.description) && (
        <div className="bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-brand-red-800 dark:text-brand-red-200 font-medium">
            <FileText className="h-4 w-4" />
            Form Hataları
          </div>
          <ul className="mt-2 text-sm text-brand-red-700 dark:text-brand-red-300 list-disc list-inside space-y-1">
            {errors.title && <li>{errors.title.message}</li>}
            {errors.description && <li>{errors.description.message}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PollFormFields;