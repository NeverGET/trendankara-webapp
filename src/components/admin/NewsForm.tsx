'use client';

import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImagePickerField } from '@/components/ui/ImagePicker';
import { cn } from '@/lib/utils';
import { NewsCategory, NewsArticle } from '@/types/news';

interface NewsFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: NewsCategory;
  featured_image?: string;
  featured: boolean;
  breaking: boolean;
  hot: boolean;
  active: boolean;
}

interface NewsFormProps {
  initialData?: Partial<NewsArticle>;
  onSubmit: (data: NewsFormData) => Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: 'MAGAZINE', label: 'Magazin' },
  { value: 'ARTIST', label: 'Sanatçı' },
  { value: 'ALBUM', label: 'Albüm' },
  { value: 'CONCERT', label: 'Konser' },
];

export function NewsForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create'
}: NewsFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<NewsFormData>({
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      category: initialData?.category || 'MAGAZINE',
      featured_image: typeof initialData?.thumbnail === 'string' ? initialData.thumbnail : initialData?.thumbnail?.url || '',
      featured: false,
      breaking: initialData?.isBreaking || false,
      hot: initialData?.isHot || false,
      active: true,
    }
  });

  // Watch title to auto-generate slug
  const titleValue = watch('title');

  React.useEffect(() => {
    if (titleValue && mode === 'create') {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [titleValue, setValue, mode]);


  const handleFormSubmit = async (data: NewsFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-dark-surface-primary rounded-lg border border-dark-border-primary">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dark-text-primary mb-2">
          {mode === 'create' ? 'Yeni Haber Oluştur' : 'Haberi Düzenle'}
        </h2>
        <p className="text-dark-text-secondary">
          {mode === 'create'
            ? 'Yeni bir haber makalesi oluşturun'
            : 'Mevcut haber makalesini düzenleyin'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
        {/* Title */}
        <Input
          label="Başlık"
          required
          {...register('title', {
            required: 'Başlık gereklidir',
            minLength: {
              value: 3,
              message: 'Başlık en az 3 karakter olmalıdır'
            },
            maxLength: {
              value: 200,
              message: 'Başlık en fazla 200 karakter olabilir'
            }
          })}
          error={errors.title?.message}
          placeholder="Haber başlığını girin"
        />

        {/* Slug */}
        <Input
          label="URL Slug"
          required
          {...register('slug', {
            required: 'URL slug gereklidir',
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: 'Slug sadece küçük harf, rakam ve tire içerebilir'
            }
          })}
          error={errors.slug?.message}
          placeholder="url-slug-ornegi"
        />

        {/* Summary */}
        <div className="w-full">
          <label className="block text-xs font-medium text-dark-text-primary mb-1">
            Özet <span className="text-brand-red-600 ml-1">*</span>
          </label>
          <textarea
            {...register('summary', {
              required: 'Özet gereklidir',
              minLength: {
                value: 10,
                message: 'Özet en az 10 karakter olmalıdır'
              },
              maxLength: {
                value: 500,
                message: 'Özet en fazla 500 karakter olabilir'
              }
            })}
            className={cn(
              'w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg min-h-[80px] md:min-h-[100px] resize-y text-base',
              'bg-dark-surface-secondary border border-dark-border-primary',
              'text-dark-text-primary placeholder-dark-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              errors.summary && 'border-red-600 focus:ring-red-600'
            )}
            placeholder="Haber özetini girin"
          />
          {errors.summary && (
            <p className="mt-1 text-xs text-red-600">{errors.summary.message}</p>
          )}
        </div>

        {/* Content */}
        <div className="w-full">
          <label className="block text-xs font-medium text-dark-text-primary mb-1">
            İçerik <span className="text-brand-red-600 ml-1">*</span>
          </label>
          <textarea
            {...register('content', {
              required: 'İçerik gereklidir',
              minLength: {
                value: 50,
                message: 'İçerik en az 50 karakter olmalıdır'
              }
            })}
            className={cn(
              'w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg min-h-[200px] md:min-h-[300px] resize-y text-base',
              'bg-dark-surface-secondary border border-dark-border-primary',
              'text-dark-text-primary placeholder-dark-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              errors.content && 'border-red-600 focus:ring-red-600'
            )}
            placeholder="Haber içeriğini girin"
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="w-full">
          <label className="block text-xs font-medium text-dark-text-primary mb-1">
            Kategori <span className="text-brand-red-600 ml-1">*</span>
          </label>
          <Controller
            name="category"
            control={control}
            rules={{ required: 'Kategori seçimi gereklidir' }}
            render={({ field }) => (
              <select
                {...field}
                className={cn(
                  'w-full px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg min-h-[44px] md:min-h-[40px] text-base',
                  'bg-dark-surface-secondary border border-dark-border-primary',
                  'text-dark-text-primary',
                  'focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  errors.category && 'border-red-600 focus:ring-red-600'
                )}
              >
                {NEWS_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Featured Image */}
        <ImagePickerField
          control={control}
          name="featured_image"
          label="Öne Çıkan Görsel"
          placeholder="Galeriyi açmak için tıklayın veya URL girin..."
          sizePreference="large"
          showPreview={true}
          enableSearch={true}
          validate={(value) => {
            if (value && typeof value === 'string' && value.length > 0) {
              const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
              if (!urlPattern.test(value)) {
                return 'Geçerli bir resim URL\'i girin';
              }
            }
            return undefined;
          }}
        />

        {/* Status Flags */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Featured */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('featured')}
              className="w-4 h-4 text-brand-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-brand-red-600 focus:ring-2"
            />
            <span className="text-sm text-dark-text-primary">Öne Çıkan</span>
          </label>

          {/* Breaking */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('breaking')}
              className="w-4 h-4 text-brand-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-brand-red-600 focus:ring-2"
            />
            <span className="text-sm text-dark-text-primary">Son Dakika</span>
          </label>

          {/* Hot */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('hot')}
              className="w-4 h-4 text-brand-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-brand-red-600 focus:ring-2"
            />
            <span className="text-sm text-dark-text-primary">Popüler</span>
          </label>

          {/* Active */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('active')}
              className="w-4 h-4 text-brand-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-brand-red-600 focus:ring-2"
            />
            <span className="text-sm text-dark-text-primary">Aktif</span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-dark-border-primary">
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
            disabled={!isDirty && mode === 'edit'}
          >
            {mode === 'create' ? 'Haberi Oluştur' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}