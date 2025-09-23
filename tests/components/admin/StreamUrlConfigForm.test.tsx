/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StreamUrlConfigForm } from '@/components/admin/StreamUrlConfigForm';
import type { StreamTestResult, StreamMetadata, URLValidationResult } from '@/types/radioSettings';

// Mock react-hook-form with comprehensive implementation
const mockRegister = jest.fn((name, options) => ({
  name,
  onBlur: jest.fn(),
  onChange: jest.fn(),
  ref: jest.fn()
}));

const mockSetValue = jest.fn();
const mockSetError = jest.fn();
const mockClearErrors = jest.fn();
const mockWatch = jest.fn();

const mockHandleSubmit = jest.fn(fn => async (e) => {
  e.preventDefault();
  await fn({ streamUrl: 'https://stream.example.com:8000/' });
});

const mockUseForm = {
  register: mockRegister,
  handleSubmit: mockHandleSubmit,
  watch: mockWatch,
  setValue: mockSetValue,
  setError: mockSetError,
  clearErrors: mockClearErrors,
  formState: {
    errors: {},
    isDirty: true
  }
};

jest.mock('react-hook-form', () => ({
  useForm: () => mockUseForm
}));

// Mock StreamUrlValidator
jest.mock('@/lib/utils/streamUrlValidator', () => ({
  StreamUrlValidator: jest.fn().mockImplementation(() => ({
    validateUrl: jest.fn().mockReturnValue({
      isValid: true,
      message: 'URL format is valid',
      suggestions: []
    })
  }))
}));

// Mock stream testing utilities
jest.mock('@/lib/utils/streamMetadata', () => ({
  testStreamWithMetadata: jest.fn().mockResolvedValue({
    testResult: {
      success: true,
      message: 'Stream bağlantısı başarılı',
      timestamp: new Date().toISOString(),
      details: {
        statusCode: 200,
        responseTime: 150
      }
    },
    metadata: {
      streamTitle: 'Test Radio Stream',
      bitrate: 128,
      audioFormat: 'MP3',
      serverInfo: {
        software: 'Icecast',
        version: '2.4.4'
      }
    }
  })
}));

// Mock UI components
jest.mock('@/components/ui/Input', () => ({
  Input: ({ label, error, placeholder, ...props }: any) => (
    <div data-testid="input-container">
      <label>{label}</label>
      <input
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        placeholder={placeholder}
        {...props}
      />
      {error && <span data-testid="input-error">{error}</span>}
    </div>
  )
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, loading, variant, size, type, ...props }: any) => (
    <button
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({ title, subtitle, children, className }: any) => (
    <div data-testid="stream-config-card" className={className}>
      <h2 data-testid="card-title">{title}</h2>
      {subtitle && <p data-testid="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/Alert', () => ({
  Alert: ({ variant, title, children, dismissible, onDismiss, className }: any) => (
    <div
      data-testid={`alert-${variant}`}
      className={className}
    >
      {title && <h3 data-testid="alert-title">{title}</h3>}
      <div data-testid="alert-content">{children}</div>
      {dismissible && (
        <button data-testid="alert-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  )
}));

// Mock StreamTestIndicator component
jest.mock('@/components/admin/StreamTestIndicator', () => ({
  StreamTestIndicator: ({ testResult, metadata, isLoading, loadingMessage }: any) => {
    if (isLoading) {
      return (
        <div data-testid="stream-test-indicator-loading">
          <span data-testid="loading-message">{loadingMessage}</span>
        </div>
      );
    }

    if (!testResult) return null;

    return (
      <div data-testid="stream-test-indicator">
        <div data-testid={`test-result-${testResult.success ? 'success' : 'error'}`}>
          <span data-testid="test-result-message">{testResult.message}</span>
          {testResult.details && (
            <div data-testid="test-result-details">
              {testResult.details.statusCode && (
                <span data-testid="status-code">{testResult.details.statusCode}</span>
              )}
              {testResult.details.responseTime && (
                <span data-testid="response-time">{testResult.details.responseTime}ms</span>
              )}
            </div>
          )}
        </div>
        {metadata && (
          <div data-testid="stream-metadata">
            {metadata.streamTitle && (
              <span data-testid="stream-title">{metadata.streamTitle}</span>
            )}
            {metadata.bitrate && (
              <span data-testid="bitrate">{metadata.bitrate} kbps</span>
            )}
            {metadata.audioFormat && (
              <span data-testid="audio-format">{metadata.audioFormat}</span>
            )}
          </div>
        )}
      </div>
    );
  }
}));

// Mock utilities
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock server actions
jest.mock('@/app/admin/settings/actions', () => ({
  updateStreamUrl: jest.fn(),
  testStreamConnection: jest.fn()
}));

// Import mocked modules for accessing mock functions
import { StreamUrlValidator } from '@/lib/utils/streamUrlValidator';
import { testStreamWithMetadata } from '@/lib/utils/streamMetadata';

const mockStreamUrlValidator = StreamUrlValidator as jest.MockedClass<typeof StreamUrlValidator>;
const mockTestStreamWithMetadata = testStreamWithMetadata as jest.MockedFunction<typeof testStreamWithMetadata>;

describe('StreamUrlConfigForm Integration Tests', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    isLoading: false
  };

  const initialData = {
    stream_url: 'https://existing.stream.com:8000/'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock form state
    mockUseForm.formState.errors = {};
    mockUseForm.formState.isDirty = false;

    // Reset mock implementations
    mockWatch.mockReturnValue('');

    // Reset validator mock
    const mockValidatorInstance = {
      validateUrl: jest.fn().mockReturnValue({
        isValid: true,
        message: 'URL format is valid',
        suggestions: []
      })
    };
    mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

    // Reset stream test mock
    mockTestStreamWithMetadata.mockResolvedValue({
      testResult: {
        success: true,
        message: 'Stream bağlantısı başarılı',
        timestamp: new Date().toISOString(),
        details: {
          statusCode: 200,
          responseTime: 150
        }
      },
      metadata: {
        streamTitle: 'Test Radio Stream',
        bitrate: 128,
        audioFormat: 'MP3',
        serverInfo: {
          software: 'Icecast',
          version: '2.4.4'
        }
      }
    });
  });

  describe('Form Rendering and Initialization', () => {
    it('renders form with all required elements', () => {
      render(<StreamUrlConfigForm {...defaultProps} />);

      // Verify card structure
      expect(screen.getByTestId('stream-config-card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toHaveTextContent('Stream URL Konfigürasyonu');
      expect(screen.getByTestId('card-subtitle')).toHaveTextContent('Radyo stream URL\'sini yapılandırın ve test edin');

      // Verify form elements
      expect(screen.getByTestId('input-stream-url')).toBeInTheDocument();
      expect(screen.getByTestId('button-stream\'i-test-et')).toBeInTheDocument();
      expect(screen.getByTestId('button-kaydet')).toBeInTheDocument();
    });

    it('initializes form with provided initial data', () => {
      render(<StreamUrlConfigForm {...defaultProps} initialData={initialData} />);

      // Verify form registration with initial values
      expect(mockUseForm.register).toHaveBeenCalledWith('streamUrl', expect.objectContaining({
        required: 'Stream URL gereklidir',
        minLength: {
          value: 10,
          message: 'Stream URL en az 10 karakter olmalıdır'
        }
      }));
    });

    it('displays stream URL requirements information', () => {
      render(<StreamUrlConfigForm {...defaultProps} />);

      // Check for requirements section
      expect(screen.getByText('Stream URL Gereksinimleri:')).toBeInTheDocument();
      expect(screen.getByText('HTTP veya HTTPS protokolü kullanmalıdır')).toBeInTheDocument();
      expect(screen.getByText('Geçerli bir domain adı içermelidir')).toBeInTheDocument();
      expect(screen.getByText('Audio stream formatını desteklemelidir (MP3, AAC, OGG, FLAC)')).toBeInTheDocument();
    });
  });

  describe('Real-time URL Validation', () => {
    it('validates URL format in real-time as user types', async () => {
      mockWatch.mockReturnValue('https://valid-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid',
          suggestions: []
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(mockValidatorInstance.validateUrl).toHaveBeenCalledWith('https://valid-stream.com:8000/');
      });
    });

    it('shows validation feedback for valid URLs', async () => {
      mockWatch.mockReturnValue('https://valid-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid',
          suggestions: []
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('URL formatı geçerli')).toBeInTheDocument();
      });
    });

    it('shows validation errors for invalid URLs', async () => {
      mockWatch.mockReturnValue('invalid-url');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: false,
          message: 'Invalid URL format',
          errorType: 'format',
          suggestions: ['Ensure URL includes protocol (http:// or https://)']
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
        expect(mockSetError).toHaveBeenCalledWith('streamUrl', {
          type: 'validation',
          message: 'Invalid URL format'
        });
      });
    });

    it('displays URL suggestions when validator provides them', async () => {
      mockWatch.mockReturnValue('stream.example.com/stream');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL is valid with suggested corrections',
          suggestions: [
            'Suggested URL: https://stream.example.com/',
            'Removed "/stream" suffix - base URL format is recommended'
          ]
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Öneriler:')).toBeInTheDocument();
        expect(screen.getByText('Suggested URL: https://stream.example.com/')).toBeInTheDocument();
        expect(screen.getByTestId('button-uygula')).toBeInTheDocument();
      });
    });

    it('applies suggested URL corrections when user clicks apply', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('stream.example.com/stream');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL is valid with suggested corrections',
          suggestions: ['Suggested URL: https://stream.example.com/']
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-uygula')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('button-uygula');
      await user.click(applyButton);

      expect(mockSetValue).toHaveBeenCalledWith('streamUrl', 'https://stream.example.com/');
    });
  });

  describe('Stream Testing Functionality', () => {
    it('enables test button only when URL is valid', async () => {
      // Test with invalid URL
      mockWatch.mockReturnValue('');

      const mockValidatorInstanceInvalid = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: false,
          message: 'URL is required',
          errorType: 'format'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstanceInvalid);

      const { rerender } = render(<StreamUrlConfigForm {...defaultProps} />);

      expect(screen.getByTestId('button-stream\'i-test-et')).toBeDisabled();

      // Test with valid URL
      mockWatch.mockReturnValue('https://valid-stream.com:8000/');

      const mockValidatorInstanceValid = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstanceValid);

      rerender(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-stream\'i-test-et')).not.toBeDisabled();
      });
    });

    it('performs stream test and displays loading state', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('https://test-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      // Mock slow response to test loading state
      mockTestStreamWithMetadata.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            testResult: {
              success: true,
              message: 'Stream bağlantısı başarılı',
              timestamp: new Date().toISOString(),
              details: { statusCode: 200, responseTime: 150 }
            },
            metadata: {
              streamTitle: 'Test Stream',
              bitrate: 128,
              audioFormat: 'MP3'
            }
          }), 100);
        })
      );

      render(<StreamUrlConfigForm {...defaultProps} />);

      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await user.click(testButton);

      // Verify loading state
      expect(screen.getByTestId('stream-test-indicator-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-message')).toHaveTextContent('Stream bağlantısı test ediliyor...');

      // Wait for test completion
      await waitFor(() => {
        expect(screen.getByTestId('stream-test-indicator')).toBeInTheDocument();
      });
    });

    it('displays successful test results with metadata', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('https://successful-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      render(<StreamUrlConfigForm {...defaultProps} />);

      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await user.click(testButton);

      await waitFor(() => {
        expect(mockTestStreamWithMetadata).toHaveBeenCalledWith('https://successful-stream.com:8000/', 15000);
      });

      await waitFor(() => {
        // Verify test result display
        expect(screen.getByTestId('test-result-success')).toBeInTheDocument();
        expect(screen.getByTestId('test-result-message')).toHaveTextContent('Stream bağlantısı başarılı');

        // Verify test details
        expect(screen.getByTestId('status-code')).toHaveTextContent('200');
        expect(screen.getByTestId('response-time')).toHaveTextContent('150ms');

        // Verify metadata display
        expect(screen.getByTestId('stream-metadata')).toBeInTheDocument();
        expect(screen.getByTestId('stream-title')).toHaveTextContent('Test Radio Stream');
        expect(screen.getByTestId('bitrate')).toHaveTextContent('128 kbps');
        expect(screen.getByTestId('audio-format')).toHaveTextContent('MP3');
      });
    });

    it('displays error results for failed stream tests', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('https://failed-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockTestStreamWithMetadata.mockResolvedValue({
        testResult: {
          success: false,
          message: 'Connection failed',
          timestamp: new Date().toISOString(),
          details: {
            statusCode: 404,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Stream not found'
          }
        }
      });

      render(<StreamUrlConfigForm {...defaultProps} />);

      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('test-result-error')).toBeInTheDocument();
        expect(screen.getByTestId('test-result-message')).toHaveTextContent('Connection failed');
        expect(screen.getByTestId('status-code')).toHaveTextContent('404');
      });
    });

    it('handles stream test exceptions gracefully', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('https://exception-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      const testError = new Error('Network error');
      mockTestStreamWithMetadata.mockRejectedValue(testError);

      render(<StreamUrlConfigForm {...defaultProps} />);

      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('test-result-error')).toBeInTheDocument();
        expect(screen.getByTestId('test-result-message')).toHaveTextContent('Stream test hatası: Network error');
      });
    });
  });

  describe('Form Submission and Save Functionality', () => {
    it('enables save button only when form is dirty and URL is valid', async () => {
      mockWatch.mockReturnValue('https://valid-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockUseForm.formState.isDirty = false;

      const { rerender } = render(<StreamUrlConfigForm {...defaultProps} />);

      // Save button should be disabled when form is not dirty
      expect(screen.getByTestId('button-kaydet')).toBeDisabled();

      // Enable when form is dirty
      mockUseForm.formState.isDirty = true;
      rerender(<StreamUrlConfigForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-kaydet')).not.toBeDisabled();
      });
    });

    it('performs final validation before submission', async () => {
      const user = userEvent.setup();
      const onSubmitMock = jest.fn().mockResolvedValue(undefined);

      mockWatch.mockReturnValue('https://submit-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockHandleSubmit).toHaveBeenCalled();
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      const onSubmitMock = jest.fn().mockResolvedValue(undefined);

      mockWatch.mockReturnValue('https://success-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-success')).toBeInTheDocument();
        expect(screen.getByTestId('alert-title')).toHaveTextContent('Başarılı!');
        expect(screen.getByTestId('alert-content')).toHaveTextContent('Stream URL başarıyla kaydedildi ve doğrulandı.');
      });
    });

    it('displays error message when submission fails', async () => {
      const user = userEvent.setup();
      const onSubmitMock = jest.fn().mockRejectedValue(new Error('Save failed'));

      mockWatch.mockReturnValue('https://fail-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-error')).toBeInTheDocument();
        expect(screen.getByTestId('alert-title')).toHaveTextContent('Hata');
        expect(screen.getByTestId('alert-content')).toHaveTextContent('Kaydetme hatası: Save failed');
      });
    });

    it('prevents submission when stream connectivity test fails', async () => {
      const user = userEvent.setup();
      const onSubmitMock = jest.fn();

      mockWatch.mockReturnValue('https://connectivity-fail-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockTestStreamWithMetadata.mockResolvedValue({
        testResult: {
          success: false,
          message: 'Connection failed',
          timestamp: new Date().toISOString(),
          details: {
            errorCode: 'CONNECTION_ERROR',
            errorMessage: 'Cannot connect to stream'
          }
        }
      });

      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-error')).toBeInTheDocument();
        expect(screen.getByTestId('alert-content')).toHaveTextContent('Stream bağlantısı başarısız. Lütfen URL\'yi kontrol edin ve tekrar deneyin.');
        expect(onSubmitMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and User Feedback', () => {
    it('displays form validation errors inline', async () => {
      mockUseForm.formState.errors = {
        streamUrl: { message: 'Stream URL gereklidir' }
      };

      render(<StreamUrlConfigForm {...defaultProps} />);

      expect(screen.getByTestId('input-error')).toHaveTextContent('Stream URL gereklidir');
    });

    it('allows dismissing error alerts', async () => {
      const user = userEvent.setup();

      // Trigger an error state first
      mockWatch.mockReturnValue('https://error-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      const onSubmitMock = jest.fn().mockRejectedValue(new Error('Test error'));
      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-error')).toBeInTheDocument();
      });

      const dismissButton = screen.getByTestId('alert-dismiss');
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByTestId('alert-error')).not.toBeInTheDocument();
      });
    });

    it('auto-hides success message after timeout', async () => {
      jest.useFakeTimers();

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSubmitMock = jest.fn().mockResolvedValue(undefined);

      mockWatch.mockReturnValue('https://auto-hide-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      mockUseForm.formState.isDirty = true;

      render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      const saveButton = screen.getByTestId('button-kaydet');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-success')).toBeInTheDocument();
      });

      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByTestId('alert-success')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Loading States and User Experience', () => {
    it('disables form elements during loading state', () => {
      render(<StreamUrlConfigForm {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('button-stream\'i-test-et')).toBeDisabled();
      expect(screen.getByTestId('button-kaydet')).toBeDisabled();
      expect(screen.getByTestId('button-kaydet')).toHaveAttribute('data-loading', 'true');
    });

    it('shows loading text on buttons during operations', () => {
      render(<StreamUrlConfigForm {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('button-kaydet')).toHaveTextContent('Kaydediliyor...');
    });

    it('maintains form state during test operations', async () => {
      const user = userEvent.setup();

      mockWatch.mockReturnValue('https://state-maintain-stream.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      // Mock slow stream test
      mockTestStreamWithMetadata.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            testResult: {
              success: true,
              message: 'Stream bağlantısı başarılı',
              timestamp: new Date().toISOString(),
              details: { statusCode: 200, responseTime: 150 }
            }
          }), 200);
        })
      );

      render(<StreamUrlConfigForm {...defaultProps} />);

      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await user.click(testButton);

      // Verify form input remains accessible during test
      const input = screen.getByTestId('input-stream-url');
      expect(input).not.toBeDisabled();

      await waitFor(() => {
        expect(screen.getByTestId('stream-test-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Flow Testing', () => {
    it('executes complete workflow: URL entry → validation → test → save', async () => {
      const user = userEvent.setup();
      const onSubmitMock = jest.fn().mockResolvedValue(undefined);

      // Start with empty form
      mockWatch.mockReturnValue('');

      const mockValidatorInstanceEmpty = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: false,
          message: 'URL is required'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstanceEmpty);

      const { rerender } = render(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      // Step 1: Enter URL
      mockWatch.mockReturnValue('https://workflow-test.com:8000/');

      const mockValidatorInstanceValid = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstanceValid);

      mockUseForm.formState.isDirty = true;
      rerender(<StreamUrlConfigForm {...defaultProps} onSubmit={onSubmitMock} />);

      // Step 2: Verify validation feedback
      await waitFor(() => {
        expect(screen.getByText('URL formatı geçerli')).toBeInTheDocument();
      });

      // Step 3: Test stream
      const testButton = screen.getByTestId('button-stream\'i-test-et');
      expect(testButton).not.toBeDisabled();

      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('test-result-success')).toBeInTheDocument();
      });

      // Step 4: Save configuration
      const saveButton = screen.getByTestId('button-kaydet');
      expect(saveButton).not.toBeDisabled();

      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-success')).toBeInTheDocument();
        expect(onSubmitMock).toHaveBeenCalledWith('https://workflow-test.com:8000/');
      });
    });

    it('handles URL changes clearing previous test results', async () => {
      mockWatch.mockReturnValue('https://first-url.com:8000/');

      const mockValidatorInstance = {
        validateUrl: jest.fn().mockReturnValue({
          isValid: true,
          message: 'URL format is valid'
        })
      };
      mockStreamUrlValidator.mockImplementation(() => mockValidatorInstance);

      const { rerender } = render(<StreamUrlConfigForm {...defaultProps} />);

      // First URL test
      const testButton = screen.getByTestId('button-stream\'i-test-et');
      await userEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('stream-test-indicator')).toBeInTheDocument();
      });

      // Change URL
      mockWatch.mockReturnValue('https://second-url.com:8000/');

      rerender(<StreamUrlConfigForm {...defaultProps} />);

      // Previous test results should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('stream-test-indicator')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Interface', () => {
    it('provides proper form labels and structure', () => {
      render(<StreamUrlConfigForm {...defaultProps} />);

      // Verify form structure
      expect(screen.getByText('Stream URL')).toBeInTheDocument();
      expect(screen.getByTestId('input-stream-url')).toHaveAttribute('placeholder', 'https://stream.example.com:8000/');

      // Verify buttons have appropriate text
      expect(screen.getByTestId('button-stream\'i-test-et')).toHaveTextContent('Stream\'i Test Et');
      expect(screen.getByTestId('button-kaydet')).toHaveTextContent('Kaydet');
    });

    it('supports keyboard navigation through form elements', async () => {
      const user = userEvent.setup();

      render(<StreamUrlConfigForm {...defaultProps} />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByTestId('input-stream-url')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-stream\'i-test-et')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-kaydet')).toHaveFocus();
    });

    it('announces validation errors for screen readers', () => {
      mockUseForm.formState.errors = {
        streamUrl: { message: 'Geçerli bir stream URL formatı girin' }
      };

      render(<StreamUrlConfigForm {...defaultProps} />);

      const errorMessage = screen.getByTestId('input-error');
      expect(errorMessage).toHaveTextContent('Geçerli bir stream URL formatı girin');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});