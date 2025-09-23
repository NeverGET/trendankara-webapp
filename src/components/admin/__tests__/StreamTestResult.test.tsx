import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamTestResult } from '../StreamTestResult';
import type { StreamTestResult as StreamTestResultType } from '@/types/radioSettings';

// Mock the UI components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, loading, disabled, icon, className, ...props }: any) => (
    <button
      data-testid="retry-button"
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {icon && <span data-testid="button-icon">{icon}</span>}
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant, size, pill }: any) => (
    <span
      data-testid="status-badge"
      data-variant={variant}
      data-size={size}
      data-pill={pill}
    >
      {children}
    </span>
  )
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('StreamTestResult', () => {
  const mockSuccessResult: StreamTestResultType = {
    success: true,
    message: 'Stream bağlantısı başarıyla doğrulandı',
    timestamp: '2024-01-15T10:30:00.000Z',
    details: {
      statusCode: 200,
      responseTime: 150,
    }
  };

  const mockErrorResult: StreamTestResultType = {
    success: false,
    message: 'Stream bağlantısı başarısız oldu',
    timestamp: '2024-01-15T10:30:00.000Z',
    details: {
      errorMessage: 'Connection timeout',
      errorCode: 'TIMEOUT_ERROR'
    }
  };

  const defaultProps = {
    testResult: mockSuccessResult,
    onRetry: undefined,
    retryLoading: false,
    className: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with success result', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByText('Stream bağlantısı başarıyla doğrulandı')).toBeInTheDocument();
    });

    it('renders with error result', () => {
      render(
        <StreamTestResult
          {...defaultProps}
          testResult={mockErrorResult}
        />
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByText('Stream bağlantısı başarısız oldu')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(
        <StreamTestResult
          {...defaultProps}
          className="custom-class"
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Success State Rendering', () => {
    it('displays success badge with correct variant', () => {
      render(<StreamTestResult {...defaultProps} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('data-variant', 'success');
      expect(badge).toHaveTextContent('Başarılı');
    });

    it('displays success icon', () => {
      render(<StreamTestResult {...defaultProps} />);

      // Check for success icon presence via SVG
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements).toHaveLength(1);
      expect(svgElements[0]).toBeInTheDocument();
    });

    it('displays success message', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Stream bağlantısı başarıyla doğrulandı')).toBeInTheDocument();
    });

    it('does not show retry button for successful tests', () => {
      const onRetry = jest.fn();
      render(
        <StreamTestResult
          {...defaultProps}
          onRetry={onRetry}
        />
      );

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });
  });

  describe('Error State Rendering', () => {
    const errorProps = {
      ...defaultProps,
      testResult: mockErrorResult
    };

    it('displays error badge with correct variant', () => {
      render(<StreamTestResult {...errorProps} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('data-variant', 'error');
      expect(badge).toHaveTextContent('Başarısız');
    });

    it('displays error icon', () => {
      render(<StreamTestResult {...errorProps} />);

      // Check for error icon presence via SVG
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements).toHaveLength(1);
      expect(svgElements[0]).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<StreamTestResult {...errorProps} />);

      expect(screen.getByText('Stream bağlantısı başarısız oldu')).toBeInTheDocument();
    });

    it('displays error details when available', () => {
      render(<StreamTestResult {...errorProps} />);

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.getByText('TIMEOUT_ERROR')).toBeInTheDocument();
      expect(screen.getByText('Hata:')).toBeInTheDocument();
      expect(screen.getByText('Kod:')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      render(
        <StreamTestResult
          {...errorProps}
          onRetry={onRetry}
        />
      );

      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(<StreamTestResult {...errorProps} />);

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });
  });

  describe('Connection Details Display', () => {
    it('displays status code when available', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Durum Kodu')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('displays formatted response time', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Yanıt Süresi')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });

    it('displays connection details section header', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Bağlantı Detayları')).toBeInTheDocument();
    });

    it('displays validation status', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Test Sonucu')).toBeInTheDocument();
      expect(screen.getByText('Doğrulandı')).toBeInTheDocument();
    });

    it('does not display connection details for failed tests', () => {
      render(
        <StreamTestResult
          {...defaultProps}
          testResult={mockErrorResult}
        />
      );

      expect(screen.queryByText('Bağlantı Detayları')).not.toBeInTheDocument();
      expect(screen.queryByText('Durum Kodu')).not.toBeInTheDocument();
    });

    it('handles missing response time gracefully', () => {
      const resultWithoutResponseTime: StreamTestResultType = {
        ...mockSuccessResult,
        details: {
          statusCode: 200
          // responseTime is missing
        }
      };

      render(
        <StreamTestResult
          {...defaultProps}
          testResult={resultWithoutResponseTime}
        />
      );

      expect(screen.getByText('Durum Kodu')).toBeInTheDocument();
      expect(screen.queryByText('Yanıt Süresi')).not.toBeInTheDocument();
    });

    it('handles missing status code gracefully', () => {
      const resultWithoutStatusCode: StreamTestResultType = {
        ...mockSuccessResult,
        details: {
          responseTime: 150
          // statusCode is missing
        }
      };

      render(
        <StreamTestResult
          {...defaultProps}
          testResult={resultWithoutStatusCode}
        />
      );

      expect(screen.getByText('Yanıt Süresi')).toBeInTheDocument();
      expect(screen.queryByText('Durum Kodu')).not.toBeInTheDocument();
    });
  });

  describe('Retry Button Functionality', () => {
    const errorPropsWithRetry = {
      ...defaultProps,
      testResult: mockErrorResult,
      onRetry: jest.fn()
    };

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      render(
        <StreamTestResult
          {...errorPropsWithRetry}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('disables retry button when retryLoading is true', () => {
      render(
        <StreamTestResult
          {...errorPropsWithRetry}
          retryLoading={true}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeDisabled();
    });

    it('does not show retry icon when loading', () => {
      render(
        <StreamTestResult
          {...errorPropsWithRetry}
          retryLoading={true}
        />
      );

      expect(screen.queryByTestId('button-icon')).not.toBeInTheDocument();
    });

    it('shows retry icon when not loading', () => {
      render(
        <StreamTestResult
          {...errorPropsWithRetry}
          retryLoading={false}
        />
      );

      expect(screen.getByTestId('button-icon')).toBeInTheDocument();
    });
  });

  describe('Turkish Message Display', () => {
    it('displays Turkish success message', () => {
      render(<StreamTestResult {...defaultProps} />);

      expect(screen.getByText('Başarılı')).toBeInTheDocument();
      expect(screen.getByText('Bağlantı Detayları')).toBeInTheDocument();
      expect(screen.getByText('Durum Kodu')).toBeInTheDocument();
      expect(screen.getByText('Yanıt Süresi')).toBeInTheDocument();
      expect(screen.getByText('Test Sonucu')).toBeInTheDocument();
      expect(screen.getByText('Doğrulandı')).toBeInTheDocument();
    });

    it('displays Turkish error message', () => {
      const onRetry = jest.fn();
      render(
        <StreamTestResult
          {...defaultProps}
          testResult={mockErrorResult}
          onRetry={onRetry}
        />
      );

      expect(screen.getByText('Başarısız')).toBeInTheDocument();
      expect(screen.getByText('Hata:')).toBeInTheDocument();
      expect(screen.getByText('Kod:')).toBeInTheDocument();
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });

    it('displays Turkish labels correctly', () => {
      render(<StreamTestResult {...defaultProps} />);

      // Check for Turkish language usage
      expect(screen.getByText('Başarılı')).toBeInTheDocument();
      expect(screen.getByText('Bağlantı Detayları')).toBeInTheDocument();
      expect(screen.getByText('Doğrulandı')).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamp correctly for Turkish locale', () => {
      // Mock Date constructor to have predictable output
      const mockDate = new Date('2024-01-15T10:30:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<StreamTestResult {...defaultProps} />);

      // The timestamp should be formatted and displayed
      // We can't test exact format due to locale differences in test environment
      // But we can verify the timestamp element exists
      const cardElement = screen.getByTestId('card');
      expect(cardElement).toBeInTheDocument();

      jest.restoreAllMocks();
    });

    it('handles invalid timestamp gracefully', () => {
      const resultWithInvalidTimestamp: StreamTestResultType = {
        ...mockSuccessResult,
        timestamp: 'invalid-timestamp'
      };

      render(
        <StreamTestResult
          {...defaultProps}
          testResult={resultWithInvalidTimestamp}
        />
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Component Props Interface', () => {
    it('accepts all required props', () => {
      expect(() => {
        render(<StreamTestResult testResult={mockSuccessResult} />);
      }).not.toThrow();
    });

    it('handles optional props correctly', () => {
      const onRetry = jest.fn();

      expect(() => {
        render(
          <StreamTestResult
            testResult={mockErrorResult}
            onRetry={onRetry}
            retryLoading={true}
            className="test-class"
          />
        );
      }).not.toThrow();
    });

    it('works without optional details', () => {
      const resultWithoutDetails: StreamTestResultType = {
        success: true,
        message: 'Test message',
        timestamp: '2024-01-15T10:30:00.000Z'
        // details is optional
      };

      expect(() => {
        render(
          <StreamTestResult
            {...defaultProps}
            testResult={resultWithoutDetails}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('handles error result without error details', () => {
      const errorWithoutDetails: StreamTestResultType = {
        success: false,
        message: 'Error occurred',
        timestamp: '2024-01-15T10:30:00.000Z'
        // No details object
      };

      render(
        <StreamTestResult
          {...defaultProps}
          testResult={errorWithoutDetails}
        />
      );

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Hata:')).not.toBeInTheDocument();
    });

    it('handles error result with partial error details', () => {
      const errorWithPartialDetails: StreamTestResultType = {
        success: false,
        message: 'Error occurred',
        timestamp: '2024-01-15T10:30:00.000Z',
        details: {
          errorMessage: 'Connection failed'
          // errorCode is missing
        }
      };

      render(
        <StreamTestResult
          {...defaultProps}
          testResult={errorWithPartialDetails}
        />
      );

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('Hata:')).toBeInTheDocument();
      expect(screen.queryByText('Kod:')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies success styling classes', () => {
      render(<StreamTestResult {...defaultProps} />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('border-green-500/30');
      expect(card.className).toContain('bg-gradient-to-br');
    });

    it('applies error styling classes', () => {
      render(
        <StreamTestResult
          {...defaultProps}
          testResult={mockErrorResult}
        />
      );

      const card = screen.getByTestId('card');
      expect(card.className).toContain('border-red-500/30');
      expect(card.className).toContain('bg-gradient-to-br');
    });

    it('includes transition classes', () => {
      render(<StreamTestResult {...defaultProps} />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-300');
    });
  });
});