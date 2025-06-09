/* eslint-disable no-unused-expressions */

/**
 * Simple event emitter class for handling custom events
 */
export class EventEmitter {
  private events: Record<string, Array<(data: any) => void>> = {};

  private readonly instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 9);
  }

  /**
   * Register an event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  public off(event: string, callback: (data: any) => void): void {
    if (!this.events[event]) return;
    const initialLength = this.events[event].length;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  /**
   * Emit an event with data
   * @param event - Event name
   * @param data - Event data
   */
  public emit(event: string, data: any): void {
    console.log(`[EventEmitter ${this.instanceId}] Emitting event: ${event}`, data);
    if (!this.events[event]) {
      console.log(`[EventEmitter ${this.instanceId}] No listeners for event: ${event}`);
      return;
    }
    console.log(`[EventEmitter ${this.instanceId}] Calling ${this.events[event].length} listeners for event: ${event}`);

    this.events[event].forEach((callback) => {
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
