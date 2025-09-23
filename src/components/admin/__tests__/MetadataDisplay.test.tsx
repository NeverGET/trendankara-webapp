/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MetadataDisplay } from '../MetadataDisplay';
import type { StreamMetadata } from '@/types/radioSettings';

// Mock the UI components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, title, className }: any) => (
    <div data-testid="card" className={className}>
      {typeof title === 'string' ? (
        <div data-testid="card-title">{title}</div>
      ) : (
        <div data-testid="card-title-complex">{title}</div>
      )}
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant, size, animated, pill }: any) => (
    <span
      data-testid="badge"
      data-variant={variant}
      data-size={size}
      data-animated={animated}
      data-pill={pill}
    >
      {children}
    </span>
  )
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock fetch for polling tests
global.fetch = jest.fn();

describe('MetadataDisplay', () => {
  const mockStreamMetadata: StreamMetadata = {
    streamTitle: 'Rock FM - Classic Rock Mix',
    bitrate: 128,
    audioFormat: 'MP3',
    serverInfo: {
      software: 'Icecast',
      version: '2.4.4',
      description: 'Rock FM Streaming Server'
    },
    extra: {
      genre: 'Rock',
      contentType: 'audio/mpeg',
      sampleRate: 44100,
      channels: 2,
      url: 'https://stream.example.com/rock'
    }
  };

  const mockMinimalMetadata: StreamMetadata = {
    streamTitle: 'Simple Stream'
  };

  const mockServerOnlyMetadata: StreamMetadata = {
    serverInfo: {
      software: 'Shoutcast',
      version: '2.5.1'
    }
  };

  const mockExtraOnlyMetadata: StreamMetadata = {
    extra: {
      genre: 'Jazz',
      sampleRate: 48000
    }
  };

  const defaultProps = {
    metadata: mockStreamMetadata,
    className: undefined,
    loading: false,
    streamUrl: undefined,
    isPreviewActive: false,
    pollingInterval: 5000,
    onMetadataUpdate: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering - Requirements 4.2, 4.3', () => {
    it('renders with complete metadata', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title-complex')).toBeInTheDocument();
      expect(screen.getByText('Rock FM - Classic Rock Mix')).toBeInTheDocument();
      expect(screen.getByText('128 kbps')).toBeInTheDocument();
      expect(screen.getByText('Icecast')).toBeInTheDocument();
    });

    it('renders with minimal metadata', () => {
      render(<MetadataDisplay {...defaultProps} metadata={mockMinimalMetadata} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Simple Stream')).toBeInTheDocument();
      expect(screen.queryByText('Icecast')).not.toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<MetadataDisplay {...defaultProps} className="custom-class" />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('renders loading state', () => {
      render(<MetadataDisplay {...defaultProps} loading={true} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toHaveTextContent('Stream Metadata');

      // Check for loading skeleton elements
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('No Metadata Display - Requirement 4.5', () => {
    it('displays Turkish "no metadata" message when metadata is undefined', () => {
      render(<MetadataDisplay {...defaultProps} metadata={undefined} />);

      expect(screen.getByText('Metadata bilgisi mevcut değil')).toBeInTheDocument();
      expect(screen.getByText('📡')).toBeInTheDocument();
    });

    it('displays Turkish "no metadata" message when metadata is empty', () => {
      render(<MetadataDisplay {...defaultProps} metadata={{}} />);

      expect(screen.getByText('Metadata bilgisi mevcut değil')).toBeInTheDocument();
      expect(screen.getByText('📡')).toBeInTheDocument();
    });

    it('displays "no detailed metadata" message when object has no useful fields', () => {
      const emptyDetailedMetadata: StreamMetadata = {
        serverInfo: {},
        extra: {}
      };

      render(<MetadataDisplay {...defaultProps} metadata={emptyDetailedMetadata} />);

      expect(screen.getByText('Detaylı metadata bilgisi mevcut değil')).toBeInTheDocument();
    });
  });

  describe('Stream Information Section - Requirements 4.2, 4.3', () => {
    it('displays stream title with live indicator', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Stream Bilgisi')).toBeInTheDocument();
      expect(screen.getByText('Mevcut İçerik')).toBeInTheDocument();
      expect(screen.getByText('Rock FM - Classic Rock Mix')).toBeInTheDocument();

      const playingBadge = screen.getAllByTestId('badge').find(badge =>
        badge.textContent === 'Çalıyor'
      );
      expect(playingBadge).toBeInTheDocument();
      expect(playingBadge).toHaveAttribute('data-variant', 'success');
    });

    it('displays bitrate information with icon', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Bitrate')).toBeInTheDocument();
      expect(screen.getByText('128 kbps')).toBeInTheDocument();
      expect(screen.getByText('♪')).toBeInTheDocument();
    });

    it('displays audio format with badge', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Audio Format')).toBeInTheDocument();

      const formatBadge = screen.getAllByTestId('badge').find(badge =>
        badge.textContent === 'MP3'
      );
      expect(formatBadge).toBeInTheDocument();
      expect(formatBadge).toHaveAttribute('data-variant', 'info');
    });

    it('handles missing stream information gracefully', () => {
      const metadataWithoutStreamInfo: StreamMetadata = {
        serverInfo: {
          software: 'Icecast'
        }
      };

      render(<MetadataDisplay {...defaultProps} metadata={metadataWithoutStreamInfo} />);

      expect(screen.queryByText('Stream Bilgisi')).not.toBeInTheDocument();
      expect(screen.queryByText('Mevcut İçerik')).not.toBeInTheDocument();
    });
  });

  describe('Server Information Section - Requirement 4.2', () => {
    it('displays server software and version', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Server Bilgisi')).toBeInTheDocument();
      expect(screen.getByText('Server Tipi')).toBeInTheDocument();
      expect(screen.getByText('Icecast')).toBeInTheDocument();
      expect(screen.getByText('🖥️')).toBeInTheDocument();

      const versionBadge = screen.getAllByTestId('badge').find(badge =>
        badge.textContent === 'v2.4.4'
      );
      expect(versionBadge).toBeInTheDocument();
      expect(versionBadge).toHaveAttribute('data-variant', 'purple');
    });

    it('displays server description when available', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Açıklama')).toBeInTheDocument();
      expect(screen.getByText('Rock FM Streaming Server')).toBeInTheDocument();
    });

    it('handles server info without version', () => {
      const metadataWithoutVersion: StreamMetadata = {
        serverInfo: {
          software: 'Shoutcast',
          description: 'Test Server'
        }
      };

      render(<MetadataDisplay {...defaultProps} metadata={metadataWithoutVersion} />);

      expect(screen.getByText('Shoutcast')).toBeInTheDocument();
      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.queryByText(/^v/)).not.toBeInTheDocument();
    });

    it('renders server-only metadata correctly', () => {
      render(<MetadataDisplay {...defaultProps} metadata={mockServerOnlyMetadata} />);

      expect(screen.getByText('Server Bilgisi')).toBeInTheDocument();
      expect(screen.getByText('Shoutcast')).toBeInTheDocument();
      expect(screen.queryByText('Stream Bilgisi')).not.toBeInTheDocument();
    });
  });

  describe('Technical Details Section - Requirement 4.2', () => {
    it('displays technical metadata with proper formatting', () => {
      render(<MetadataDisplay {...defaultProps} />);

      expect(screen.getByText('Teknik Detaylar')).toBeInTheDocument();
      expect(screen.getByText('Tür')).toBeInTheDocument();
      expect(screen.getByText('İçerik Tipi')).toBeInTheDocument();
      expect(screen.getByText('Sample Rate')).toBeInTheDocument();
      expect(screen.getByText('Kanallar')).toBeInTheDocument();

      // Check specific values
      const genreBadge = screen.getAllByTestId('badge').find(badge =>
        badge.textContent === 'Rock'
      );
      expect(genreBadge).toHaveAttribute('data-variant', 'pink');

      expect(screen.getByText('audio/mpeg')).toBeInTheDocument();
      expect(screen.getByText('44100 Hz')).toBeInTheDocument();
      expect(screen.getByText('2 kanal')).toBeInTheDocument();
    });

    it('handles partial technical details', () => {
      const partialExtraMetadata: StreamMetadata = {
        extra: {
          genre: 'Jazz',
          sampleRate: 48000
          // Missing contentType and channels
        }
      };

      render(<MetadataDisplay {...defaultProps} metadata={partialExtraMetadata} />);

      expect(screen.getByText('Jazz')).toBeInTheDocument();
      expect(screen.getByText('48000 Hz')).toBeInTheDocument();
      expect(screen.queryByText('İçerik Tipi')).not.toBeInTheDocument();
      expect(screen.queryByText('kanal')).not.toBeInTheDocument();
    });

    it('renders extra-only metadata correctly', () => {
      render(<MetadataDisplay {...defaultProps} metadata={mockExtraOnlyMetadata} />);

      expect(screen.getByText('Teknik Detaylar')).toBeInTheDocument();
      expect(screen.getByText('Jazz')).toBeInTheDocument();
      expect(screen.queryByText('Stream Bilgisi')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates - Requirement 4.4', () => {
    it('displays polling indicator when preview is active', () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      expect(screen.getByText('Canlı güncelleme')).toBeInTheDocument();

      // Check for polling indicator dot
      const pollingDots = document.querySelectorAll('.animate-pulse');
      expect(pollingDots.length).toBeGreaterThan(0);
    });

    it('does not display polling indicator when preview is inactive', () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={false}
        streamUrl="https://stream.example.com"
      />);

      expect(screen.queryByText('Canlı güncelleme')).not.toBeInTheDocument();
    });

    it('starts polling when preview becomes active', async () => {
      const mockResponse = {
        success: true,
        metadata: {
          streamTitle: 'Updated Stream Title'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        pollingInterval={1000}
      />);

      // Should fetch immediately when preview starts
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/radio/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamUrl: 'https://stream.example.com',
          timeout: 3000,
        }),
      });

      // Advance timers to trigger polling
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('stops polling when preview becomes inactive', async () => {
      const { rerender } = render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        pollingInterval={1000}
      />);

      // Stop preview
      rerender(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={false}
        streamUrl="https://stream.example.com"
        pollingInterval={1000}
      />);

      const fetchCallsBeforeTimer = (global.fetch as jest.Mock).mock.calls.length;

      // Advance timers - no new calls should be made
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(fetchCallsBeforeTimer);
    });

    it('updates metadata when polling receives new data', async () => {
      const mockResponse = {
        success: true,
        metadata: {
          streamTitle: 'New Song Playing'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const onMetadataUpdate = jest.fn();

      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        onMetadataUpdate={onMetadataUpdate}
      />);

      await waitFor(() => {
        expect(onMetadataUpdate).toHaveBeenCalledWith({
          streamTitle: 'New Song Playing'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('New Song Playing')).toBeInTheDocument();
      });
    });

    it('displays last update timestamp', async () => {
      const mockResponse = {
        success: true,
        metadata: {
          streamTitle: 'Updated Content'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      await waitFor(() => {
        expect(screen.getByText(/Son güncelleme:/)).toBeInTheDocument();
      });
    });

    it('handles polling errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Metadata polling error:', expect.any(Error));
      }, { timeout: 3000 });

      // Check for error message in the polling error display
      await waitFor(() => {
        expect(screen.getByText(/Güncelleme hatası/)).toBeInTheDocument();
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });

    it('shows live badge when polling is active', () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      const liveBadge = screen.getAllByTestId('badge').find(badge =>
        badge.textContent === 'Canlı'
      );
      expect(liveBadge).toBeInTheDocument();
      expect(liveBadge).toHaveAttribute('data-animated', 'true');
    });
  });

  describe('Polling Configuration', () => {
    it('respects custom polling interval', async () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        pollingInterval={2000}
      />);

      const initialCalls = (global.fetch as jest.Mock).mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(initialCalls + 1);
    });

    it('does not poll when interval is 0', async () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        pollingInterval={0}
      />);

      const initialCalls = (global.fetch as jest.Mock).mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Should only have the initial call, no polling
      expect(global.fetch).toHaveBeenCalledTimes(initialCalls);
    });

    it('does not poll when no streamUrl is provided', async () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl={undefined}
      />);

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Turkish Language Display', () => {
    it('displays all Turkish labels correctly', () => {
      render(<MetadataDisplay {...defaultProps} />);

      // Section headers
      expect(screen.getByText('Stream Bilgisi')).toBeInTheDocument();
      expect(screen.getByText('Server Bilgisi')).toBeInTheDocument();
      expect(screen.getByText('Teknik Detaylar')).toBeInTheDocument();

      // Field labels
      expect(screen.getByText('Mevcut İçerik')).toBeInTheDocument();
      expect(screen.getByText('Server Tipi')).toBeInTheDocument();
      expect(screen.getByText('Açıklama')).toBeInTheDocument();
      expect(screen.getByText('Tür')).toBeInTheDocument();
      expect(screen.getByText('İçerik Tipi')).toBeInTheDocument();
      expect(screen.getByText('Kanallar')).toBeInTheDocument();

      // Status messages
      expect(screen.getByText('Çalıyor')).toBeInTheDocument();
    });

    it('displays Turkish error messages', () => {
      render(<MetadataDisplay {...defaultProps} metadata={undefined} />);

      expect(screen.getByText('Metadata bilgisi mevcut değil')).toBeInTheDocument();
    });

    it('displays Turkish polling messages', () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      expect(screen.getByText('Canlı güncelleme')).toBeInTheDocument();
    });
  });

  describe('Component Styling', () => {
    it('applies polling ring effect when active', () => {
      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('ring-1 ring-green-500/20');
    });

    it('applies gradient background', () => {
      render(<MetadataDisplay {...defaultProps} />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-gradient-to-br');
      expect(card.className).toContain('from-dark-surface-primary');
    });

    it('includes transition classes', () => {
      render(<MetadataDisplay {...defaultProps} />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-300');
    });
  });

  describe('Component Props Interface', () => {
    it('accepts minimal required props', () => {
      expect(() => {
        render(<MetadataDisplay />);
      }).not.toThrow();
    });

    it('handles all optional props correctly', () => {
      const onMetadataUpdate = jest.fn();

      expect(() => {
        render(
          <MetadataDisplay
            metadata={mockStreamMetadata}
            className="test-class"
            loading={false}
            streamUrl="https://test.com"
            isPreviewActive={true}
            pollingInterval={3000}
            onMetadataUpdate={onMetadataUpdate}
          />
        );
      }).not.toThrow();
    });

    it('triggers onMetadataUpdate callback when polling receives new data', async () => {
      const mockResponse = {
        success: true,
        metadata: {
          streamTitle: 'Updated via Polling'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const onMetadataUpdate = jest.fn();

      render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
        onMetadataUpdate={onMetadataUpdate}
      />);

      // Wait for polling to trigger callback
      await waitFor(() => {
        expect(onMetadataUpdate).toHaveBeenCalledWith({
          streamTitle: 'Updated via Polling'
        });
      }, { timeout: 3000 });
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('cleans up polling interval on unmount', async () => {
      const { unmount } = render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com"
      />);

      const initialCalls = (global.fetch as jest.Mock).mock.calls.length;

      unmount();

      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // No additional calls should be made after unmount
      expect(global.fetch).toHaveBeenCalledTimes(initialCalls);
    });

    it('cleans up polling when dependencies change', async () => {
      const { rerender } = render(<MetadataDisplay
        {...defaultProps}
        isPreviewActive={true}
        streamUrl="https://stream.example.com/stream1"
        pollingInterval={1000}
      />);

      // Change stream URL
      await act(async () => {
        rerender(<MetadataDisplay
          {...defaultProps}
          isPreviewActive={true}
          streamUrl="https://stream.example.com/stream2"
          pollingInterval={1000}
        />);
      });

      // Should call with new URL
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/radio/metadata',
        expect.objectContaining({
          body: JSON.stringify({
            streamUrl: 'https://stream.example.com/stream2',
            timeout: 3000,
          })
        })
      );
    });
  });
});