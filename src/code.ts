/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { GanCube } from './gancube';

/**
 * BTCube class for connecting to and interacting with Bluetooth cubes
 */
export class BTCube {
  private cube: GanCube | null = null;

  private device: BluetoothDevice | null = null;

  private callback: ((state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void) | null = null;

  private evtCallback: ((info: string, event: Event) => void) | null = null;

  private readonly DEBUG: boolean;

  constructor(debug: boolean = false) {
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
        return this.cube.init(device, macAddress);
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
}
