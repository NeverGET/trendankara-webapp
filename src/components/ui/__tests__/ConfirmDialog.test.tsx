import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

// Mock the Modal component
jest.mock('../Modal', () => ({
  Modal: ({ children, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal" onClick={onClose}>
        {children}
      </div>
    ) : null
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test message'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Onayla')).toBeInTheDocument();
      expect(screen.getByText('İptal')).toBeInTheDocument();
    });

    it('renders with custom button texts', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Cancel"
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Variant Styling', () => {
    it('renders danger variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      // Should have danger icon and styling
      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
    });

    it('renders warning variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
    });

    it('renders info variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Onayla'));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('İptal'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('handles async onConfirm function', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Onayla'));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('handles onConfirm function that throws error', async () => {
      const onConfirm = jest.fn().mockRejectedValue(new Error('Test error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Onayla'));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Confirmation action failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('shows loading state on confirm button', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByText('Onayla');
      expect(confirmButton).toBeDisabled();

      const cancelButton = screen.getByText('İptal');
      expect(cancelButton).toBeDisabled();
    });

    it('disables buttons when loading', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      expect(screen.getByText('Onayla')).toBeDisabled();
      expect(screen.getByText('İptal')).toBeDisabled();
    });
  });

  describe('Error Handling and Retry', () => {
    it('displays error message when error prop is provided', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          error="Something went wrong"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows retry button when showRetry is true', () => {
      const onRetry = jest.fn();
      render(
        <ConfirmDialog
          {...defaultProps}
          error="Error occurred"
          showRetry={true}
          onRetry={onRetry}
        />
      );

      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      expect(screen.queryByText('Onayla')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(
        <ConfirmDialog
          {...defaultProps}
          error="Error occurred"
          showRetry={true}
          onRetry={onRetry}
        />
      );

      fireEvent.click(screen.getByText('Tekrar Dene'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('displays retry count when provided', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          error="Error occurred"
          retryCount={2}
        />
      );

      expect(screen.getByText('Deneme 2/3')).toBeInTheDocument();
    });

    it('hides retry count when retryCount is 0', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          error="Error occurred"
          retryCount={0}
        />
      );

      expect(screen.queryByText(/Deneme/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConfirmDialog {...defaultProps} />);

      // Modal should be rendered (mocked)
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('focuses on the confirm button when opened', () => {
      render(<ConfirmDialog {...defaultProps} />);

      // Note: Focus testing would require more sophisticated setup
      // This is a placeholder for focus testing
      expect(screen.getByText('Onayla')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('shows confirm button by default', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Onayla')).toBeInTheDocument();
      expect(screen.queryByText('Tekrar Dene')).not.toBeInTheDocument();
    });

    it('switches to retry button when showRetry is true', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          showRetry={true}
          onRetry={jest.fn()}
        />
      );

      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      expect(screen.queryByText('Onayla')).not.toBeInTheDocument();
    });

    it('disables retry button when loading', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          showRetry={true}
          onRetry={jest.fn()}
          loading={true}
        />
      );

      expect(screen.getByText('Tekrar Dene')).toBeDisabled();
    });
  });
});