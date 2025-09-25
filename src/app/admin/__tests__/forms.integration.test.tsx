import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsForm } from '@/components/admin/NewsForm';
import { PollFormFields } from '@/components/admin/PollFormFields';

// Mock the MediaPickerDialog component
jest.mock('@/components/admin/MediaPickerDialog', () => ({
  MediaPickerDialog: ({ isOpen, onSelect, onClose }: any) => (
    isOpen ? (
      <div data-testid="media-picker-dialog">
        <button onClick={() => {
          onSelect({ id: 1, url: '/test-image.jpg', filename: 'test.jpg' });
          onClose();
        }}>
          Select Test Image
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  )
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Admin Forms Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('NewsForm Integration', () => {
    const defaultProps = {
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      isLoading: false,
    };

    beforeEach(() => {
      defaultProps.onSubmit.mockClear();
      defaultProps.onCancel.mockClear();
    });

    it('renders form with compact inputs and proper spacing', () => {
      render(<NewsForm {...defaultProps} />);

      // Check that form elements are present
      expect(screen.getByLabelText(/başlık/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/özet/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/içerik/i)).toBeInTheDocument();

      // Verify compact input styling
      const titleInput = screen.getByLabelText(/başlık/i);
      expect(titleInput).toHaveClass('px-3', 'py-1.5');
    });

    it('handles form submission with compact input values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 1 }),
      });

      render(<NewsForm {...defaultProps} />);

      // Fill form fields
      await user.type(screen.getByLabelText(/başlık/i), 'Test News Title');
      await user.type(screen.getByLabelText(/özet/i), 'Test news summary');
      await user.type(screen.getByLabelText(/içerik/i), 'Test news content');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /kaydet/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          title: 'Test News Title',
          summary: 'Test news summary',
          content: 'Test news content',
          featured_image_id: null,
          category: '',
          tags: [],
          status: 'draft',
          published_at: null,
        });
      });
    });

    it('validates required fields with compact error display', async () => {
      render(<NewsForm {...defaultProps} />);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /kaydet/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Check for error messages with compact styling
        const errorMessages = screen.getAllByText(/gerekli/i);
        expect(errorMessages.length).toBeGreaterThan(0);

        // Error text should have compact styling
        errorMessages.forEach(error => {
          expect(error).toHaveClass('text-xs');
        });
      });
    });

    it('handles media picker integration with compact layout', async () => {
      render(<NewsForm {...defaultProps} />);

      // Open media picker
      const mediaButton = screen.getByText(/görsel seç/i);
      await user.click(mediaButton);

      // Media picker dialog should open
      expect(screen.getByTestId('media-picker-dialog')).toBeInTheDocument();

      // Select an image
      const selectButton = screen.getByText('Select Test Image');
      await user.click(selectButton);

      // Dialog should close and image should be selected
      await waitFor(() => {
        expect(screen.queryByTestId('media-picker-dialog')).not.toBeInTheDocument();
      });
    });

    it('maintains form state during validation errors', async () => {
      render(<NewsForm {...defaultProps} />);

      // Fill some fields
      await user.type(screen.getByLabelText(/başlık/i), 'Test Title');
      await user.type(screen.getByLabelText(/özet/i), 'Test Summary');

      // Submit with missing required content
      const submitButton = screen.getByRole('button', { name: /kaydet/i });
      await user.click(submitButton);

      // Form should maintain filled values
      expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Summary')).toBeInTheDocument();
    });
  });

  describe('PollFormFields Integration', () => {
    const mockData = {
      question: '',
      description: '',
      options: [{ text: '', votes: 0 }, { text: '', votes: 0 }],
      settings: {
        multiple_choice: false,
        allow_other: false,
        requires_auth: true,
        show_results: 'after_vote',
        end_date: null,
      },
    };

    const mockOnChange = jest.fn();

    beforeEach(() => {
      mockOnChange.mockClear();
    });

    it('renders poll form with compact inputs', () => {
      render(<PollFormFields data={mockData} onChange={mockOnChange} />);

      // Check form elements
      expect(screen.getByLabelText(/soru/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/açıklama/i)).toBeInTheDocument();

      // Verify compact styling
      const questionInput = screen.getByLabelText(/soru/i);
      expect(questionInput).toHaveClass('px-3', 'py-1.5');
    });

    it('handles poll options with compact input styling', async () => {
      render(<PollFormFields data={mockData} onChange={mockOnChange} />);

      // Find option inputs
      const optionInputs = screen.getAllByPlaceholderText(/seçenek/i);
      expect(optionInputs).toHaveLength(2);

      // Each option should have compact styling
      optionInputs.forEach(input => {
        expect(input).toHaveClass('px-3', 'py-1.5');
      });

      // Fill first option
      await user.type(optionInputs[0], 'Option 1');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('adds and removes poll options with proper spacing', async () => {
      render(<PollFormFields data={mockData} onChange={mockOnChange} />);

      // Find add option button
      const addButton = screen.getByText(/seçenek ekle/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.arrayContaining([
              expect.any(Object),
              expect.any(Object),
              expect.any(Object), // Third option added
            ]),
          })
        );
      });

      // Check that new option has compact spacing
      const optionInputs = screen.getAllByPlaceholderText(/seçenek/i);
      expect(optionInputs).toHaveLength(3);
    });

    it('validates poll form with compact error display', async () => {
      const invalidData = {
        ...mockData,
        question: '', // Empty required field
      };

      render(<PollFormFields data={invalidData} onChange={mockOnChange} />);

      // Submit form (simulate validation trigger)
      const questionInput = screen.getByLabelText(/soru/i);
      fireEvent.blur(questionInput);

      // Error styling should be compact
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/gerekli/i);
        errorElements.forEach(error => {
          expect(error).toHaveClass('text-xs');
        });
      });
    });

    it('handles poll settings with compact toggle styling', async () => {
      render(<PollFormFields data={mockData} onChange={mockOnChange} />);

      // Find settings toggles
      const multipleChoiceToggle = screen.getByLabelText(/çoklu seçim/i);
      const authRequiredToggle = screen.getByLabelText(/giriş gerekli/i);

      // Toggles should be present and styled
      expect(multipleChoiceToggle).toBeInTheDocument();
      expect(authRequiredToggle).toBeInTheDocument();

      // Toggle multiple choice
      await user.click(multipleChoiceToggle);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: expect.objectContaining({
              multiple_choice: true,
            }),
          })
        );
      });
    });
  });

  describe('Form Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('adapts form layout for mobile screens', () => {
      render(<NewsForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);

      // Form should be responsive
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Inputs should maintain mobile touch targets
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input);
        const minHeight = parseInt(computedStyle.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('maintains proper spacing in compact form layouts', () => {
      render(<NewsForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);

      // Form should use compact spacing
      const formContainer = screen.getByRole('form').parentElement;
      expect(formContainer).toHaveClass('space-y-3');
    });
  });

  describe('Performance and Accessibility', () => {
    it('maintains focus management in compact forms', async () => {
      render(<NewsForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);

      const titleInput = screen.getByLabelText(/başlık/i);
      const summaryInput = screen.getByLabelText(/özet/i);

      // Focus should move properly between fields
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);

      await user.tab();
      expect(document.activeElement).toBe(summaryInput);
    });

    it('provides proper ARIA labels for compact form elements', () => {
      render(<NewsForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);

      // All form inputs should have proper labels
      const titleInput = screen.getByLabelText(/başlık/i);
      const summaryInput = screen.getByLabelText(/özet/i);
      const contentInput = screen.getByLabelText(/içerik/i);

      expect(titleInput).toHaveAttribute('aria-label');
      expect(summaryInput).toHaveAttribute('aria-label');
      expect(contentInput).toHaveAttribute('aria-label');
    });

    it('handles form submission loading states', async () => {
      const onSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<NewsForm onSubmit={onSubmit} onCancel={jest.fn()} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /kaydet/i });

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();

      // Should show loading state
      expect(submitButton).toHaveTextContent(/kaydediliyor/i);
    });
  });
});