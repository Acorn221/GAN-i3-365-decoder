/* eslint-disable */
import { GanCube } from './gancube';

// Declare btCube on Window interface
declare global {
  interface Window {
    btCube: any;
  }
}

const DEBUG = true;


const BTCube = function () {
  let cube: any = null; // Changed from typeof GanCube to any since it's used as an instance
  let _device: BluetoothDevice | null = null;
  let callback: ((state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void) | null = null;
  let evtCallback: ((info: string, event: Event) => void) | null = null;
  const DEBUGBL = false; // Added missing DEBUGBL constant

  /**
   * Handles hardware events from the cube
   * @param {string} info - Event information (e.g., 'disconnect')
   * @param {Event} event - The event object
   * @returns {Promise} Promise that resolves after handling the event
   */
  function onHardwareEvent(info: string, event: Event): Promise<any> {
    let res = Promise.resolve();
    if (info == 'disconnect') {
      res = Promise.resolve(stop());
    }
    return res.then(() => typeof evtCallback === 'function' ? evtCallback(info, event) : undefined);
  }

  const onDisconnect = onHardwareEvent.bind(null, 'disconnect');

  /**
   * Initializes connection to a Bluetooth cube
   * @returns {Promise} Promise that resolves when cube is connected
   */
  function init(macAddress?: string): Promise<any> {
    if (!window.navigator.bluetooth) {
      throw new Error('NO BLUETOOTH ON BROWSER');
    }
    let chkAvail = Promise.resolve(true);
    if (window.navigator.bluetooth.getAvailability) {
      chkAvail = window.navigator.bluetooth.getAvailability();
    }

    return chkAvail.then((available) => {
      DEBUG && console.log('[bluetooth]', 'is available', available);
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
      DEBUG && console.log('[bluetooth]', device);
      _device = device;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      if (device.name?.startsWith('GAN') || device.name?.startsWith('MG') || device.name?.startsWith('AiCube')) {
        cube = GanCube;
        return GanCube.init(device, macAddress);
      }
      return Promise.reject('Cannot detect device type');
    });
  }

  /**
   * Stops the connection to the cube
   * @returns {Promise} Promise that resolves when disconnection is complete
   */
  function stop() {
    if (!_device) {
      return Promise.resolve();
    }
    return Promise.resolve(cube?.clear()).then(() => {
      if (_device) {
        _device.removeEventListener('gattserverdisconnected', onDisconnect);
        _device.gatt && _device.gatt.disconnect();
        _device = null;
      }
    });
  }

  return {
    init,
    stop,
    /**
     * Checks if the cube is connected
     * @returns {boolean} True if connected
     */
    isConnected() {
      return _device != null;
    },
    /**
     * Sets the callback function for cube state changes
     * @param {Function} func - Callback function
     */
    setCallback(func: (state: string, moves: string[], timestamps: [number | null, number | null], deviceName: string) => void): void {
      callback = func;
    },
    /**
     * Sets the callback function for cube events
     * @param {Function} func - Event callback function
     */
    setEventCallback(func: (info: string, event: Event) => void): void {
      evtCallback = func;
    },
    /**
     * Gets the cube instance
     * @returns {GanCube} Cube instance
     */
    getCube(): typeof GanCube {
      return cube;
    },
  };
};

// Export BTCube to the global scope
export const btCube = BTCube();

window.btCube = btCube;