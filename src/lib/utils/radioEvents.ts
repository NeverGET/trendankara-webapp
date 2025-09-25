/**
 * Radio configuration event broadcasting utility
 * Provides real-time event system for radio configuration updates
 * Supports requirements 4.1 and 4.2 for streaming URL configuration changes
 */

import { StreamConfigurationData } from '@/types/radioSettings';

/**
 * Event names for radio configuration system
 * Centralized definition prevents typos and ensures consistency
 */
export const RADIO_EVENT_NAMES = {
  /** Broadcast when radio settings are updated in admin */
  SETTINGS_UPDATED: 'radioSettingsUpdated',
  /** Broadcast when stream URL specifically changes */
  STREAM_URL_CHANGED: 'radioStreamUrlChanged',
  /** Broadcast when metadata URL changes */
  METADATA_URL_CHANGED: 'radioMetadataUrlChanged',
  /** Broadcast when station information changes */
  STATION_INFO_CHANGED: 'radioStationInfoChanged',
  /** Broadcast when configuration reload is needed */
  CONFIGURATION_RELOAD_REQUIRED: 'radioConfigurationReloadRequired'
} as const;

/**
 * Type for radio event names
 */
export type RadioEventName = typeof RADIO_EVENT_NAMES[keyof typeof RADIO_EVENT_NAMES];

/**
 * Base interface for all radio configuration events
 */
export interface RadioConfigurationEvent {
  /** Timestamp when the event was created */
  timestamp: number;
  /** Source of the event (admin, api, etc.) */
  source: string;
  /** Optional correlation ID for tracking related events */
  correlationId?: string;
}

/**
 * Event payload for general settings updates
 * Includes the full configuration data that was updated
 */
export interface RadioSettingsUpdatedEvent extends RadioConfigurationEvent {
  /** Updated configuration data */
  configuration: Partial<StreamConfigurationData>;
  /** List of fields that were changed */
  changedFields: (keyof StreamConfigurationData)[];
  /** Previous values for changed fields */
  previousValues?: Partial<StreamConfigurationData>;
}

/**
 * Event payload for stream URL changes
 * Focused specifically on streaming URL updates for quick response
 */
export interface RadioStreamUrlChangedEvent extends RadioConfigurationEvent {
  /** New stream URL */
  streamUrl: string;
  /** Previous stream URL for comparison */
  previousStreamUrl?: string;
  /** Whether this requires immediate reconnection */
  requiresReconnection: boolean;
}

/**
 * Event payload for metadata URL changes
 * Handles metadata endpoint updates separately from stream changes
 */
export interface RadioMetadataUrlChangedEvent extends RadioConfigurationEvent {
  /** New metadata URL */
  metadataUrl: string | null;
  /** Previous metadata URL */
  previousMetadataUrl?: string | null;
}

/**
 * Event payload for station information changes
 * Non-critical updates that don't require stream reconnection
 */
export interface RadioStationInfoChangedEvent extends RadioConfigurationEvent {
  /** Updated station information */
  stationInfo: {
    name?: string;
    description?: string | null;
    socialUrls?: {
      facebook?: string | null;
      twitter?: string | null;
      instagram?: string | null;
      youtube?: string | null;
    };
  };
}

/**
 * Event payload for configuration reload requirements
 * General signal that configuration should be reloaded from API
 */
export interface RadioConfigurationReloadEvent extends RadioConfigurationEvent {
  /** Reason for reload requirement */
  reason: 'settings_updated' | 'stream_changed' | 'manual_refresh' | 'error_recovery';
  /** Whether this is a high priority reload */
  priority: 'high' | 'normal' | 'low';
}

/**
 * Union type for all radio event payloads
 */
export type RadioEventPayload =
  | RadioSettingsUpdatedEvent
  | RadioStreamUrlChangedEvent
  | RadioMetadataUrlChangedEvent
  | RadioStationInfoChangedEvent
  | RadioConfigurationReloadEvent;

/**
 * Type-safe event listener function type
 */
export type RadioEventListener<T extends RadioEventPayload = RadioEventPayload> = (event: CustomEvent<T>) => void;

/**
 * Options for broadcasting events
 */
export interface BroadcastOptions {
  /** Source identifier for the event */
  source?: string;
  /** Correlation ID for tracking related events */
  correlationId?: string;
  /** Whether to log the event for debugging */
  debug?: boolean;
}

/**
 * Broadcast general radio settings update event
 * Called when any radio settings are updated in admin interface
 *
 * @param configuration - Updated configuration data
 * @param changedFields - List of fields that were changed
 * @param options - Additional event options
 *
 * @example
 * ```typescript
 * // In admin settings save handler
 * await saveRadioSettings(newConfig);
 * broadcastSettingsUpdate(newConfig, ['stream_url', 'station_name'], {
 *   source: 'admin-panel',
 *   correlationId: 'settings-save-123'
 * });
 * ```
 */
export function broadcastSettingsUpdate(
  configuration: Partial<StreamConfigurationData>,
  changedFields: (keyof StreamConfigurationData)[],
  options: BroadcastOptions & { previousValues?: Partial<StreamConfigurationData> } = {}
): void {
  const { source = 'unknown', correlationId, debug = false, previousValues } = options;

  const eventPayload: RadioSettingsUpdatedEvent = {
    configuration,
    changedFields,
    previousValues,
    timestamp: Date.now(),
    source,
    correlationId
  };

  // Create and dispatch the main settings update event
  const settingsEvent = new CustomEvent(RADIO_EVENT_NAMES.SETTINGS_UPDATED, {
    detail: eventPayload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log('[RadioEvents] Broadcasting settings update:', {
      changedFields,
      source,
      correlationId
    });
  }

  window.dispatchEvent(settingsEvent);

  // Dispatch specific events for critical changes
  if (changedFields.includes('stream_url') && configuration.stream_url) {
    broadcastStreamUrlChange(
      configuration.stream_url,
      previousValues?.stream_url,
      { source, correlationId, debug }
    );
  }

  if (changedFields.includes('metadata_url')) {
    broadcastMetadataUrlChange(
      configuration.metadata_url || null,
      previousValues?.metadata_url || null,
      { source, correlationId, debug }
    );
  }

  // Broadcast station info changes for non-critical updates
  const stationFields = ['station_name', 'station_description', 'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url'] as const;
  const hasStationChanges = changedFields.some(field => stationFields.includes(field as any));

  if (hasStationChanges) {
    const stationInfo = {
      name: configuration.station_name,
      description: configuration.station_description,
      socialUrls: {
        facebook: configuration.facebook_url,
        twitter: configuration.twitter_url,
        instagram: configuration.instagram_url,
        youtube: configuration.youtube_url
      }
    };

    broadcastStationInfoChange(stationInfo, { source, correlationId, debug });
  }
}

/**
 * Broadcast stream URL change event
 * Called specifically when the streaming URL changes and requires immediate player response
 *
 * @param streamUrl - New stream URL
 * @param previousStreamUrl - Previous stream URL for comparison
 * @param options - Additional event options
 */
export function broadcastStreamUrlChange(
  streamUrl: string,
  previousStreamUrl?: string,
  options: BroadcastOptions = {}
): void {
  const { source = 'unknown', correlationId, debug = false } = options;

  const eventPayload: RadioStreamUrlChangedEvent = {
    streamUrl,
    previousStreamUrl,
    requiresReconnection: true, // Stream URL changes always require reconnection
    timestamp: Date.now(),
    source,
    correlationId
  };

  const event = new CustomEvent(RADIO_EVENT_NAMES.STREAM_URL_CHANGED, {
    detail: eventPayload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log('[RadioEvents] Broadcasting stream URL change:', {
      newUrl: streamUrl,
      previousUrl: previousStreamUrl,
      source
    });
  }

  window.dispatchEvent(event);
}

/**
 * Broadcast metadata URL change event
 * Called when the metadata endpoint URL changes
 *
 * @param metadataUrl - New metadata URL
 * @param previousMetadataUrl - Previous metadata URL
 * @param options - Additional event options
 */
export function broadcastMetadataUrlChange(
  metadataUrl: string | null,
  previousMetadataUrl?: string | null,
  options: BroadcastOptions = {}
): void {
  const { source = 'unknown', correlationId, debug = false } = options;

  const eventPayload: RadioMetadataUrlChangedEvent = {
    metadataUrl,
    previousMetadataUrl,
    timestamp: Date.now(),
    source,
    correlationId
  };

  const event = new CustomEvent(RADIO_EVENT_NAMES.METADATA_URL_CHANGED, {
    detail: eventPayload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log('[RadioEvents] Broadcasting metadata URL change:', {
      newUrl: metadataUrl,
      previousUrl: previousMetadataUrl,
      source
    });
  }

  window.dispatchEvent(event);
}

/**
 * Broadcast station information change event
 * Called when non-critical station information changes (name, description, social URLs)
 *
 * @param stationInfo - Updated station information
 * @param options - Additional event options
 */
export function broadcastStationInfoChange(
  stationInfo: RadioStationInfoChangedEvent['stationInfo'],
  options: BroadcastOptions = {}
): void {
  const { source = 'unknown', correlationId, debug = false } = options;

  const eventPayload: RadioStationInfoChangedEvent = {
    stationInfo,
    timestamp: Date.now(),
    source,
    correlationId
  };

  const event = new CustomEvent(RADIO_EVENT_NAMES.STATION_INFO_CHANGED, {
    detail: eventPayload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log('[RadioEvents] Broadcasting station info change:', {
      stationInfo,
      source
    });
  }

  window.dispatchEvent(event);
}

/**
 * Broadcast configuration reload requirement
 * General purpose signal that radio players should reload their configuration
 *
 * @param reason - Reason for reload requirement
 * @param priority - Priority level of the reload
 * @param options - Additional event options
 */
export function broadcastConfigurationReload(
  reason: RadioConfigurationReloadEvent['reason'] = 'manual_refresh',
  priority: RadioConfigurationReloadEvent['priority'] = 'normal',
  options: BroadcastOptions = {}
): void {
  const { source = 'unknown', correlationId, debug = false } = options;

  const eventPayload: RadioConfigurationReloadEvent = {
    reason,
    priority,
    timestamp: Date.now(),
    source,
    correlationId
  };

  const event = new CustomEvent(RADIO_EVENT_NAMES.CONFIGURATION_RELOAD_REQUIRED, {
    detail: eventPayload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log('[RadioEvents] Broadcasting configuration reload:', {
      reason,
      priority,
      source
    });
  }

  window.dispatchEvent(event);
}

/**
 * Add typed event listener for radio configuration events
 * Provides type safety and automatic cleanup capabilities
 *
 * @param eventName - Name of the event to listen for
 * @param listener - Event listener function
 * @param options - Event listener options
 * @returns Cleanup function to remove the event listener
 *
 * @example
 * ```typescript
 * // In radio player component
 * const unsubscribe = addRadioEventListener(
 *   'radioSettingsUpdated',
 *   (event) => {
 *     console.log('Settings updated:', event.detail.changedFields);
 *     reloadConfiguration();
 *   }
 * );
 *
 * // Cleanup on component unmount
 * useEffect(() => unsubscribe, []);
 * ```
 */
export function addRadioEventListener<T extends RadioEventPayload>(
  eventName: RadioEventName,
  listener: RadioEventListener<T>,
  options: AddEventListenerOptions = {}
): () => void {
  const typedListener = listener as EventListener;

  window.addEventListener(eventName, typedListener, options);

  // Return cleanup function
  return () => {
    window.removeEventListener(eventName, typedListener, options);
  };
}

/**
 * Remove radio event listener
 * Direct removal method for cases where cleanup function is not suitable
 *
 * @param eventName - Name of the event to stop listening for
 * @param listener - Event listener function to remove
 * @param options - Event listener options (must match those used when adding)
 */
export function removeRadioEventListener<T extends RadioEventPayload>(
  eventName: RadioEventName,
  listener: RadioEventListener<T>,
  options: EventListenerOptions = {}
): void {
  const typedListener = listener as EventListener;
  window.removeEventListener(eventName, typedListener, options);
}

/**
 * Create a radio event manager for a specific component
 * Provides managed event listeners with automatic cleanup
 *
 * @param componentName - Name of the component for debugging
 * @returns Event manager object with helper methods
 *
 * @example
 * ```typescript
 * // In a React component
 * const eventManager = createRadioEventManager('RadioPlayer');
 *
 * useEffect(() => {
 *   // Add listeners
 *   eventManager.onSettingsUpdate((event) => {
 *     reloadConfiguration();
 *   });
 *
 *   eventManager.onStreamUrlChange((event) => {
 *     handleStreamUrlChange(event.detail.streamUrl);
 *   });
 *
 *   // Cleanup all listeners on unmount
 *   return eventManager.cleanup;
 * }, []);
 * ```
 */
export function createRadioEventManager(componentName: string = 'Unknown') {
  const listeners: (() => void)[] = [];

  const addManagedListener = <T extends RadioEventPayload>(
    eventName: RadioEventName,
    listener: RadioEventListener<T>,
    options?: AddEventListenerOptions
  ) => {
    const cleanup = addRadioEventListener(eventName, listener, options);
    listeners.push(cleanup);
    return cleanup;
  };

  return {
    /**
     * Listen for general settings updates
     */
    onSettingsUpdate: (listener: RadioEventListener<RadioSettingsUpdatedEvent>, options?: AddEventListenerOptions) =>
      addManagedListener(RADIO_EVENT_NAMES.SETTINGS_UPDATED, listener, options),

    /**
     * Listen for stream URL changes
     */
    onStreamUrlChange: (listener: RadioEventListener<RadioStreamUrlChangedEvent>, options?: AddEventListenerOptions) =>
      addManagedListener(RADIO_EVENT_NAMES.STREAM_URL_CHANGED, listener, options),

    /**
     * Listen for metadata URL changes
     */
    onMetadataUrlChange: (listener: RadioEventListener<RadioMetadataUrlChangedEvent>, options?: AddEventListenerOptions) =>
      addManagedListener(RADIO_EVENT_NAMES.METADATA_URL_CHANGED, listener, options),

    /**
     * Listen for station information changes
     */
    onStationInfoChange: (listener: RadioEventListener<RadioStationInfoChangedEvent>, options?: AddEventListenerOptions) =>
      addManagedListener(RADIO_EVENT_NAMES.STATION_INFO_CHANGED, listener, options),

    /**
     * Listen for configuration reload requirements
     */
    onConfigurationReload: (listener: RadioEventListener<RadioConfigurationReloadEvent>, options?: AddEventListenerOptions) =>
      addManagedListener(RADIO_EVENT_NAMES.CONFIGURATION_RELOAD_REQUIRED, listener, options),

    /**
     * Clean up all managed event listeners
     */
    cleanup: () => {
      listeners.forEach(cleanup => cleanup());
      listeners.length = 0;
      console.log(`[RadioEvents] Cleaned up all listeners for ${componentName}`);
    },

    /**
     * Get the count of active listeners
     */
    getListenerCount: () => listeners.length
  };
}

/**
 * Utility to check if the current environment supports window events
 * Prevents errors in server-side rendering contexts
 */
export function isWindowEventSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.addEventListener === 'function';
}

/**
 * Safe event broadcasting that checks for window availability
 * Prevents errors in SSR contexts while maintaining type safety
 *
 * @param eventName - Name of the event to broadcast
 * @param payload - Event payload data
 * @param options - Broadcast options
 */
export function safeBroadcastEvent<T extends RadioEventPayload>(
  eventName: RadioEventName,
  payload: T,
  options: BroadcastOptions = {}
): boolean {
  if (!isWindowEventSupported()) {
    console.warn('[RadioEvents] Window events not supported in current environment');
    return false;
  }

  const { debug = false } = options;

  const event = new CustomEvent(eventName, {
    detail: payload,
    bubbles: false,
    cancelable: false
  });

  if (debug) {
    console.log(`[RadioEvents] Safe broadcasting ${eventName}:`, payload);
  }

  window.dispatchEvent(event);
  return true;
}

/**
 * Default export with commonly used functions
 */
const radioEvents = {
  // Broadcasting functions
  broadcastSettingsUpdate,
  broadcastStreamUrlChange,
  broadcastMetadataUrlChange,
  broadcastStationInfoChange,
  broadcastConfigurationReload,

  // Listener management
  addListener: addRadioEventListener,
  removeListener: removeRadioEventListener,
  createManager: createRadioEventManager,

  // Utilities
  isSupported: isWindowEventSupported,
  safeBroadcast: safeBroadcastEvent,

  // Constants
  events: RADIO_EVENT_NAMES
};

export default radioEvents;