import { renderHook, act } from '@testing-library/react';
import { useConfirmation } from '../useConfirmation';

describe('useConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useConfirmation());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.title).toBe('Onaylama');
      expect(result.current.message).toBe('Bu işlemi gerçekleştirmek istediğinizden emin misiniz?');
      expect(result.current.confirmText).toBe('Onayla');
      expect(result.current.cancelText).toBe('İptal');
      expect(result.current.variant).toBe('default');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.showRetry).toBe(false);
    });
  });

  describe('Basic Confirmation Flow', () => {
    it('should open confirmation dialog with default options', async () => {
      const { result } = renderHook(() => useConfirmation());

      let confirmPromise: Promise<boolean>;
      act(() => {
        confirmPromise = result.current.confirm();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.title).toBe('Onaylama');
      expect(result.current.message).toBe('Bu işlemi gerçekleştirmek istediğinizden emin misiniz?');
    });

    it('should open confirmation dialog with custom options', async () => {
      const { result } = renderHook(() => useConfirmation());

      const options = {
        title: 'Custom Title',
        message: 'Custom message',
        confirmText: 'Yes',
        cancelText: 'No',
        variant: 'danger' as const
      };

      act(() => {
        result.current.confirm(options);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.title).toBe('Custom Title');
      expect(result.current.message).toBe('Custom message');
      expect(result.current.confirmText).toBe('Yes');
      expect(result.current.cancelText).toBe('No');
      expect(result.current.variant).toBe('danger');
    });

    it('should resolve with true when confirmed', async () => {
      const { result } = renderHook(() => useConfirmation());

      let confirmPromise: Promise<boolean>;
      act(() => {
        confirmPromise = result.current.confirm();
      });

      act(() => {
        result.current.handleConfirm();
      });

      await expect(confirmPromise!).resolves.toBe(true);
      expect(result.current.isOpen).toBe(false);
    });

    it('should resolve with false when cancelled', async () => {
      const { result } = renderHook(() => useConfirmation());

      let confirmPromise: Promise<boolean>;
      act(() => {
        confirmPromise = result.current.confirm();
      });

      act(() => {
        result.current.close();
      });

      await expect(confirmPromise!).resolves.toBe(false);
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('Loading State Management', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error State Management', () => {
    it('should update error state', () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });

    it('should show retry when error occurs and retry options are available', () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn();
      act(() => {
        result.current.confirm({
          maxRetries: 3,
          onRetry: retryFn
        });
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.showRetry).toBe(true);
      expect(result.current.error).toBe('Test error');
    });

    it('should not show retry when maxRetries is exceeded', () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn();
      act(() => {
        result.current.confirm({
          maxRetries: 2,
          onRetry: retryFn
        });
      });

      // Simulate multiple retries
      act(() => {
        result.current.setError('First error');
      });

      act(() => {
        result.current.handleRetry();
      });

      act(() => {
        result.current.setError('Second error');
      });

      act(() => {
        result.current.handleRetry();
      });

      act(() => {
        result.current.setError('Third error');
      });

      // Should not show retry anymore as maxRetries (2) is exceeded
      expect(result.current.showRetry).toBe(false);
      expect(result.current.retryCount).toBe(2);
    });
  });

  describe('Retry Functionality', () => {
    it('should handle successful retry', async () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn().mockResolvedValue(undefined);
      let confirmPromise: Promise<boolean>;

      act(() => {
        confirmPromise = result.current.confirm({
          maxRetries: 3,
          onRetry: retryFn
        });
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.showRetry).toBe(true);

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(result.current.retryCount).toBe(1);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.error).toBe(null);
      await expect(confirmPromise!).resolves.toBe(true);
    });

    it('should handle failed retry', async () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn().mockRejectedValue(new Error('Retry failed'));

      act(() => {
        result.current.confirm({
          maxRetries: 3,
          onRetry: retryFn
        });
      });

      act(() => {
        result.current.setError('Initial error');
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(result.current.retryCount).toBe(1);
      expect(result.current.error).toBe('Retry failed');
      expect(result.current.isOpen).toBe(true);
    });

    it('should increment retry count on each retry attempt', async () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn().mockRejectedValue(new Error('Retry failed'));

      act(() => {
        result.current.confirm({
          maxRetries: 3,
          onRetry: retryFn
        });
      });

      // First error
      act(() => {
        result.current.setError('Error 1');
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(result.current.retryCount).toBe(1);

      // Second error and retry
      await act(async () => {
        await result.current.handleRetry();
      });

      expect(result.current.retryCount).toBe(2);
      expect(retryFn).toHaveBeenCalledTimes(2);
    });

    it('should handle retry with generic error message for non-Error objects', async () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn().mockRejectedValue('String error');

      act(() => {
        result.current.confirm({
          maxRetries: 3,
          onRetry: retryFn
        });
      });

      act(() => {
        result.current.setError('Initial error');
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(result.current.error).toBe('İşlem başarısız oldu');
    });
  });

  describe('State Reset', () => {
    it('should reset state when closing', () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.confirm();
      });

      act(() => {
        result.current.setLoading(true);
      });

      act(() => {
        result.current.setError('Test error');
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.showRetry).toBe(false);
    });

    it('should reset state when confirming', () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.confirm();
      });

      act(() => {
        result.current.setLoading(true);
      });

      act(() => {
        result.current.setError('Test error');
      });

      act(() => {
        result.current.handleConfirm();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.showRetry).toBe(false);
    });
  });

  describe('Multiple Confirmations', () => {
    it('should handle multiple sequential confirmations', async () => {
      const { result } = renderHook(() => useConfirmation());

      // First confirmation
      let firstPromise: Promise<boolean>;
      act(() => {
        firstPromise = result.current.confirm({ title: 'First' });
      });

      expect(result.current.title).toBe('First');

      act(() => {
        result.current.handleConfirm();
      });

      await expect(firstPromise!).resolves.toBe(true);

      // Second confirmation
      let secondPromise: Promise<boolean>;
      act(() => {
        secondPromise = result.current.confirm({ title: 'Second' });
      });

      expect(result.current.title).toBe('Second');

      act(() => {
        result.current.close();
      });

      await expect(secondPromise!).resolves.toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle retry when onRetry is not provided', async () => {
      const { result } = renderHook(() => useConfirmation());

      act(() => {
        result.current.confirm();
      });

      // This should not throw or cause issues
      await act(async () => {
        await result.current.handleRetry();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should use default maxRetries when not specified', () => {
      const { result } = renderHook(() => useConfirmation());

      const retryFn = jest.fn();
      act(() => {
        result.current.confirm({ onRetry: retryFn });
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.showRetry).toBe(true);
    });
  });
});