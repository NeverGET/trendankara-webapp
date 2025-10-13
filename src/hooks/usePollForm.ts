'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

// Poll item interface for form
export interface PollItem {
  id?: number;
  title: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  tempId?: string;
}

// Poll form data interface
export interface PollFormData {
  title: string;
  description?: string;
  poll_type: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  is_active: boolean;
  show_on_homepage: boolean;
  show_results: 'never' | 'after_voting' | 'always';
  items: PollItem[];
}

// Validation rules
const validationRules = {
  title: {
    required: 'Anket başlığı zorunludur',
    minLength: {
      value: 3,
      message: 'Başlık en az 3 karakter olmalıdır'
    },
    maxLength: {
      value: 500,
      message: 'Başlık en fazla 500 karakter olabilir'
    }
  },
  description: {
    maxLength: {
      value: 2000,
      message: 'Açıklama en fazla 2000 karakter olabilir'
    }
  },
  start_date: {
    required: 'Başlangıç tarihi zorunludur',
    validate: (value: string) => {
      const startDate = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to start of day for comparison

      if (startDate < now) {
        return 'Başlangıç tarihi geçmişte olamaz';
      }
      return true;
    }
  },
  end_date: {
    required: 'Bitiş tarihi zorunludur'
  },
  items: {
    required: 'En az 2 seçenek gereklidir',
    validate: (items: PollItem[]) => {
      const activeItems = items.filter(item => item.is_active && item.title.trim());

      if (activeItems.length < 2) {
        return 'En az 2 aktif seçenek gereklidir';
      }

      if (activeItems.length > 10) {
        return 'En fazla 10 seçenek olabilir';
      }

      // Check for duplicate titles
      const titles = activeItems.map(item => item.title.trim().toLowerCase());
      const uniqueTitles = new Set(titles);
      if (titles.length !== uniqueTitles.size) {
        return 'Seçenek başlıkları benzersiz olmalıdır';
      }

      return true;
    }
  }
};

// Custom validation for date range
const validateDateRange = (start_date: string, end_date: string): string | true => {
  if (!start_date || !end_date) return true; // Let required validation handle empty values

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (endDate <= startDate) {
    return 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
  }

  // Check if duration is reasonable (not too short, not too long)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return 'Anket en az 1 gün sürmeli';
  }

  if (diffDays > 365) {
    return 'Anket en fazla 1 yıl sürebilir';
  }

  return true;
};

export interface UsePollFormOptions {
  defaultValues?: Partial<PollFormData>;
  mode?: 'create' | 'edit';
  onSubmit?: (data: PollFormData) => Promise<void>;
}

export function usePollForm(options: UsePollFormOptions = {}) {
  const { defaultValues, mode = 'create', onSubmit } = options;

  // Initialize default form values
  const getDefaultValues = (): PollFormData => ({
    title: '',
    description: '',
    poll_type: 'custom',
    start_date: '',
    end_date: '',
    is_active: true,
    show_on_homepage: true,
    show_results: 'after_voting',
    items: [
      {
        tempId: 'temp-1',
        title: '',
        description: '',
        image_url: '',
        display_order: 0,
        is_active: true
      },
      {
        tempId: 'temp-2',
        title: '',
        description: '',
        image_url: '',
        display_order: 1,
        is_active: true
      }
    ],
    ...defaultValues
  });

  const form = useForm<PollFormData>({
    defaultValues: getDefaultValues(),
    mode: 'onChange'
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, isValid },
    setValue,
    getValues,
    watch,
    reset,
    trigger
  } = form;

  // Watch for changes to detect dirty state
  const watchedValues = useWatch({ control });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Watch start and end dates for cross-validation
  const start_date = watch('start_date');
  const end_date = watch('end_date');

  // Custom validation for date range
  useEffect(() => {
    if (start_date && end_date) {
      const dateRangeError = validateDateRange(start_date, end_date);
      if (dateRangeError !== true) {
        form.setError('end_date', {
          type: 'validate',
          message: dateRangeError
        });
      } else {
        form.clearErrors('end_date');
      }
    }
  }, [start_date, end_date, form]);

  // Helper functions for poll items management
  const addPollItem = () => {
    const currentItems = getValues('items');
    const newItem: PollItem = {
      tempId: `temp-${Date.now()}`,
      title: '',
      description: '',
      image_url: '',
      display_order: currentItems.length,
      is_active: true
    };
    setValue('items', [...currentItems, newItem], { shouldDirty: true });
    trigger('items');
  };

  const removePollItem = (index: number) => {
    const currentItems = getValues('items');
    if (currentItems.length <= 2) return; // Minimum 2 items required

    const updatedItems = currentItems.filter((_, i) => i !== index);
    // Update display_order
    updatedItems.forEach((item, i) => {
      item.display_order = i;
    });
    setValue('items', updatedItems, { shouldDirty: true });
    trigger('items');
  };

  const updatePollItem = (index: number, field: keyof PollItem, value: any) => {
    const currentItems = getValues('items');
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setValue('items', updatedItems, { shouldDirty: true });
    trigger('items');
  };

  const reorderPollItems = (startIndex: number, endIndex: number) => {
    const currentItems = getValues('items');
    const result = Array.from(currentItems);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update display_order
    result.forEach((item, index) => {
      item.display_order = index;
    });

    setValue('items', result, { shouldDirty: true });
    trigger('items');
  };

  // Submit handler
  const onSubmitHandler = async (data: PollFormData) => {
    try {
      // Validate items one more time
      const activeItems = data.items.filter(item => item.is_active && item.title.trim());
      if (activeItems.length < 2) {
        form.setError('items', {
          type: 'validate',
          message: 'En az 2 aktif seçenek gereklidir'
        });
        return;
      }

      // Call the provided onSubmit handler
      if (onSubmit) {
        await onSubmit(data);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling can be extended here
    }
  };

  // Reset form with new values
  const resetForm = useCallback((newValues?: Partial<PollFormData>) => {
    const resetValues = newValues ? { ...getDefaultValues(), ...newValues } : getDefaultValues();
    reset(resetValues);
    setHasUnsavedChanges(false);
  }, [reset]);

  // Generate datetime-local value for inputs
  const formatForDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get minimum date for date inputs (today)
  const getMinDate = useCallback((): string => {
    const now = new Date();
    return formatForDateTimeLocal(now);
  }, []);

  // Direct form submission (bypasses react-hook-form's handleSubmit wrapper)
  // Useful for programmatic submission like "Save & Close" button
  const submitForm = useCallback(async (): Promise<void> => {
    const data = getValues();
    await onSubmitHandler(data);
  }, [getValues]);

  return {
    // Form instance and methods
    form,
    control,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    hasUnsavedChanges,

    // Form handlers
    handleSubmit: handleSubmit(onSubmitHandler),
    submitForm, // Direct submission method
    reset: resetForm,
    setValue,
    getValues,
    watch,
    trigger,

    // Poll items management
    addPollItem,
    removePollItem,
    updatePollItem,
    reorderPollItems,

    // Utility functions
    formatForDateTimeLocal,
    getMinDate,

    // Validation rules (exported for use in components)
    validationRules
  };
}

export default usePollForm;