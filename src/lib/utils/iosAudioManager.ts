import { isIOS } from './iosDetection';

export class IOSAudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private resetCounter: number = 0;
  private streamUrl: string;

  constructor(streamUrl: string) {
    this.streamUrl = streamUrl;
    if (isIOS()) {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }

  async nuclearReset(): Promise<void> {
    console.log('Performing nuclear reset for iOS audio...');

    // Destroy everything
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load();
      this.audioElement.remove();
      this.audioElement = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing AudioContext:', error);
      }
      this.audioContext = null;
    }

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Recreate everything with cache-busted URL
    this.resetCounter++;
    const cacheBuster = `?reset=${this.resetCounter}&t=${Date.now()}`;

    this.audioElement = new Audio();
    this.audioElement.preload = 'none';
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.src = `${this.streamUrl}${cacheBuster}`;

    // Recreate AudioContext
    this.initializeAudioContext();

    // Resume if suspended
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async play(): Promise<void> {
    if (!this.audioElement) {
      await this.nuclearReset();
    }

    if (!this.audioElement) {
      throw new Error('Failed to create audio element');
    }

    try {
      // Resume AudioContext if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      await this.audioElement.play();
    } catch (error) {
      console.error('iOS play error:', error);
      // Try nuclear reset and play again
      await this.nuclearReset();
      if (this.audioElement) {
        await this.audioElement.play();
      }
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}