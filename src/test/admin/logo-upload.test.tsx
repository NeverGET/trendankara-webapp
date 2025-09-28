/**
 * Logo Upload Functionality Test for Admin Settings
 * Tests MediaPickerDialog integration in MobileSettingsForm and verifies
 * that logos are properly saved to the mobile_settings JSON column
 *
 * Requirements: 6.1, 6.5, 6.6, 6.7 - Mobile app restructure logo upload functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileSettingsForm } from '@/components/admin/mobile/MobileSettingsForm';
import { MobileSettingsQueries } from '@/lib/queries/mobileSettingsQueries';
import { db } from '@/lib/db/client';
import type { MobileSettings } from '@/types/mobile';
import { RowDataPacket } from 'mysql2';

// Mock the MediaPickerDialog component
jest.mock('@/components/admin/MediaPickerDialog', () => ({
  MediaPickerDialog: ({ isOpen, onSelect, onClose }: any) => (
    isOpen ? (
      <div data-testid="media-picker-dialog">
        <h3>Media Picker Dialog</h3>
        <button
          data-testid="select-test-logo"
          onClick={() => {
            onSelect({
              id: 123,
              url: '/uploads/test-logo.png',
              filename: 'test-logo.png',
              mime_type: 'image/png',
              size: 1024,
              created_at: new Date().toISOString()
            });
            onClose();
          }}
        >
          Select Test Logo
        </button>
        <button
          data-testid="select-alternative-logo"
          onClick={() => {
            onSelect({
              id: 456,
              url: '/uploads/alternative-logo.jpg',
              filename: 'alternative-logo.jpg',
              mime_type: 'image/jpeg',
              size: 2048,
              created_at: new Date().toISOString()
            });
            onClose();
          }}
        >
          Select Alternative Logo
        </button>
        <button data-testid="cancel-selection" onClick={onClose}>Cancel</button>
      </div>
    ) : null
  )
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Logo Upload Functionality Tests', () => {
  const user = userEvent.setup();

  // Test data setup
  const mockSettings: MobileSettings = {
    showOnlyLastActivePoll: true,
    maxNewsCount: 100,
    enablePolls: true,
    enableNews: true,
    playerLogoUrl: undefined,
    cardDisplayMode: 'grid',
    maxFeaturedCards: 5,
    enableCardAnimation: true,
    maintenanceMode: false,
    minimumAppVersion: '1.0.0',
    forceUpdate: false
  };

  const mockOnSave = jest.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    mockOnSave.mockClear();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe('Logo Upload Field Rendering', () => {
    it('should render the logo upload field in mobile settings form', () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      fireEvent.click(playerTab);

      // Check if logo upload field is present
      expect(screen.getByLabelText(/oynatıcı logosu/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/logo\.png/i)).toBeInTheDocument();

      // Check if media picker button is present
      const mediaPickerButton = screen.getByRole('button', { name: '' }); // Button with Image icon
      expect(mediaPickerButton).toBeInTheDocument();
    });

    it('should show current logo URL if one is set', () => {
      const settingsWithLogo = {
        ...mockSettings,
        playerLogoUrl: '/uploads/existing-logo.png'
      };

      render(
        <MobileSettingsForm
          settings={settingsWithLogo}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      fireEvent.click(playerTab);

      // Check if existing logo URL is displayed
      const logoInput = screen.getByDisplayValue('/uploads/existing-logo.png');
      expect(logoInput).toBeInTheDocument();
    });

    it('should display logo preview when URL is provided', () => {
      const settingsWithLogo = {
        ...mockSettings,
        playerLogoUrl: '/uploads/existing-logo.png'
      };

      render(
        <MobileSettingsForm
          settings={settingsWithLogo}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      fireEvent.click(playerTab);

      // Check if logo preview is displayed
      const logoPreview = screen.getByAltText('Logo Önizleme');
      expect(logoPreview).toBeInTheDocument();
      expect(logoPreview).toHaveAttribute('src', '/uploads/existing-logo.png');
    });
  });

  describe('MediaPickerDialog Integration', () => {
    it('should open MediaPickerDialog when media picker button is clicked', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      // Click the media picker button (Image icon button)
      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      // Verify MediaPickerDialog opens
      await waitFor(() => {
        expect(screen.getByTestId('media-picker-dialog')).toBeInTheDocument();
        expect(screen.getByText('Media Picker Dialog')).toBeInTheDocument();
      });
    });

    it('should close MediaPickerDialog when cancel is clicked', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and open media picker
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      // Cancel selection
      const cancelButton = screen.getByTestId('cancel-selection');
      await user.click(cancelButton);

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByTestId('media-picker-dialog')).not.toBeInTheDocument();
      });
    });

    it('should select logo and update the URL field', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and open media picker
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      // Select a logo
      const selectButton = screen.getByTestId('select-test-logo');
      await user.click(selectButton);

      // Verify dialog closes and URL is updated
      await waitFor(() => {
        expect(screen.queryByTestId('media-picker-dialog')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('/uploads/test-logo.png')).toBeInTheDocument();
      });
    });

    it('should update logo preview after selection', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and open media picker
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      // Select a logo
      const selectButton = screen.getByTestId('select-test-logo');
      await user.click(selectButton);

      // Verify logo preview is updated
      await waitFor(() => {
        const logoPreview = screen.getByAltText('Logo Önizleme');
        expect(logoPreview).toBeInTheDocument();
        expect(logoPreview).toHaveAttribute('src', '/uploads/test-logo.png');
      });
    });
  });

  describe('Logo URL Saving to Database', () => {
    it('should save logo URL to mobile_settings when form is submitted', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and set logo
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      const selectButton = screen.getByTestId('select-test-logo');
      await user.click(selectButton);

      // Submit the form
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
        expect(saveButton).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
      await user.click(saveButton);

      // Verify onSave was called with the logo URL
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            playerLogoUrl: '/uploads/test-logo.png'
          })
        );
      });
    });

    it('should handle manual logo URL entry', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      // Manually enter logo URL
      const logoInput = screen.getByLabelText(/oynatıcı logosu/i);
      await user.clear(logoInput);
      await user.type(logoInput, 'https://example.com/manual-logo.jpg');

      // Submit the form
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
        expect(saveButton).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
      await user.click(saveButton);

      // Verify onSave was called with the manually entered URL
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            playerLogoUrl: 'https://example.com/manual-logo.jpg'
          })
        );
      });
    });

    it('should clear logo URL when input is emptied', async () => {
      const settingsWithLogo = {
        ...mockSettings,
        playerLogoUrl: '/uploads/existing-logo.png'
      };

      render(
        <MobileSettingsForm
          settings={settingsWithLogo}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      // Clear the logo URL
      const logoInput = screen.getByDisplayValue('/uploads/existing-logo.png');
      await user.clear(logoInput);

      // Submit the form
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
        expect(saveButton).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
      await user.click(saveButton);

      // Verify onSave was called with undefined logo URL
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            playerLogoUrl: undefined
          })
        );
      });
    });
  });

  describe('Form State Management', () => {
    it('should enable save button when logo URL changes', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Initially save button should be disabled (no changes)
      const saveButton = screen.getByRole('button', { name: /değişiklikleri kaydet/i });
      expect(saveButton).toBeDisabled();

      // Navigate to Player tab and add logo
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      const selectButton = screen.getByTestId('select-test-logo');
      await user.click(selectButton);

      // Save button should now be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should show unsaved changes warning when logo is modified', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and add logo
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const logoInput = screen.getByLabelText(/oynatıcı logosu/i);
      await user.type(logoInput, 'https://example.com/logo.png');

      // Check for unsaved changes warning
      await waitFor(() => {
        expect(screen.getByText(/kaydedilmemiş değişiklikler/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle broken logo preview gracefully', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab and add logo
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const logoInput = screen.getByLabelText(/oynatıcı logosu/i);
      await user.type(logoInput, 'https://invalid-url.com/broken-image.jpg');

      // Wait for preview to be created
      await waitFor(() => {
        const logoPreview = screen.getByAltText('Logo Önizleme');
        expect(logoPreview).toBeInTheDocument();
      });

      // Simulate image load error
      const logoPreview = screen.getByAltText('Logo Önizleme');
      fireEvent.error(logoPreview);

      // Preview should be hidden
      expect(logoPreview).toHaveStyle({ display: 'none' });
    });

    it('should disable media picker button when form is loading', () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={true}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      fireEvent.click(playerTab);

      // Media picker button should be disabled
      const mediaPickerButton = screen.getByRole('button', { name: '' });
      expect(mediaPickerButton).toBeDisabled();
    });

    it('should disable logo input when form is saving', async () => {
      const { rerender } = render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      const logoInput = screen.getByLabelText(/oynatıcı logosu/i);
      expect(logoInput).not.toBeDisabled();

      // Rerender with saving state
      rerender(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={true}
        />
      );

      // Logo input should be disabled
      expect(logoInput).toBeDisabled();
    });
  });

  describe('Multiple Logo Selection', () => {
    it('should handle selecting different logos consecutively', async () => {
      render(
        <MobileSettingsForm
          settings={mockSettings}
          onSave={mockOnSave}
          isLoading={false}
        />
      );

      // Navigate to Player tab
      const playerTab = screen.getByText('Oynatıcı');
      await user.click(playerTab);

      // Select first logo
      const mediaPickerButton = screen.getByRole('button', { name: '' });
      await user.click(mediaPickerButton);

      const selectFirstLogo = screen.getByTestId('select-test-logo');
      await user.click(selectFirstLogo);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/uploads/test-logo.png')).toBeInTheDocument();
      });

      // Select second logo
      await user.click(mediaPickerButton);
      const selectSecondLogo = screen.getByTestId('select-alternative-logo');
      await user.click(selectSecondLogo);

      // Verify second logo URL replaces the first
      await waitFor(() => {
        expect(screen.getByDisplayValue('/uploads/alternative-logo.jpg')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('/uploads/test-logo.png')).not.toBeInTheDocument();
      });
    });
  });
});

/**
 * Database Integration Tests
 * Tests actual database operations for logo URL storage
 */
describe('Logo Database Integration Tests', () => {
  beforeAll(async () => {
    // Initialize database connection for integration tests
    try {
      await Promise.race([
        db.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
        )
      ]);
    } catch (error) {
      console.warn('Database not available for integration tests:', error);
      return;
    }
  });

  afterAll(async () => {
    // Clean up test data if database is available
    try {
      if (db) {
        await db.close();
      }
    } catch (error) {
      console.warn('Database cleanup failed:', error);
    }
  });

  it('should save logo URL to player_config in mobile_settings table', async () => {
    // Skip if database is not available
    try {
      await db.query('SELECT 1');
    } catch (error) {
      console.log('Skipping database integration test - database not available');
      return;
    }

    const testLogoUrl = '/uploads/integration-test-logo.png';
    const userId = 1;

    // Update player settings with logo URL
    const success = await MobileSettingsQueries.upsert(
      'player',
      { playerLogoUrl: testLogoUrl },
      userId
    );

    expect(success).toBe(true);

    // Verify the logo URL was saved correctly
    const playerSettings = await MobileSettingsQueries.getByKey('player');
    expect(playerSettings).toBeDefined();
    expect(playerSettings.playerLogoUrl).toBe(testLogoUrl);

    // Verify through combined settings
    const combinedSettings = await MobileSettingsQueries.getCombinedSettings();
    expect(combinedSettings.playerLogoUrl).toBe(testLogoUrl);

    // Clean up test data
    await MobileSettingsQueries.upsert(
      'player',
      { playerLogoUrl: null },
      userId
    );
  });

  it('should handle logo URL updates correctly', async () => {
    // Skip if database is not available
    try {
      await db.query('SELECT 1');
    } catch (error) {
      console.log('Skipping database integration test - database not available');
      return;
    }

    const firstLogoUrl = '/uploads/first-logo.png';
    const secondLogoUrl = '/uploads/second-logo.jpg';
    const userId = 1;

    // Set first logo
    await MobileSettingsQueries.upsert(
      'player',
      { playerLogoUrl: firstLogoUrl },
      userId
    );

    let playerSettings = await MobileSettingsQueries.getByKey('player');
    expect(playerSettings.playerLogoUrl).toBe(firstLogoUrl);

    // Update to second logo
    await MobileSettingsQueries.upsert(
      'player',
      { playerLogoUrl: secondLogoUrl },
      userId
    );

    playerSettings = await MobileSettingsQueries.getByKey('player');
    expect(playerSettings.playerLogoUrl).toBe(secondLogoUrl);

    // Clean up test data
    await MobileSettingsQueries.upsert(
      'player',
      { playerLogoUrl: null },
      userId
    );
  });

  it('should maintain other player settings when updating logo URL', async () => {
    // Skip if database is not available
    try {
      await db.query('SELECT 1');
    } catch (error) {
      console.log('Skipping database integration test - database not available');
      return;
    }

    const userId = 1;

    // Get initial player settings
    const initialSettings = await MobileSettingsQueries.getByKey('player') || {};

    // Update only the logo URL
    const testLogoUrl = '/uploads/maintain-settings-test.png';
    await MobileSettingsQueries.upsert(
      'player',
      { ...initialSettings, playerLogoUrl: testLogoUrl },
      userId
    );

    // Verify logo URL was updated but other settings preserved
    const updatedSettings = await MobileSettingsQueries.getByKey('player');
    expect(updatedSettings.playerLogoUrl).toBe(testLogoUrl);

    // Verify other settings remain unchanged (if they existed)
    if (initialSettings.streamUrl) {
      expect(updatedSettings.streamUrl).toBe(initialSettings.streamUrl);
    }

    // Clean up test data
    await MobileSettingsQueries.upsert(
      'player',
      { ...initialSettings, playerLogoUrl: null },
      userId
    );
  });
});