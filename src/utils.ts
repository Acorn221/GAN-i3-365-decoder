/* eslint-disable no-unused-expressions */

/**
 * Simple event emitter class for handling custom events
 */
class EventEmitter {
  private events: Record<string, Array<(data: any) => void>> = {};

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
    console.log(`[EventEmitter] Added listener for event: ${event}, total listeners: ${this.events[event].length}`);
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
    console.log(`[EventEmitter] Removed listener for event: ${event}, before: ${initialLength}, after: ${this.events[event].length}`);
  }

  /**
   * Emit an event with data
   * @param event - Event name
   * @param data - Event data
   */
  public emit(event: string, data: any): void {
    console.log(`[EventEmitter] Emitting event: ${event}`, data);
    if (!this.events[event]) {
      console.log(`[EventEmitter] No listeners for event: ${event}`);
      return;
    }
    console.log(`[EventEmitter] Calling ${this.events[event].length} listeners for event: ${event}`);
    this.events[event].forEach((callback) => callback(data));
  }

  /**
   * Remove all event listeners
   */
  public clearAllListeners(): void {
    console.log('[EventEmitter] Clearing all listeners');
    this.events = {};
  }
}

// Create a single shared instance of EventEmitter
export const eventBus = new EventEmitter();

// Export the matchUUID function from the original utils file
export function matchUUID(uuid1: string, uuid2: string): boolean {
  return uuid1.toLowerCase() === uuid2.toLowerCase();
}
