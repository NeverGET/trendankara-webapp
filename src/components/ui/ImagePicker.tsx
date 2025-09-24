'use client';

import React, { Suspense } from 'react';
import { MediaItem } from '@/components/admin/MediaPickerDialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ImageIcon, X, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImagePicker } from '@/hooks/useImagePicker';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

// Lazy load MediaPickerDialog for better performance
const MediaPickerDialog = React.lazy(() =>
  import('@/components/admin/MediaPickerDialog').then(module => ({
    default: module.MediaPickerDialog
  }))
);

/**
 * Props for the ImagePicker component
 * Provides a streamlined interface for selecting images from the media library
 */
export interface ImagePickerProps {
  /** Current value (image URL or array of URLs) */
  value?: string | string[];
  /** Callback when image URL changes */
  onChange: (url: string | string[]) => void;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Input field name for form integration */
  name?: string;
  /** Label text to display above the picker */
  label?: string;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Validation pattern for URLs */
  pattern?: RegExp;
  /** Custom validation function */
  validate?: (value: string | string[]) => string | undefined;
  /** Enable multiple image selection */
  multiple?: boolean;
  /** Maximum number of images that can be selected (when multiple is true) */
  maxSelection?: number;
  /** Preferred image size to use from thumbnails */
  sizePreference?: 'thumbnail' | 'medium' | 'large' | 'original';
  /** Whether to show image preview */
  showPreview?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Enable search functionality in picker */
  enableSearch?: boolean;
  /** Default search query */
  defaultSearchQuery?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the ImagePickerInput sub-component
 */
interface ImagePickerInputProps {
  /** Current value (image URL or array of URLs) */
  value: string | string[];
  /** Function to open the picker dialog */
  onOpenPicker: () => void;
  /** Function to clear the selection */
  onClear: () => void;
  /** Function to handle manual input changes */
  onInputChange: (value: string | string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Enable multiple selection */
  multiple?: boolean;
  /** Preview state for the image */
  preview?: {
    url: string | string[] | null;
    loading: boolean;
    error: boolean;
    errorMessage?: string;
    width?: number;
    height?: number;
    items?: MediaItem[];
  };
  /** Ref to pass to the input */
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * ImagePickerInput Sub-component
 *
 * Displays the input field with:
 * - Editable image URL text input (supports manual entry)
 * - Button to open media picker
 * - Clear button when value exists
 * - Preview thumbnail (when implemented)
 */
const ImagePickerInput: React.FC<ImagePickerInputProps> = ({
  value,
  onOpenPicker,
  onClear,
  onInputChange,
  placeholder,
  error,
  disabled,
  multiple = false,
  preview,
  inputRef
}) => {
  const localInputRef = React.useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || localInputRef;

  // Handle display value for input field
  const displayValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) return value[0];
      return `${value.length} resim seçildi`;
    }
    return typeof value === 'string' ? value : '';
  }, [value, multiple]);

  // Handle input change for single mode only
  const handleInputChange = (newValue: string) => {
    if (!multiple) {
      onInputChange(newValue);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenPicker();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Input field for URL display and manual entry */}
        <div className="flex-1">
          <Input
            ref={actualInputRef}
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            error={error}
            disabled={disabled || multiple}
            readOnly={multiple}
            className="pr-10"
            aria-label={multiple ? 'Seçilen resim sayısı' : 'Resim URL adresi'}
            aria-describedby={error ? 'image-picker-error' : undefined}
            aria-expanded={false}
            aria-haspopup="dialog"
            role="combobox"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Clear button - shown when there's a value */}
          {value && !disabled && (
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={onClear}
              disabled={disabled}
              className="min-w-[44px]"
              aria-label={multiple ? 'Tüm seçimleri temizle' : 'Seçimi temizle'}
              title={multiple ? 'Tüm seçimleri temizle' : 'Seçimi temizle'}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Open picker button */}
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onOpenPicker}
            disabled={disabled}
            className="min-w-[44px] md:min-w-auto"
            aria-label={multiple ? 'Çoklu resim seçimi için galeriyi aç' : 'Resim seçimi için galeriyi aç'}
            title={multiple ? 'Çoklu resim seçimi için galeriyi aç' : 'Resim seçimi için galeriyi aç'}
            aria-haspopup="dialog"
            aria-expanded={false}
          >
            <ImageIcon className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Resim Seç</span>
          </Button>
        </div>
      </div>

      {/* Image Preview */}
      {preview && (preview.url || preview.loading || preview.error) && (
        <div className="mt-2 relative">
          {multiple && Array.isArray(preview.url) ? (
            /* Multiple Images Grid */
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {preview.url.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 border border-dark-border-secondary rounded-lg overflow-hidden bg-dark-surface-secondary flex items-center justify-center group cursor-pointer"
                    onClick={onOpenPicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenPicker();
                      }
                    }}
                    aria-label={`Seçili resim ${index + 1}, değiştirmek için tıklayın`}
                  >
                    <img
                      src={url}
                      alt={`Seçili resim ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Hover tooltip for individual images */}
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 pointer-events-none" role="tooltip">
                      <div className="bg-dark-surface-primary border border-dark-border-primary rounded-lg p-2 shadow-lg">
                        <img
                          src={url}
                          alt={`Büyük önizleme ${index + 1}`}
                          className="w-48 h-32 object-cover rounded"
                        />
                        <div className="text-xs text-dark-text-tertiary text-center mt-1">
                          Değiştirmek için tıklayın
                        </div>
                      </div>
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-dark-border-primary"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show "+X more" indicator if more than 4 images */}
              {preview.url.length > 4 && (
                <div className="text-xs text-dark-text-secondary">
                  +{preview.url.length - 4} daha fazla
                </div>
              )}
            </div>
          ) : (
            /* Single Image Preview */
            <div className="w-16 h-16 border border-dark-border-secondary rounded-lg overflow-hidden bg-dark-surface-secondary flex items-center justify-center group">
              {preview.loading && (
                <div role="status" aria-label="Resim yükleniyor">
                  <LoadingSpinner
                    size="sm"
                    hideText={true}
                    className="p-2"
                  />
                </div>
              )}

              {preview.error && !preview.loading && (
                <div className="flex flex-col items-center justify-center text-dark-text-tertiary" role="alert" aria-label="Resim yükleme hatası">
                  <ImageOff className="w-6 h-6" />
                  <span className="text-xs mt-1 text-center">
                    {preview.errorMessage || 'Hata'}
                  </span>
                </div>
              )}

              {preview.url && !preview.loading && !preview.error && (
                <>
                  <img
                    src={typeof preview.url === 'string' ? preview.url : ''}
                    alt="Seçili resim önizlemesi"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={onOpenPicker}
                    onError={() => {
                      // Error handling is managed by the useImagePicker hook
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenPicker();
                      }
                    }}
                    aria-label="Seçili resim, değiştirmek için tıklayın"
                  />

                  {/* Hover Tooltip with larger preview */}
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 pointer-events-none" role="tooltip">
                    <div className="bg-dark-surface-primary border border-dark-border-primary rounded-lg p-2 shadow-lg">
                      <img
                        src={typeof preview.url === 'string' ? preview.url : ''}
                        alt="Büyük resim önizlemesi"
                        className="w-48 h-32 object-cover rounded"
                      />
                      {preview.width && preview.height && (
                        <div className="text-xs text-dark-text-secondary mt-1 text-center">
                          {preview.width} × {preview.height} px
                        </div>
                      )}
                      <div className="text-xs text-dark-text-tertiary text-center mt-1">
                        Değiştirmek için tıklayın
                      </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-dark-border-primary"></div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ImagePicker Component
 *
 * A high-level wrapper around MediaPickerDialog that provides:
 * - Simplified image selection interface
 * - Automatic URL population in input field
 * - Manual URL entry support
 * - Visual preview of selected images
 * - Form library integration support
 * - Touch-optimized mobile experience
 */
export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  onBlur,
  name,
  label,
  placeholder = 'Resim seçmek için tıklayın...',
  required = false,
  error,
  pattern,
  validate,
  multiple = false,
  maxSelection,
  sizePreference = 'medium',
  showPreview = true,
  disabled = false,
  enableSearch = true,
  defaultSearchQuery,
  className
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Use the custom hook for state management
  const {
    isPickerOpen,
    openPicker,
    closePicker,
    handleSelect,
    preview,
    clearSelection,
    retryPreview
  } = useImagePicker({
    value,
    onChange,
    multiple,
    sizePreference,
    validateOnSelect: false
  });

  // Perform validation on the current value
  const validationError = React.useMemo(() => {
    if (!value) {
      // Check required validation
      if (required) {
        return 'Bu alan zorunludur';
      }
      return undefined;
    }

    // Custom validation function
    if (validate) {
      const customError = validate(value);
      if (customError) {
        return customError;
      }
    }

    // Pattern validation for URLs
    if (pattern) {
      const urlsToValidate = Array.isArray(value) ? value : [value];
      const invalidUrls = urlsToValidate.filter(url => !pattern.test(url));
      if (invalidUrls.length > 0) {
        return `Geçersiz URL formatı: ${invalidUrls.join(', ')}`;
      }
    }

    return undefined;
  }, [value, required, validate, pattern]);

  // Combine prop error, validation error, and preview error
  const combinedError = error || validationError || (preview?.error ? preview.errorMessage : undefined);

  // Store the last focused element before opening dialog
  const lastFocusedElement = React.useRef<HTMLElement | null>(null);

  // Handle opening picker with focus management
  const handlePickerOpen = React.useCallback(() => {
    // Store current focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;
    openPicker();
  }, [openPicker]);

  // Handle Escape key to close dialog and maintain focus
  const handlePickerClose = React.useCallback(() => {
    closePicker();
    // Return focus to the last focused element or input
    setTimeout(() => {
      const elementToFocus = lastFocusedElement.current || inputRef.current;
      elementToFocus?.focus();
      lastFocusedElement.current = null;
    }, 100);
  }, [closePicker]);

  // Handle escape key globally when dialog is open
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPickerOpen) {
        e.preventDefault();
        handlePickerClose();
      }
    };

    if (isPickerOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isPickerOpen, handlePickerClose]);

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-dark-text-primary mb-2">
          {label}
          {required && <span className="text-brand-red-600 ml-1">*</span>}
        </label>
      )}

      {/* Image Picker Input */}
      <ImagePickerInput
        value={value || (multiple ? [] : '')}
        onOpenPicker={handlePickerOpen}
        onClear={clearSelection}
        onInputChange={onChange}
        placeholder={placeholder}
        error={combinedError}
        disabled={disabled}
        multiple={multiple}
        preview={showPreview ? preview : undefined}
        inputRef={inputRef}
      />

      {/* Error message display */}
      {combinedError && (
        <div className="mt-1 flex items-center gap-2" id="image-picker-error" role="alert">
          <div className="text-sm text-brand-red-600 flex-1">
            {combinedError}
          </div>
          {preview?.error && preview.errorMessage && (
            <button
              type="button"
              onClick={retryPreview}
              className="text-xs text-dark-text-secondary hover:text-dark-text-primary underline"
              aria-label="Resim yüklemeyi tekrar dene"
            >
              Tekrar dene
            </button>
          )}
        </div>
      )}

      {/* MediaPickerDialog - Connected to state and handlers with lazy loading */}
      {isPickerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-dark-surface-primary rounded-lg p-6 border border-dark-border-primary">
                <LoadingSpinner size="default" text="Galeri yükleniyor..." />
              </div>
            </div>
          }
        >
          <MediaPickerDialog
            isOpen={isPickerOpen}
            onClose={handlePickerClose}
            onSelect={handleSelect}
            multiple={multiple}
            maxSelection={maxSelection}
            hideUpload={true}
          />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Props for react-hook-form integration
 */
export interface ImagePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ImagePickerProps, 'value' | 'onChange'> {
  /** Form control from react-hook-form */
  control: Control<TFieldValues>;
  /** Field name in the form */
  name: TName;
  /** Default value for the field */
  defaultValue?: string | string[];
  /** Validation rules */
  rules?: {
    required?: boolean | string;
    validate?: (value: any) => boolean | string;
    pattern?: {
      value: RegExp;
      message: string;
    };
  };
  /** Validation pattern for URLs (passed to ImagePicker) */
  pattern?: RegExp;
  /** Custom validation function (passed to ImagePicker) */
  validate?: (value: string | string[]) => string | undefined;
}

/**
 * ImagePickerField Component for react-hook-form integration
 *
 * Automatically handles form registration and validation
 * Provides seamless integration with react-hook-form
 */
export function ImagePickerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  defaultValue = '',
  rules,
  multiple = false,
  pattern,
  validate,
  ...imagePickerProps
}: ImagePickerFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue as any}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <ImagePicker
          {...imagePickerProps}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          multiple={multiple}
          pattern={pattern}
          validate={validate}
          error={error?.message}
        />
      )}
    />
  );
}


// Export types for external use
export type { MediaItem };