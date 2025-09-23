'use client';

import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui-adapters/CheckboxAdapter';
import { Textarea } from '@/components/ui-adapters/TextareaAdapter';
import { Select } from '@/components/ui-adapters/SelectAdapter';
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
    <div className="max-w-4xl mx-auto p-6 bg-background rounded-lg border border-border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {mode === 'create' ? 'Yeni Haber Oluştur' : 'Haberi Düzenle'}
        </h2>
        <p className="text-muted-foreground">
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
        <Textarea
          label="Özet"
          required
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
          error={errors.summary?.message}
          placeholder="Haber özetini girin"
          rows={4}
          className="min-h-[80px] md:min-h-[100px]"
        />

        {/* Content */}
        <Textarea
          label="İçerik"
          required
          {...register('content', {
            required: 'İçerik gereklidir',
            minLength: {
              value: 50,
              message: 'İçerik en az 50 karakter olmalıdır'
            }
          })}
          error={errors.content?.message}
          placeholder="Haber içeriğini girin"
          rows={8}
          className="min-h-[200px] md:min-h-[300px]"
        />

        {/* Category */}
        <Controller
          name="category"
          control={control}
          rules={{ required: 'Kategori seçimi gereklidir' }}
          render={({ field }) => (
            <Select
              {...field}
              label="Kategori"
              required
              error={errors.category?.message}
              options={NEWS_CATEGORIES.map(cat => ({
                value: cat.value,
                label: cat.label
              }))}
            />
          )}
        />

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
          <Controller
            name="featured"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label htmlFor="featured" className="text-sm text-foreground cursor-pointer">
                  Öne Çıkan
                </label>
              </div>
            )}
          />

          {/* Breaking */}
          <Controller
            name="breaking"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breaking"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label htmlFor="breaking" className="text-sm text-foreground cursor-pointer">
                  Son Dakika
                </label>
              </div>
            )}
          />

          {/* Hot */}
          <Controller
            name="hot"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hot"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label htmlFor="hot" className="text-sm text-foreground cursor-pointer">
                  Popüler
                </label>
              </div>
            )}
          />

          {/* Active */}
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label htmlFor="active" className="text-sm text-foreground cursor-pointer">
                  Aktif
                </label>
              </div>
            )}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-border">
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