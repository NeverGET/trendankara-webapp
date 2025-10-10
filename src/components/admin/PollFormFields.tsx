'use client';

import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui-adapters/CheckboxAdapter';
import { Textarea } from '@/components/ui-adapters/TextareaAdapter';
import { Select } from '@/components/ui-adapters/SelectAdapter';
import { FileText, Settings, Eye, Home } from 'lucide-react';
import { PollFormData } from '@/hooks/usePollForm';

interface PollFormFieldsProps {
  control: Control<PollFormData>;
  errors: any;
  disabled?: boolean;
  className?: string;
  descriptionOnly?: boolean; // When true, only description field is editable
}

/**
 * PollFormFields Component
 *
 * Provides form fields for poll metadata including:
 * - Title and description inputs
 * - Poll type selector (weekly/monthly/custom)
 * - Show results dropdown with three options
 * - Homepage visibility checkbox
 * - Support for description-only editing (for online polls)
 */
export function PollFormFields({
  control,
  errors,
  disabled = false,
  className = '',
  descriptionOnly = false
}: PollFormFieldsProps) {

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Basic Information Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Temel Bilgiler
          </h3>
        </div>

        {/* Title Field */}
        <div>
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
                disabled={disabled || descriptionOnly} // Disable for description-only mode
                error={errors.title?.message}
                maxLength={500}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
            )}
          />
        </div>

        {/* Description Field */}
        <div>
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
                <Textarea
                  {...field}
                  value={field.value || ''}
                  label="Açıklama"
                  placeholder="Anket hakkında açıklama yazın... (opsiyonel)"
                  disabled={disabled}
                  maxLength={2000}
                  rows={4}
                  error={errors.description?.message}
                  className="min-h-[100px] max-h-[200px]"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {`${field.value?.length || 0}/2000 karakter`}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Poll Settings Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Anket Ayarları
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Poll Type Selector */}
          <div>
            <Controller
              name="poll_type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Anket Türü"
                  disabled={disabled || descriptionOnly}
                  options={[
                    { value: 'custom', label: 'Özel Anket' },
                    { value: 'weekly', label: 'Haftalık Anket' },
                    { value: 'monthly', label: 'Aylık Anket' }
                  ]}
                />
              )}
            />
          </div>

          {/* Show Results Dropdown */}
          <div>
            <Controller
              name="show_results"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    {...field}
                    label="Sonuçları Göster"
                    disabled={disabled || descriptionOnly}
                    options={[
                      { value: 'never', label: 'Hiçbir Zaman' },
                      { value: 'after_voting', label: 'Oy Verdikten Sonra' },
                      { value: 'always', label: 'Her Zaman Göster' }
                    ]}
                  />
                  <div className="mt-1 text-xs text-muted-foreground/70">
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-dark-text-secondary" />
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Görünürlük Ayarları
          </h3>
        </div>

        <div className="space-y-2">
          {/* Homepage Visibility Checkbox */}
          <div>
            <Controller
              name="show_on_homepage"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="show_on_homepage"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled || descriptionOnly}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="show_on_homepage" className="text-sm font-medium text-foreground cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Ana Sayfada Göster
                      </div>
                    </label>
                    <div className="text-xs text-muted-foreground mt-1">
                      Bu anket ana sayfada öne çıkarılacaktır
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Active Status Checkbox */}
          <div>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled || descriptionOnly}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Anket Aktif
                      </div>
                    </label>
                    <div className="text-xs text-muted-foreground mt-1">
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