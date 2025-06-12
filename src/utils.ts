/* eslint-disable no-unused-expressions */

/**
 * Type definition for event handlers
 */
export type EventHandler<T> = (data: T) => void;

/**
 * Simple event emitter class for handling custom events with typed events and payloads
 *
 * @template TEventMap - A record mapping event names to their payload types
 */
export class EventEmitter<TEventMap extends Record<string, any> = Record<string, any>> {
  private events: {
    [K in keyof TEventMap]?: Array<EventHandler<TEventMap[K]>>;
  } = {};

  private readonly instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 9);
  }

  /**
   * Register an event listener with type-safe event name and payload
   * @param event - Event name (must be a key of TEventMap)
   * @param callback - Callback function with properly typed payload
   */
  public on<K extends keyof TEventMap & string>(
    event: K,
    callback: EventHandler<TEventMap[K]>,
  ): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(callback);
  }

  /**
   * Remove an event listener
   * @param event - Event name (must be a key of TEventMap)
   * @param callback - Callback function to remove
   */
  public off<K extends keyof TEventMap & string>(
    event: K,
    callback: EventHandler<TEventMap[K]>,
  ): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter(
      (cb) => cb !== callback,
    ) as any;
  }

  /**
   * Emit an event with properly typed data
   * @param event - Event name (must be a key of TEventMap)
   * @param data - Event data (must match the type defined for this event)
   */
  public emit<K extends keyof TEventMap & string>(
    event: K,
    data: TEventMap[K],
  ): void {
    console.log(`[EventEmitter ${this.instanceId}] Emitting event: ${event}`, data);
    if (!this.events[event]) {
      console.log(`[EventEmitter ${this.instanceId}] No listeners for event: ${event}`);
      return;
    }
    console.log(`[EventEmitter ${this.instanceId}] Calling ${this.events[event]!.length} listeners for event: ${event}`);

    this.events[event]!.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventEmitter ${this.instanceId}] Error in event listener for ${event}:`, err);
      }
    });
  }

  /**
   * Remove all event listeners
   */
  public clearAllListeners(): void {
    this.events = {};
  }

  /**
   * Get the instance ID for debugging
   */
  public getInstanceId(): string {
    return this.instanceId;
  }
}

// Export the matchUUID function from the original utils file
export function matchUUID(uuid1: string, uuid2: string): boolean {
  return uuid1.toLowerCase() === uuid2.toLowerCase();
}
