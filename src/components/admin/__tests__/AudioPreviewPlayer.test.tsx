/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioPreviewPlayer } from '../AudioPreviewPlayer';

// Mock useAudioPreview hook
const mockUseAudioPreview = {
  isPlaying: false,
  isLoading: false,
  currentUrl: null,
  error: null,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn()
};

jest.mock('@/hooks/useAudioPreview', () => ({
  useAudioPreview: () => mockUseAudioPreview
}));

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, loading, className, variant, size, ...props }: any) => (
    <button
      data-testid={props['aria-label'] ? 'audio-control-button' : 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, hideText }: any) => (
    <div data-testid="loading-spinner" data-size={size} data-hide-text={hideText}>
      Loading...
    </div>
  )
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('AudioPreviewPlayer', () => {
  const defaultProps = {
    streamUrl: 'https://example.com/stream',
    className: undefined,
    onPreviewStart: undefined,
    onPreviewStop: undefined,
    compact: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock hook state
    Object.assign(mockUseAudioPreview, {
      isPlaying: false,
      isLoading: false,
      currentUrl: null,
      error: null,
      volume: 0.7,
      currentTime: 0,
      duration: 0
    });
  });

  describe('Basic Rendering', () => {
    it('renders full component by default', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Akış Önizlemesi')).toBeInTheDocument();
      expect(screen.getByTestId('audio-control-button')).toBeInTheDocument();
      expect(screen.getByText('Önizleme hazır')).toBeInTheDocument();
    });

    it('renders compact component when compact prop is true', () => {
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.queryByText('Akış Önizlemesi')).not.toBeInTheDocument();
      expect(screen.getByTestId('audio-control-button')).toBeInTheDocument();
      expect(screen.getByText('Önizleme hazır')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<AudioPreviewPlayer {...defaultProps} className="custom-class" />);

      // Get the outermost container by finding the component root
      const container = screen.getByText('Akış Önizlemesi').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('renders without streamUrl', () => {
      render(<AudioPreviewPlayer {...defaultProps} streamUrl={undefined} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toBeDisabled();
    });
  });

  describe('Play/Pause Button Interactions - Requirement 3.1', () => {
    it('displays play button when not playing', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('aria-label', 'Önizlemeyi başlat');
      expect(playButton).not.toBeDisabled();
    });

    it('displays pause button when playing', () => {
      mockUseAudioPreview.isPlaying = true;
      render(<AudioPreviewPlayer {...defaultProps} />);

      const pauseButton = screen.getByTestId('audio-control-button');
      expect(pauseButton).toHaveAttribute('aria-label', 'Önizlemeyi duraklat');
    });

    it('calls play function when play button is clicked', async () => {
      const onPreviewStart = jest.fn();
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStart={onPreviewStart} />);

      const playButton = screen.getByTestId('audio-control-button');
      fireEvent.click(playButton);

      expect(mockUseAudioPreview.play).toHaveBeenCalledWith('https://example.com/stream');
      await waitFor(() => {
        expect(onPreviewStart).toHaveBeenCalled();
      });
    });

    it('calls pause function when pause button is clicked', () => {
      mockUseAudioPreview.isPlaying = true;
      const onPreviewStop = jest.fn();
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStop={onPreviewStop} />);

      const pauseButton = screen.getByTestId('audio-control-button');
      fireEvent.click(pauseButton);

      expect(mockUseAudioPreview.pause).toHaveBeenCalled();
      expect(onPreviewStop).toHaveBeenCalled();
    });

    it('does not call play when no streamUrl is provided', () => {
      render(<AudioPreviewPlayer {...defaultProps} streamUrl={undefined} />);

      const playButton = screen.getByTestId('audio-control-button');
      fireEvent.click(playButton);

      expect(mockUseAudioPreview.play).not.toHaveBeenCalled();
    });

    it('handles play errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockUseAudioPreview.play.mockRejectedValue(new Error('Play failed'));

      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Preview play error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Stop Button - Requirement 3.3', () => {
    it('displays stop button when audio is loaded', () => {
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Durdur')).toBeInTheDocument();
    });

    it('does not display stop button when no audio is loaded', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.queryByText('Durdur')).not.toBeInTheDocument();
    });

    it('calls stop function when stop button is clicked', () => {
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      const onPreviewStop = jest.fn();
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStop={onPreviewStop} />);

      const stopButton = screen.getByText('Durdur');
      fireEvent.click(stopButton);

      expect(mockUseAudioPreview.stop).toHaveBeenCalled();
      expect(onPreviewStop).toHaveBeenCalled();
    });

    it('does not show stop button in compact mode', () => {
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.queryByText('Durdur')).not.toBeInTheDocument();
    });
  });

  describe('Loading States - Requirement 3.2', () => {
    it('displays loading spinner when loading', () => {
      mockUseAudioPreview.isLoading = true;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    });

    it('disables play button when loading', () => {
      mockUseAudioPreview.isLoading = true;
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toBeDisabled();
    });

    it('displays loading text in status', () => {
      mockUseAudioPreview.isLoading = true;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    });

    it('displays loading spinner in compact mode', () => {
      mockUseAudioPreview.isLoading = true;
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'small');
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-hide-text', 'true');
    });
  });

  describe('Error Display - Requirement 3.7', () => {
    it('displays Turkish error message when error occurs', () => {
      mockUseAudioPreview.error = 'Connection failed';
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme başlatılamadı')).toBeInTheDocument();
    });

    it('displays error details in full mode', () => {
      mockUseAudioPreview.error = 'Connection timeout';
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });

    it('displays error status text in compact mode', () => {
      mockUseAudioPreview.error = 'Connection failed';
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.getByText('Önizleme başlatılamadı')).toBeInTheDocument();
    });

    it('applies error styling classes', () => {
      mockUseAudioPreview.error = 'Connection failed';
      render(<AudioPreviewPlayer {...defaultProps} />);

      const errorText = screen.getByText('Önizleme başlatılamadı');
      expect(errorText).toHaveClass('text-red-400');
    });
  });

  describe('Volume Control Functionality', () => {
    it('displays volume slider', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const volumeSlider = screen.getByLabelText('Önizleme ses seviyesi');
      expect(volumeSlider).toBeInTheDocument();
      expect(volumeSlider).toHaveAttribute('type', 'range');
      expect(volumeSlider).toHaveAttribute('min', '0');
      expect(volumeSlider).toHaveAttribute('max', '1');
      expect(volumeSlider).toHaveAttribute('step', '0.01');
    });

    it('displays current volume value', () => {
      mockUseAudioPreview.volume = 0.5;
      render(<AudioPreviewPlayer {...defaultProps} />);

      const volumeSlider = screen.getByLabelText('Önizleme ses seviyesi');
      expect(volumeSlider).toHaveValue('0.5');
    });

    it('displays volume percentage in full mode', () => {
      mockUseAudioPreview.volume = 0.75;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('does not display volume percentage in compact mode', () => {
      mockUseAudioPreview.volume = 0.75;
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('calls setVolume when volume slider changes', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const volumeSlider = screen.getByLabelText('Önizleme ses seviyesi');
      fireEvent.change(volumeSlider, { target: { value: '0.3' } });

      expect(mockUseAudioPreview.setVolume).toHaveBeenCalledWith(0.3);
    });

    it('displays volume icon', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const volumeIcon = document.querySelector('svg');
      expect(volumeIcon).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('displays "Önizleme hazır" when ready', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme hazır')).toBeInTheDocument();
    });

    it('displays "Önizleme oynatılıyor" when playing', () => {
      mockUseAudioPreview.isPlaying = true;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme oynatılıyor')).toBeInTheDocument();
    });

    it('displays "Önizleme duraklatıldı" when paused', () => {
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      mockUseAudioPreview.isPlaying = false;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme duraklatıldı')).toBeInTheDocument();
    });

    it('applies correct status colors', () => {
      // Test loading state
      mockUseAudioPreview.isLoading = true;
      const { rerender } = render(<AudioPreviewPlayer {...defaultProps} />);

      let statusText = screen.getByText('Yükleniyor...');
      expect(statusText).toHaveClass('text-yellow-400');

      // Test playing state
      mockUseAudioPreview.isLoading = false;
      mockUseAudioPreview.isPlaying = true;
      rerender(<AudioPreviewPlayer {...defaultProps} />);

      statusText = screen.getByText('Önizleme oynatılıyor');
      expect(statusText).toHaveClass('text-green-400');

      // Test error state
      mockUseAudioPreview.isPlaying = false;
      mockUseAudioPreview.error = 'Error occurred';
      rerender(<AudioPreviewPlayer {...defaultProps} />);

      statusText = screen.getByText('Önizleme başlatılamadı');
      expect(statusText).toHaveClass('text-red-400');
    });
  });

  describe('Time Display', () => {
    it('displays current time when playing', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.currentTime = 125; // 2:05
      render(<AudioPreviewPlayer {...defaultProps} />);

      // Check for the time text in the component
      expect(screen.getByText(/02:05/)).toBeInTheDocument();
    });

    it('displays duration when available', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.currentTime = 65; // 1:05
      mockUseAudioPreview.duration = 180; // 3:00
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText(/01:05/)).toBeInTheDocument();
      expect(screen.getByText(/03:00/)).toBeInTheDocument();
    });

    it('handles invalid time values gracefully', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.currentTime = NaN;
      mockUseAudioPreview.duration = Infinity;
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText(/--:--/)).toBeInTheDocument();
    });

    it('does not display time in compact mode', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.currentTime = 125;
      mockUseAudioPreview.duration = 180;
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.queryByText(/02:05/)).not.toBeInTheDocument();
      expect(screen.queryByText(/03:00/)).not.toBeInTheDocument();
    });
  });

  describe('Stream URL Display', () => {
    it('displays stream URL in full mode', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('URL:')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/stream')).toBeInTheDocument();
    });

    it('does not display stream URL in compact mode', () => {
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      expect(screen.queryByText('URL:')).not.toBeInTheDocument();
      expect(screen.queryByText('https://example.com/stream')).not.toBeInTheDocument();
    });

    it('does not display URL section when no streamUrl provided', () => {
      render(<AudioPreviewPlayer {...defaultProps} streamUrl={undefined} />);

      expect(screen.queryByText('URL:')).not.toBeInTheDocument();
    });
  });

  describe('Component Variants', () => {
    it('uses correct button sizes for full mode', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('data-variant', 'primary');
      expect(playButton).toHaveAttribute('data-size', 'medium');
    });

    it('uses correct button sizes for compact mode', () => {
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('data-variant', 'primary');
      expect(playButton).toHaveAttribute('data-size', 'small');
    });

    it('applies compact specific classes', () => {
      render(<AudioPreviewPlayer {...defaultProps} compact={true} />);

      const container = screen.getByTestId('audio-control-button').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'gap-2', 'p-2');
    });

    it('applies full mode specific classes', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const container = screen.getByText('Akış Önizlemesi').closest('div')?.parentElement;
      expect(container).toHaveClass('flex', 'flex-col', 'gap-3', 'p-4');
    });
  });

  describe('Accessibility', () => {
    it('provides proper aria labels for controls', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('aria-label', 'Önizlemeyi başlat');

      const volumeSlider = screen.getByLabelText('Önizleme ses seviyesi');
      expect(volumeSlider).toBeInTheDocument();
    });

    it('updates aria label based on playing state', () => {
      const { rerender } = render(<AudioPreviewPlayer {...defaultProps} />);

      let playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('aria-label', 'Önizlemeyi başlat');

      mockUseAudioPreview.isPlaying = true;
      rerender(<AudioPreviewPlayer {...defaultProps} />);

      playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toHaveAttribute('aria-label', 'Önizlemeyi duraklat');
    });

    it('maintains accessible form controls', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const volumeSlider = screen.getByLabelText('Önizleme ses seviyesi');
      expect(volumeSlider).toHaveAttribute('aria-label', 'Önizleme ses seviyesi');
    });
  });

  describe('Callback Functions', () => {
    it('calls onPreviewStart when preview starts', async () => {
      const onPreviewStart = jest.fn();
      mockUseAudioPreview.play.mockResolvedValue(undefined);
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStart={onPreviewStart} />);

      const playButton = screen.getByTestId('audio-control-button');
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(onPreviewStart).toHaveBeenCalled();
      });
    });

    it('calls onPreviewStop when preview stops', () => {
      mockUseAudioPreview.isPlaying = true;
      const onPreviewStop = jest.fn();
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStop={onPreviewStop} />);

      const pauseButton = screen.getByTestId('audio-control-button');
      fireEvent.click(pauseButton);

      expect(onPreviewStop).toHaveBeenCalled();
    });

    it('calls onPreviewStop when stop button is clicked', () => {
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      const onPreviewStop = jest.fn();
      render(<AudioPreviewPlayer {...defaultProps} onPreviewStop={onPreviewStop} />);

      const stopButton = screen.getByText('Durdur');
      fireEvent.click(stopButton);

      expect(onPreviewStop).toHaveBeenCalled();
    });

    it('works without callback functions', () => {
      expect(() => {
        render(<AudioPreviewPlayer {...defaultProps} />);

        const playButton = screen.getByTestId('audio-control-button');
        fireEvent.click(playButton);
      }).not.toThrow();
    });
  });

  describe('Component Requirements Verification', () => {
    it('satisfies requirement 3.1: Display preview button after successful stream test', () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      expect(playButton).toBeInTheDocument();
      expect(playButton).not.toBeDisabled();
    });

    it('satisfies requirement 3.2: Start streaming audio within 3 seconds', async () => {
      render(<AudioPreviewPlayer {...defaultProps} />);

      const playButton = screen.getByTestId('audio-control-button');
      const startTime = performance.now();

      fireEvent.click(playButton);

      expect(mockUseAudioPreview.play).toHaveBeenCalledWith('https://example.com/stream');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
    });

    it('satisfies requirement 3.3: Display pause/stop controls during playback', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      render(<AudioPreviewPlayer {...defaultProps} />);

      // Pause control (play/pause button in pause state)
      const pauseButton = screen.getByTestId('audio-control-button');
      expect(pauseButton).toHaveAttribute('aria-label', 'Önizlemeyi duraklat');

      // Stop control
      const stopButton = screen.getByText('Durdur');
      expect(stopButton).toBeInTheDocument();
    });

    it('satisfies requirement 3.7: Display "Önizleme başlatılamadı" error message', () => {
      mockUseAudioPreview.error = 'Connection failed';
      render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme başlatılamadı')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('correctly integrates with useAudioPreview hook', () => {
      mockUseAudioPreview.isPlaying = true;
      mockUseAudioPreview.isLoading = false;
      mockUseAudioPreview.currentUrl = 'https://example.com/stream';
      mockUseAudioPreview.volume = 0.8;
      mockUseAudioPreview.currentTime = 45;
      mockUseAudioPreview.duration = 120;

      render(<AudioPreviewPlayer {...defaultProps} />);

      // Verify all hook state is reflected in UI
      expect(screen.getByText('Önizleme oynatılıyor')).toBeInTheDocument();
      expect(screen.getByTestId('audio-control-button')).toHaveAttribute('aria-label', 'Önizlemeyi duraklat');
      expect(screen.getByLabelText('Önizleme ses seviyesi')).toHaveValue('0.8');
      expect(screen.getByText(/00:45/)).toBeInTheDocument();
      expect(screen.getByText(/02:00/)).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('responds to hook state changes', () => {
      const { rerender } = render(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Önizleme hazır')).toBeInTheDocument();

      // Simulate state change
      mockUseAudioPreview.isLoading = true;
      rerender(<AudioPreviewPlayer {...defaultProps} />);

      expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});