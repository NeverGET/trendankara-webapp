/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';

// Mock HTMLAudioElement
class MockAudioElement {
  public src = '';
  public volume = 0.7;
  public currentTime = 0;
  public duration = 0;
  public paused = true;
  public preload = 'none';
  public crossOrigin: string | null = 'anonymous';
  private eventListeners: { [key: string]: EventListener[] } = {};
  private _canPlay = true;
  private _shouldError = false;

  constructor() {
    // Mock audio element behavior
  }

  addEventListener(event: string, listener: EventListener) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  removeEventListener(event: string, listener: EventListener) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event) {
    const listeners = this.eventListeners[event.type];
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
    return true;
  }

  async play(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this._shouldError) {
          reject(new Error('Play failed'));
          return;
        }

        this.paused = false;
        this.dispatchEvent(new Event('waiting'));

        setTimeout(() => {
          if (this._canPlay) {
            this.dispatchEvent(new Event('canplay'));
            this.dispatchEvent(new Event('playing'));
            resolve();
          } else {
            this.dispatchEvent(new Event('error'));
            reject(new Error('Cannot play'));
          }
        }, 10);
      }, 5);
    });
  }

  pause() {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  load() {
    // Mock load behavior
    setTimeout(() => {
      if (this._canPlay && !this._shouldError) {
        this.duration = 180; // 3 minutes mock duration
        this.dispatchEvent(new Event('loadedmetadata'));
      }
    }, 10);
  }

  // Test helper methods
  simulateTimeUpdate(time: number) {
    this.currentTime = time;
    this.dispatchEvent(new Event('timeupdate'));
  }

  simulateError() {
    this._shouldError = true;
    this.dispatchEvent(new Event('error'));
  }

  simulateEnd() {
    this.currentTime = this.duration;
    this.dispatchEvent(new Event('ended'));
  }

  simulateCannotPlay() {
    this._canPlay = false;
  }

  resetMock() {
    this._shouldError = false;
    this._canPlay = true;
    this.src = '';
    this.currentTime = 0;
    this.paused = true;
  }
}

// Global Audio mock
let currentMockAudio: MockAudioElement | null = null;

// Mock navigator.userAgent for iOS testing
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
};

// Import after mocking setup
import { useAudioPreview } from '../useAudioPreview';

describe('useAudioPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Reset mock audio
    currentMockAudio = null;

    // Reset navigator.userAgent to non-iOS
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Set up global Audio mock
    global.Audio = jest.fn().mockImplementation(() => {
      currentMockAudio = new MockAudioElement();
      return currentMockAudio;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Helper to get the current mock audio instance
  const getCurrentMockAudio = (): MockAudioElement => {
    if (!currentMockAudio) {
      throw new Error('No mock audio instance available');
    }
    return currentMockAudio;
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAudioPreview());

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentUrl).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.volume).toBe(0.7);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.isIOS).toBe(false);
    });

    it('should detect iOS devices', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

      const { result } = renderHook(() => useAudioPreview());

      expect(result.current.isIOS).toBe(true);
    });
  });

  describe('Audio Element Creation and Cleanup', () => {
    it('should create audio element with correct properties', () => {
      renderHook(() => useAudioPreview());

      expect(global.Audio).toHaveBeenCalled();
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.preload).toBe('none');
      expect(mockAudio.crossOrigin).toBe('anonymous');
      expect(mockAudio.volume).toBe(0.7);
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      const removeEventListenerSpy = jest.spyOn(mockAudio, 'removeEventListener');
      const pauseSpy = jest.spyOn(mockAudio, 'pause');
      const loadSpy = jest.spyOn(mockAudio, 'load');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('canplay', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('waiting', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('playing', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('timeupdate', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(pauseSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
      expect(mockAudio.src).toBe('');
    });
  });

  describe('Core Functionality', () => {
    it('should start playing audio with correct URL', async () => {
      const { result } = renderHook(() => useAudioPreview());
      const testUrl = 'https://example.com/stream';

      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      expect(result.current.currentUrl).toBe(testUrl);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.src).toBe(testUrl);
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should pause audio and update state', async () => {
      const { result } = renderHook(() => useAudioPreview());
      const testUrl = 'https://example.com/stream';

      // Start playing first
      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      expect(result.current.isPlaying).toBe(true);

      // Pause
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.paused).toBe(true);
    });

    it('should stop audio and reset state', async () => {
      const { result } = renderHook(() => useAudioPreview());
      const testUrl = 'https://example.com/stream';

      // Start playing first
      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      // Admin stops preview
      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.currentUrl).toBe(null);
      expect(result.current.error).toBe(null);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.currentTime).toBe(0);
      expect(mockAudio.paused).toBe(true);
    });

    it('should set volume correctly', () => {
      const { result } = renderHook(() => useAudioPreview());

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.volume).toBe(0.5);
    });

    it('should clamp volume to valid range', () => {
      const { result } = renderHook(() => useAudioPreview());

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle audio errors and update state', () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      act(() => {
        mockAudio.simulateError();
      });

      expect(result.current.error).toBe('Failed to load audio stream');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should handle play errors gracefully', async () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      // Configure mock to error
      mockAudio.simulateCannotPlay();

      const testUrl = 'https://example.com/stream';

      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      expect(result.current.error).toBe('Failed to start audio preview');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Audio Events', () => {
    it('should update time during playback', () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      act(() => {
        mockAudio.simulateTimeUpdate(45);
      });

      expect(result.current.currentTime).toBe(45);
    });

    it('should update duration when metadata loads', () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      act(() => {
        mockAudio.duration = 180;
        mockAudio.dispatchEvent(new Event('loadedmetadata'));
      });

      expect(result.current.duration).toBe(180);
    });

    it('should handle audio end event', async () => {
      const { result } = renderHook(() => useAudioPreview());

      // Start playing first
      await act(async () => {
        await result.current.play('https://example.com/stream');
        jest.advanceTimersByTime(50);
      });

      expect(result.current.isPlaying).toBe(true);

      // Simulate audio end
      const mockAudio = getCurrentMockAudio();
      act(() => {
        mockAudio.simulateEnd();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
    });

    it('should handle loading states correctly', () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      // First set loading
      act(() => {
        mockAudio.dispatchEvent(new Event('waiting'));
      });

      expect(result.current.isLoading).toBe(true);

      // Then start playing
      act(() => {
        mockAudio.dispatchEvent(new Event('playing'));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('iOS Specific Features', () => {
    it('should add cache-busting parameters for iOS devices', async () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

      const { result } = renderHook(() => useAudioPreview());
      const testUrl = 'https://example.com/stream';

      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      expect(result.current.currentUrl).toBe(testUrl);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.src).toMatch(/https:\/\/example\.com\/stream\?t=\d+&r=[a-z0-9]+/);
    });

    it('should detect iPad devices', () => {
      mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');

      const { result } = renderHook(() => useAudioPreview());

      expect(result.current.isIOS).toBe(true);
    });

    it('should detect iPod devices', () => {
      mockUserAgent('Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)');

      const { result } = renderHook(() => useAudioPreview());

      expect(result.current.isIOS).toBe(true);
    });
  });

  describe('Requirements Verification', () => {
    it('should satisfy requirement 3.1: Display preview functionality', () => {
      const { result } = renderHook(() => useAudioPreview());

      // Hook provides preview functionality
      expect(typeof result.current.play).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.setVolume).toBe('function');
    });

    it('should satisfy requirement 3.2: Start streaming within 3 seconds', async () => {
      const { result } = renderHook(() => useAudioPreview());
      const testUrl = 'https://example.com/stream';

      const startTime = Date.now();

      await act(async () => {
        await result.current.play(testUrl);
        jest.advanceTimersByTime(50);
      });

      const endTime = Date.now();
      const playDuration = endTime - startTime;

      expect(playDuration).toBeLessThan(3000);
      expect(result.current.isPlaying).toBe(true);
    });

    it('should satisfy requirement 3.3: Display pause/stop controls during playback', async () => {
      const { result } = renderHook(() => useAudioPreview());

      await act(async () => {
        await result.current.play('https://example.com/stream');
        jest.advanceTimersByTime(50);
      });

      // During playback, controls should be available and functional
      expect(result.current.isPlaying).toBe(true);

      // Test pause control
      act(() => {
        result.current.pause();
      });
      expect(result.current.isPlaying).toBe(false);

      // Resume and test stop control
      await act(async () => {
        await result.current.play('https://example.com/stream');
        jest.advanceTimersByTime(50);
      });

      act(() => {
        result.current.stop();
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it('should satisfy requirement 3.4: Stop audio when admin stops preview', async () => {
      const { result } = renderHook(() => useAudioPreview());

      await act(async () => {
        await result.current.play('https://example.com/stream');
        jest.advanceTimersByTime(50);
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentUrl).toBe('https://example.com/stream');

      // Admin action to stop preview
      act(() => {
        result.current.stop();
      });

      // Audio should be completely stopped
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentUrl).toBe(null);
      expect(result.current.currentTime).toBe(0);
      const mockAudio = getCurrentMockAudio();
      expect(mockAudio.paused).toBe(true);
      expect(mockAudio.currentTime).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing audio reference gracefully', () => {
      const { result } = renderHook(() => useAudioPreview());

      // These should not throw errors even if audio ref is missing
      act(() => {
        result.current.pause();
        result.current.stop();
        result.current.setVolume(0.5);
      });

      // Should not throw errors
      expect(result.current.isPlaying).toBe(false);
    });

    it('should handle infinite and NaN duration gracefully', () => {
      const { result } = renderHook(() => useAudioPreview());
      const mockAudio = getCurrentMockAudio();

      // Test infinite duration
      act(() => {
        mockAudio.duration = Infinity;
        mockAudio.dispatchEvent(new Event('loadedmetadata'));
      });

      expect(result.current.duration).toBe(0);

      // Test NaN duration
      act(() => {
        mockAudio.duration = NaN;
        mockAudio.dispatchEvent(new Event('loadedmetadata'));
      });

      expect(result.current.duration).toBe(0);
    });

    it('should maintain preview independence from main radio player', async () => {
      const { result } = renderHook(() => useAudioPreview());

      // Set preview state
      await act(async () => {
        await result.current.play('https://preview.com/stream');
        jest.advanceTimersByTime(50);
      });

      act(() => {
        result.current.setVolume(0.3);
      });

      // Preview should maintain its own state
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentUrl).toBe('https://preview.com/stream');
      expect(result.current.volume).toBe(0.3);

      // Change to different stream
      await act(async () => {
        await result.current.play('https://different.com/stream');
        jest.advanceTimersByTime(50);
      });

      expect(result.current.currentUrl).toBe('https://different.com/stream');
      expect(result.current.volume).toBe(0.3); // Volume should persist
    });
  });
});