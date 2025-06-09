/* eslint-disable */
import { GanCube } from './gancube';

const DEBUG = true;


const BTCube = function () {
  let cube: typeof GanCube | null = null;
  let _device: BluetoothDevice | null = null;

  /**
   * Handles hardware events from the cube
   * @param {string} info - Event information (e.g., 'disconnect')
   * @param {Event} event - The event object
   * @returns {Promise} Promise that resolves after handling the event
   */
  function onHardwareEvent(info, event) {
    let res = Promise.resolve();
    if (info == 'disconnect') {
      res = Promise.resolve(stop());
    }
    return res.then(() => typeof evtCallback === 'function' && evtCallback(info, event));
  }

  const onDisconnect = onHardwareEvent.bind(null, 'disconnect');

  /**
   * Initializes connection to a Bluetooth cube
   * @returns {Promise} Promise that resolves when cube is connected
   */
  function init(macAddress) {
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
        optionalServices: [].concat(GanCube.opservs),
        optionalManufacturerData: [].concat(GanCube.cics),
      });
    }).then((device) => {
      DEBUG && console.log('[bluetooth]', device);
      _device = device;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      if (device.name.startsWith('GAN') || device.name.startsWith('MG') || device.name.startsWith('AiCube')) {
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
      return _device != null || DEBUGBL;
    },
    /**
     * Sets the callback function for cube state changes
     * @param {Function} func - Callback function
     */
    setCallback(func) {
      callback = func;
    },
    /**
     * Sets the callback function for cube events
     * @param {Function} func - Event callback function
     */
    setEventCallback(func) {
      evtCallback = func;
    },
    /**
     * Gets the cube instance
     * @returns {GanCube} Cube instance
     */
    getCube() {
      return cube;
    },
  };
};

// Export BTCube to the global scope
export const btCube = BTCube();

window.btCube = btCube;