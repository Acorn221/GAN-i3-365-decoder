/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { GanCube } from './gancube';
import { EventEmitter } from './utils';

/**
 * BTCube class for connecting to and interacting with Bluetooth cubes
 */
export class BTCube extends EventEmitter {
  private cube: GanCube | null = null;

  private device: BluetoothDevice | null = null;

  private callback: ((state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void) | null = null;

  private evtCallback: ((info: string, event: Event) => void) | null = null;

  private readonly DEBUG: boolean;

  constructor(debug: boolean = false) {
    super();
    this.DEBUG = debug;
  }

  /**
   * Handles hardware events from the cube
   * @param {string} info - Event information (e.g., 'disconnect')
   * @param {Event} event - The event object
   * @returns {Promise} Promise that resolves after handling the event
   */
  private onHardwareEvent(info: string, event: Event): Promise<any> {
    let res = Promise.resolve();
    if (info === 'disconnect') {
      res = Promise.resolve(this.stop());
    }
    return res.then(() => (typeof this.evtCallback === 'function' ? this.evtCallback(info, event) : undefined));
  }

  /**
   * Initializes connection to a Bluetooth cube
   * @param {string} macAddress - Optional MAC address of the cube
   * @returns {Promise} Promise that resolves when cube is connected
   */
  public init(macAddress?: string): Promise<any> {
    if (!window.navigator.bluetooth) {
      throw new Error('NO BLUETOOTH ON BROWSER');
    }
    let chkAvail = Promise.resolve(true);
    if (window.navigator.bluetooth.getAvailability) {
      chkAvail = window.navigator.bluetooth.getAvailability();
    }

    const onDisconnect = this.onHardwareEvent.bind(this, 'disconnect');

    return chkAvail.then((available) => {
      this.DEBUG && console.log('[bluetooth]', 'is available', available);
      if (!available) {
        throw new Error('GIIKER_NOBLEMSG');
      }
      return window.navigator.bluetooth.requestDevice({
        filters: [{
          namePrefix: 'GAN',
        }],
        optionalServices: ([] as string[]).concat(new GanCube().opservs),
        optionalManufacturerData: ([] as number[]).concat(new GanCube().cics),
      });
    }).then((device) => {
      this.DEBUG && console.log('[bluetooth]', device);
      this.device = device;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      if (device.name?.startsWith('GAN') || device.name?.startsWith('MG') || device.name?.startsWith('AiCube')) {
        this.cube = new GanCube();

        // IMPORTANT: We need to set up event forwarding AFTER the cube is initialized
        // because the initialization process might replace the cube's internal state
        return this.cube.init(device, macAddress).then(() => {
          // Now set up event forwarding AFTER initialization is complete
          this.setupEventForwarding();

          return Promise.resolve();
        });
      }
      throw new Error('Cannot detect device type');
    });
  }

  /**
   * Stops the connection to the cube
   * @returns {Promise} Promise that resolves when disconnection is complete
   */
  public stop(): Promise<void> {
    if (!this.device) {
      return Promise.resolve();
    }
    return Promise.resolve(this.cube?.clear()).then(() => {
      console.log('[BTCube] Clearing event listeners');
      // Clear all event listeners
      this.clearAllListeners();
      if (this.device) {
        const onDisconnect = this.onHardwareEvent.bind(this, 'disconnect');
        this.device.removeEventListener('gattserverdisconnected', onDisconnect);
        this.device.gatt && this.device.gatt.disconnect();
        this.device = null;
      }
    });
  }

  /**
   * Checks if the cube is connected
   * @returns {boolean} True if connected
   */
  public isConnected(): boolean {
    return this.device != null;
  }

  /**
   * Sets the callback function for cube state changes
   * @param {Function} func - Callback function
   */
  public setCallback(func: (state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void): void {
    this.callback = func;
  }

  /**
   * Sets the callback function for cube events
   * @param {Function} func - Event callback function
   */
  public setEventCallback(func: (info: string, event: Event) => void): void {
    this.evtCallback = func;
  }

  /**
   * Gets the cube instance
   * @returns Cube instance
   */
  public getCube() {
    return this.cube;
  }

  /**
   * Sets up event forwarding from the GanCube instance to this BTCube instance
   * This allows components to listen to events from the BTCube instance
   * instead of from the window object
   */
  private setupEventForwarding(): void {
    if (!this.cube) {
      console.error('[BTCube] No cube instance to forward events from');
      return;
    }

    // Get instance IDs for debugging
    const ganCubeId = (this.cube as any).getInstanceId ? (this.cube as any).getInstanceId() : 'unknown';
    const btCubeId = (this as any).getInstanceId ? (this as any).getInstanceId() : 'unknown';

    // List of events to forward
    const events = [
      'cubeStateChanged',
      'gyroData',
      'move',
      'cubeSolved',
      'unSolved',
    ];

    // Set up forwarding for each event
    events.forEach((eventName) => {
      // First, check if we already have a handler for this event
      if ((this as any)[`_${eventName}Handler`]) {
        this.cube?.off(eventName, (this as any)[`_${eventName}Handler`]);
      }

      // Create a new handler function
      const forwardHandler = (data: any) => {
        // Forward the event with the same name and data
        this.emit(eventName, data);
      };

      // Store the handler reference so we can properly remove it later
      (this as any)[`_${eventName}Handler`] = forwardHandler;

      // Register the handler on the GanCube instance
      if (this.cube) {
        this.cube.on(eventName, forwardHandler);
      }
    });
  }
}
