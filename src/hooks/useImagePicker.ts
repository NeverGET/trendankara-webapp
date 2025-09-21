'use client';

import { useState, useCallback, useEffect } from 'react';
import { MediaItem } from '@/components/admin/MediaPickerDialog';

// Global cache for preview images
const previewCache = new Map<string, {
  url: string;
  width: number;
  height: number;
  error: boolean;
  timestamp: number;
}>();

// Cache expiry time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

/**
 * Options for the useImagePicker hook
 */
export interface UseImagePickerOptions {
  /** Current value (image URL or array of URLs) */
  value?: string | string[];
  /** Callback when image URL changes */
  onChange: (url: string | string[]) => void;
  /** Enable multiple selection */
  multiple?: boolean;
  /** Preferred image size */
  sizePreference?: 'thumbnail' | 'medium' | 'large' | 'original';
  /** Whether to validate URL on select */
  validateOnSelect?: boolean;
}

/**
 * State for image preview
 */
export interface PreviewState {
  /** Preview image URL (for single) or array of URLs (for multiple) */
  url: string | string[] | null;
  /** Whether preview is loading */
  loading: boolean;
  /** Whether preview failed to load */
  error: boolean;
  /** Error message for display */
  errorMessage?: string;
  /** Image width in pixels (for single image) */
  width?: number;
  /** Image height in pixels (for single image) */
  height?: number;
  /** Array of selected items for multiple mode */
  items?: MediaItem[];
}

/**
 * Return value from useImagePicker hook
 */
export interface UseImagePickerReturn {
  /** Whether the media picker dialog is open */
  isPickerOpen: boolean;
  /** Function to open the picker dialog */
  openPicker: () => void;
  /** Function to close the picker dialog */
  closePicker: () => void;
  /** Handler for when media is selected */
  handleSelect: (media: MediaItem | MediaItem[]) => void;
  /** Current preview state */
  preview: PreviewState;
  /** Function to clear current selection */
  clearSelection: () => void;
  /** Function to retry loading preview */
  retryPreview: () => void;
  /** Selected items (for multiple mode) */
  selectedItems?: MediaItem[];
}

/**
 * Helper function to get the appropriate image URL based on size preference
 *
 * @param media - MediaItem containing image URLs and thumbnails
 * @param sizePreference - Preferred image size
 * @returns Appropriate URL with fallback to original
 */
function getImageUrl(media: MediaItem, sizePreference: 'thumbnail' | 'medium' | 'large' | 'original'): string {
  switch (sizePreference) {
    case 'thumbnail':
      return media.thumbnails?.small || media.url;
    case 'medium':
      return media.thumbnails?.medium || media.url;
    case 'large':
      return media.thumbnails?.large || media.url;
    case 'original':
    default:
      return media.url;
  }
}

/**
 * Helper function to clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of previewCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      previewCache.delete(key);
    }
  }
}

/**
 * Helper function to load and validate an image URL with caching
 *
 * @param url - Image URL to validate
 * @param setPreview - Function to update preview state
 */
function loadPreview(url: string, setPreview: (state: PreviewState) => void): void {
  // First validate URL format
  const validation = validateImageUrl(url);
  if (!validation.isValid) {
    setPreview({
      url,
      loading: false,
      error: true,
      errorMessage: validation.errorMessage
    });
    return;
  }

  // Clean expired cache entries
  cleanExpiredCache();

  // Check cache first
  const cached = previewCache.get(url);
  if (cached) {
    // Use cached data
    if (cached.error) {
      setPreview({
        url,
        loading: false,
        error: true,
        errorMessage: 'Bağlantı hatası - Resim yüklenemedi'
      });
    } else {
      setPreview({
        url,
        loading: false,
        error: false,
        width: cached.width,
        height: cached.height
      });
    }
    return;
  }

  // Set loading state
  setPreview({
    url,
    loading: true,
    error: false
  });

  // Create new image to validate URL
  const img = new Image();

  img.onload = () => {
    // Cache successful load
    previewCache.set(url, {
      url,
      width: img.width,
      height: img.height,
      error: false,
      timestamp: Date.now()
    });

    // Successfully loaded - set dimensions and clear loading state
    setPreview({
      url,
      loading: false,
      error: false,
      width: img.width,
      height: img.height
    });
  };

  img.onerror = () => {
    // Cache error state
    previewCache.set(url, {
      url,
      width: 0,
      height: 0,
      error: true,
      timestamp: Date.now()
    });

    // Failed to load - set error state with Turkish error message
    setPreview({
      url,
      loading: false,
      error: true,
      errorMessage: 'Bağlantı hatası - Resim yüklenemedi'
    });
  };

  // Start loading the image
  img.src = url;
}

/**
 * Helper function to validate image URL format
 *
 * @param url - URL to validate
 * @returns Whether the URL is a valid image URL
 */
function validateImageUrl(url: string): { isValid: boolean; errorMessage?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, errorMessage: 'Geçersiz URL' };
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { isValid: false, errorMessage: 'URL boş olamaz' };
  }

  // Check if it's a valid URL format
  try {
    const urlObject = new URL(trimmedUrl);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return { isValid: false, errorMessage: 'Geçersiz protokol - HTTP veya HTTPS kullanın' };
    }
  } catch {
    return { isValid: false, errorMessage: 'Geçersiz URL formatı' };
  }

  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.avif'];
  const lowerUrl = trimmedUrl.toLowerCase();
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

  // Also check for common image hosting patterns
  const imageHostingPatterns = [
    /\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff|avif)(\?|$)/i,
    /\/media\//i,
    /\/images?\//i,
    /\/uploads?\//i,
    /cdn\./i,
    /cloudinary/i,
    /imgur/i
  ];

  const matchesHostingPattern = imageHostingPatterns.some(pattern => pattern.test(trimmedUrl));

  if (!hasImageExtension && !matchesHostingPattern) {
    return { isValid: false, errorMessage: 'Geçersiz resim URL\'i - Desteklenen formatlar: JPG, PNG, GIF, SVG, WebP' };
  }

  return { isValid: true };
}

/**
 * Helper function to load previews for multiple URLs
 *
 * @param urls - Array of image URLs to validate
 * @param setPreview - Function to update preview state
 */
function loadMultiplePreviews(urls: string[], setPreview: (state: PreviewState) => void): void {
  if (urls.length === 0) {
    setPreview({
      url: null,
      loading: false,
      error: false
    });
    return;
  }

  // Validate all URLs first
  const invalidUrls = urls.filter(url => !validateImageUrl(url).isValid);
  if (invalidUrls.length > 0) {
    setPreview({
      url: urls,
      loading: false,
      error: true,
      errorMessage: `${invalidUrls.length} geçersiz URL tespit edildi`
    });
    return;
  }

  setPreview({
    url: urls,
    loading: true,
    error: false
  });

  // For multiple images, we just set the URLs without extensive validation
  // The component will handle individual image load errors
  setTimeout(() => {
    setPreview({
      url: urls,
      loading: false,
      error: false
    });
  }, 100);
}

/**
 * Custom hook for managing image picker state
 *
 * Handles:
 * - Dialog open/close state
 * - Image selection and URL extraction
 * - Preview loading and error states
 * - Form value updates
 */
export function useImagePicker({
  value,
  onChange,
  multiple = false,
  sizePreference = 'medium',
  validateOnSelect = false
}: UseImagePickerOptions): UseImagePickerReturn {
  // State for picker dialog
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // State for selected items (for multiple mode)
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);

  // State for image preview
  const [preview, setPreview] = useState<PreviewState>({
    url: value || null,
    loading: false,
    error: false
  });

  // Effect to load preview when value changes
  useEffect(() => {
    if (multiple && Array.isArray(value)) {
      // Handle multiple URLs
      if (value.length > 0) {
        loadMultiplePreviews(value, setPreview);
      } else {
        setPreview({
          url: null,
          loading: false,
          error: false
        });
      }
    } else if (!multiple && typeof value === 'string') {
      // Handle single URL
      if (value && value.trim()) {
        loadPreview(value, setPreview);
      } else {
        setPreview({
          url: null,
          loading: false,
          error: false
        });
      }
    } else {
      // Clear preview when value is empty or wrong type
      setPreview({
        url: null,
        loading: false,
        error: false
      });
    }
  }, [value, multiple]);

  // Open picker dialog
  const openPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  // Close picker dialog
  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  // Handle media selection
  const handleSelect = useCallback((media: MediaItem | MediaItem[]) => {
    try {
      // Clear any existing errors when making a new selection
      setPreview(prev => ({
        ...prev,
        error: false,
        errorMessage: undefined
      }));

      if (multiple) {
        // Handle multiple selection
        const mediaArray = Array.isArray(media) ? media : [media];

        if (mediaArray.length === 0) {
          closePicker();
          return;
        }

        // Store selected items for multiple mode
        setSelectedItems(mediaArray);

        // Extract URLs based on size preference
        const selectedUrls = mediaArray.map(item => getImageUrl(item, sizePreference));

        // Update form value via onChange callback
        onChange(selectedUrls);
      } else {
        // Handle single selection
        const selectedItem = Array.isArray(media) ? media[0] : media;

        if (!selectedItem) {
          closePicker();
          return;
        }

        // Get URL based on size preference using helper function
        const selectedUrl = getImageUrl(selectedItem, sizePreference);

        // Update form value via onChange callback
        onChange(selectedUrl);
      }

      // Close the dialog after selection
      closePicker();
    } catch (error) {
      console.error('Resim seçimi sırasında hata:', error);

      // Set error state in preview with Turkish error message
      setPreview(prev => ({
        ...prev,
        error: true,
        loading: false,
        errorMessage: 'Bağlantı hatası - Lütfen tekrar deneyin'
      }));

      // For network errors, show Turkish error message
      // Note: Error display will be handled by the component
      // You could also call an error callback here if needed
    }
  }, [multiple, closePicker, onChange, sizePreference]);

  // Clear current selection
  const clearSelection = useCallback(() => {
    if (multiple) {
      onChange([]);
      setSelectedItems([]);
    } else {
      onChange('');
    }
    setPreview({
      url: null,
      loading: false,
      error: false
    });
  }, [multiple, onChange]);

  // Retry loading preview
  const retryPreview = useCallback(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length > 0) {
        loadMultiplePreviews(value, setPreview);
      }
    } else if (!multiple && typeof value === 'string' && value.trim()) {
      loadPreview(value, setPreview);
    }
  }, [value, multiple]);

  return {
    isPickerOpen,
    openPicker,
    closePicker,
    handleSelect,
    preview,
    clearSelection,
    retryPreview,
    selectedItems: multiple ? selectedItems : undefined
  };
}