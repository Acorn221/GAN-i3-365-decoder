/* eslint-disable */
import { GanCube } from './gancube';

// Declare BTCube on Window interface
declare global {
  interface Window {
    btCube: any;
  }
}

/**
 * BTCube class for connecting to and interacting with Bluetooth cubes
 */
export class BTCube {
  private cube: any = null;
  private _device: BluetoothDevice | null = null;
  private callback: ((state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void) | null = null;
  private evtCallback: ((info: string, event: Event) => void) | null = null;
  private readonly DEBUG: boolean;;

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
    if (info == 'disconnect') {
      res = Promise.resolve(this.stop());
    }
    return res.then(() => typeof this.evtCallback === 'function' ? this.evtCallback(info, event) : undefined);
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
        return Promise.reject('GIIKER_NOBLEMSG');
      }
      return window.navigator.bluetooth.requestDevice({
        filters: [{
          namePrefix: 'GAN',
        }],
        optionalServices: ([] as string[]).concat(GanCube.opservs),
        optionalManufacturerData: ([] as number[]).concat(GanCube.cics),
      });
    }).then((device) => {
      this.DEBUG && console.log('[bluetooth]', device);
      this._device = device;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      if (device.name?.startsWith('GAN') || device.name?.startsWith('MG') || device.name?.startsWith('AiCube')) {
        this.cube = GanCube;
        return GanCube.init(device, macAddress);
      }
      return Promise.reject('Cannot detect device type');
    });
  }

  /**
   * Stops the connection to the cube
   * @returns {Promise} Promise that resolves when disconnection is complete
   */
  public stop(): Promise<void> {
    if (!this._device) {
      return Promise.resolve();
    }
    return Promise.resolve(this.cube?.clear()).then(() => {
      if (this._device) {
        const onDisconnect = this.onHardwareEvent.bind(this, 'disconnect');
        this._device.removeEventListener('gattserverdisconnected', onDisconnect);
        this._device.gatt && this._device.gatt.disconnect();
        this._device = null;
      }
    });
  }

  /**
   * Checks if the cube is connected
   * @returns {boolean} True if connected
   */
  public isConnected(): boolean {
    return this._device != null;
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
   * @returns {GanCube} Cube instance
   */
  public getCube(): typeof GanCube {
    return this.cube;
  }
}
