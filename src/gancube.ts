import * as LZString from 'lz-string';
import { mathlib } from './mathlib';
import { AES128 } from './aes128';
import { matchUUID } from './utils';

const DEBUG = false;

export const GanCube = (function () {
  // Internal state storage (replaces old Kernel)
  const props = {};

  /**
   * Gets a property value by key, or returns default if not found
   * @param {string} key - The property key to retrieve
   * @param {*} def - The default value to return if key not found
   * @returns {*} The property value or default
   */
  function getProp(key, def) {
    if (props.hasOwnProperty(key)) {
      return props[key];
    }
    return def;
  }

  /**
   * Sets a property value
   * @param {string} key - The property key to set
   * @param {*} value - The value to set
   * @returns {void}
   */
  function setProp(key, value) {
    props[key] = value;
  }

  const _device = null;

  const callback = () => {};

  let _gatt;
  let _service_data;
  let _service_meta;
  let _chrct_f2;
  let _chrct_f5;
  let _chrct_f6;
  let _chrct_f7;

  const UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';
  const SERVICE_UUID_META = `0000180a${UUID_SUFFIX}`;
  const CHRCT_UUID_VERSION = `00002a28${UUID_SUFFIX}`;
  const CHRCT_UUID_HARDWARE = `00002a23${UUID_SUFFIX}`;
  const SERVICE_UUID_DATA = `0000fff0${UUID_SUFFIX}`;
  const CHRCT_UUID_F2 = `0000fff2${UUID_SUFFIX}`; // cube state, (54 - 6) facelets, 3 bit per facelet
  const CHRCT_UUID_F3 = `0000fff3${UUID_SUFFIX}`; // prev moves
  const CHRCT_UUID_F5 = `0000fff5${UUID_SUFFIX}`; // gyro state, move counter, pre moves
  const CHRCT_UUID_F6 = `0000fff6${UUID_SUFFIX}`; // move counter, time offsets between premoves
  const CHRCT_UUID_F7 = `0000fff7${UUID_SUFFIX}`;

  let _service_v2data;
  let _chrct_v2read;
  let _chrct_v2write;
  const SERVICE_UUID_V2DATA = '6e400001-b5a3-f393-e0a9-e50e24dc4179';
  const CHRCT_UUID_V2READ = '28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4';
  const CHRCT_UUID_V2WRITE = '28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4';

  // List of Company Identifier Codes, fill with all values range [0x0001, 0xFF01] possible for GAN cubes
  const GAN_CIC_LIST = mathlib.valuedArray(256, (i) => (i << 8) | 0x01);

  let decoder = null;
  let deviceName = null;
  let deviceMac = null;

  const KEYS = [
    'NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA',
    'NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g',
    'NoRgNATGBs1gLABgQTjCeBWSUDsYBmKbCeMADjNnXxHIoIF0g',
    'NoRg7ANAzBCsAMEAsioxBEIAc0Cc0ATJkgSIYhXIjhMQGxgC6QA',
    'NoVgNAjAHGBMYDYCcdJgCwTFBkYVgAY9JpJYUsYBmAXSA',
    'NoRgNAbAHGAsAMkwgMyzClH0LFcArHnAJzIqIBMGWEAukA',
  ];

  /**
   * Generates encryption key for the cube based on version and value
   * @param {number} version - Version number used to select the key
   * @param {DataView} value - Value containing bytes to modify the key
   * @returns {Array<number>|undefined} Generated key or undefined if key not found
   */
  function getKey(version, value) {
    let key = KEYS[(version >> 8) & 0xff];
    if (!key) {
      return;
    }
    key = JSON.parse(LZString.decompressFromEncodedURIComponent(key));
    for (let i = 0; i < 6; i++) {
      key[i] = (key[i] + value.getUint8(5 - i)) & 0xff;
    }
    return key;
  }

  /**
   * Generates encryption key and initialization vector for V2 protocol
   * @param {Array<number>} value - MAC address bytes
   * @param {number} [ver=0] - Version number
   * @returns {Array<Array<number>>} Array containing [key, iv]
   */
  function getKeyV2(value, ver) {
    ver = ver || 0;
    const key = JSON.parse(
      LZString.decompressFromEncodedURIComponent(KEYS[2 + ver * 2]),
    );
    const iv = JSON.parse(
      LZString.decompressFromEncodedURIComponent(KEYS[3 + ver * 2]),
    );
    for (let i = 0; i < 6; i++) {
      key[i] = (key[i] + value[5 - i]) % 255;
      iv[i] = (iv[i] + value[5 - i]) % 255;
    }
    return [key, iv];
  }

  /**
   * Decodes encrypted data from the cube
   * @param {DataView} value - Encrypted data from the cube
   * @returns {Array<number>} Decoded data as byte array
   */
  function decode(value) {
    const ret = [];
    for (var i = 0; i < value.byteLength; i++) {
      ret[i] = value.getUint8(i);
    }
    if (decoder == null) {
      return ret;
    }
    const iv = decoder.iv || [];
    if (ret.length > 16) {
      const offset = ret.length - 16;
      const block = decoder.decrypt(ret.slice(offset));
      for (var i = 0; i < 16; i++) {
        ret[i + offset] = block[i] ^ ~~iv[i];
      }
    }
    decoder.decrypt(ret);
    for (var i = 0; i < 16; i++) {
      ret[i] ^= ~~iv[i];
    }
    return ret;
  }

  /**
   * Encodes data to send to the cube
   * @param {Array<number>} ret - Data to encode
   * @returns {Array<number>} Encoded data
   */
  function encode(ret) {
    if (decoder == null) {
      return ret;
    }
    const iv = decoder.iv || [];
    for (var i = 0; i < 16; i++) {
      ret[i] ^= ~~iv[i];
    }
    decoder.encrypt(ret);
    if (ret.length > 16) {
      const offset = ret.length - 16;
      const block = ret.slice(offset);
      for (var i = 0; i < 16; i++) {
        block[i] ^= ~~iv[i];
      }
      decoder.encrypt(block);
      for (var i = 0; i < 16; i++) {
        ret[i + offset] = block[i];
      }
    }
    return ret;
  }

  /**
   * Extracts manufacturer data bytes from Bluetooth advertisement data
   * @param {DataView|Map} mfData - Manufacturer data from Bluetooth advertisement
   * @returns {DataView|undefined} Manufacturer data bytes or undefined if not found
   */
  function getManufacturerDataBytes(mfData) {
    if (mfData instanceof DataView) {
      // this is workaround for Bluefy browser
      return mfData;
    }
    for (const id of GAN_CIC_LIST) {
      if (mfData.has(id)) {
        DEBUG
          && console.log(
            `[gancube] found Manufacturer Data under CIC = 0x${id
              .toString(16)
              .padStart(4, '0')}`,
          );
        return mfData.get(id);
      }
    }
    DEBUG && console.log('[gancube] Looks like this cube has new unknown CIC');
  }

  /**
   * Waits for Bluetooth advertisements to extract MAC address
   * @returns {Promise<string>} Promise resolving to MAC address or rejecting with error code
   */
  function waitForAdvs() {
    if (!_device?.watchAdvertisements) {
      return Promise.reject(-1);
    }
    const abortController = new AbortController();
    return new Promise((resolve, reject) => {
      const onAdvEvent = function (event) {
        DEBUG && console.log('[gancube] receive adv event', event);
        const mfData = event.manufacturerData;
        const dataView = getManufacturerDataBytes(mfData);
        if (dataView && dataView.byteLength >= 6) {
          const mac = [];
          for (let i = 0; i < 6; i++) {
            mac.push(
              (dataView.getUint8(dataView.byteLength - i - 1) + 0x100)
                .toString(16)
                .slice(1),
            );
          }
          _device?.removeEventListener('advertisementreceived', onAdvEvent);
          abortController.abort();
          resolve(mac.join(':'));
        }
      };
      _device.addEventListener('advertisementreceived', onAdvEvent);
      _device.watchAdvertisements({ signal: abortController.signal });
      setTimeout(() => {
        // reject if no mac found
        _device?.removeEventListener('advertisementreceived', onAdvEvent);
        abortController.abort();
        reject(-2);
      }, 10000);
    });
  }

  /**
   * Initializes encryption key for V2 protocol
   * @param {boolean} forcePrompt - Whether to force prompt for MAC address
   * @param {boolean} isWrongKey - Whether the previous key was wrong
   * @param {number} ver - Version number
   * @returns {void}
   */
  function v2initKey(forcePrompt, ver, providedMac) {
    if (deviceMac) {
      var savedMacMap = JSON.parse(getProp('giiMacMap', '{}'));
      const prevMac = savedMacMap[deviceName];
      if (prevMac && prevMac.toUpperCase() == deviceMac.toUpperCase()) {
        DEBUG && console.log('[gancube] v2init mac matched');
      } else {
        DEBUG && console.log('[gancube] v2init mac updated');
        savedMacMap[deviceName] = deviceMac;
        setProp('giiMacMap', JSON.stringify(savedMacMap));
      }
      v2initDecoder(deviceMac, ver);
    } else {
      var savedMacMap = JSON.parse(getProp('giiMacMap', '{}'));
      let mac = savedMacMap[deviceName];
      if (!mac || forcePrompt || providedMac) {
        mac = providedMac;
      }
      if (!mac) {
        DEBUG && console.log('[gancube] No MAC address provided');
        decoder = null;
        return;
      }
      const m = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.exec(mac);
      if (!m) {
        decoder = null;
        return;
      }
      if (mac != savedMacMap[deviceName]) {
        savedMacMap[deviceName] = mac;
        setProp('giiMacMap', JSON.stringify(savedMacMap));
      }
      v2initDecoder(mac, ver);
    }
  }

  /**
   * Initializes the AES decoder with the given MAC address and version
   * @param {string} mac - MAC address in format XX:XX:XX:XX:XX:XX
   * @param {number} ver - Version number
   * @returns {void}
   */
  function v2initDecoder(mac, ver) {
    const value = [];
    for (let i = 0; i < 6; i++) {
      value.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));
    }
    const keyiv = getKeyV2(value, ver);
    DEBUG && console.log('[gancube] ver=', ver, ' key=', JSON.stringify(keyiv));
    decoder = new AES128(keyiv[0]);
    decoder.iv = keyiv[1];
  }

  /**
   * Sends a request to the cube using V2 protocol
   * @param {Array<number>} req - Request data to send
   * @returns {Promise|undefined} Promise from writeValue or undefined if characteristic not found
   */
  function v2sendRequest(req) {
    if (!_chrct_v2write) {
      DEBUG && console.log('[gancube] v2sendRequest cannot find v2write chrct');
      return;
    }
    const encodedReq = encode(req.slice());
    DEBUG && console.log('[gancube] v2sendRequest', req, encodedReq);
    return _chrct_v2write.writeValue(new Uint8Array(encodedReq).buffer);
  }

  /**
   * Sends a simple request with just an opcode using V2 protocol
   * @param {number} opcode - Operation code to send
   * @returns {Promise|undefined} Promise from v2sendRequest
   */
  function v2sendSimpleRequest(opcode) {
    const req = mathlib.valuedArray(20, 0);
    req[0] = opcode;
    return v2sendRequest(req);
  }

  /**
   * Requests facelet state from the cube using V2 protocol
   * @returns {Promise|undefined} Promise from v2sendSimpleRequest
   */
  function v2requestFacelets() {
    return v2sendSimpleRequest(4);
  }

  /**
   * Requests battery level from the cube using V2 protocol
   * @returns {Promise|undefined} Promise from v2sendSimpleRequest
   */
  function v2requestBattery() {
    return v2sendSimpleRequest(9);
  }

  /**
   * Requests hardware information from the cube using V2 protocol
   * @returns {Promise|undefined} Promise from v2sendSimpleRequest
   */
  function v2requestHardwareInfo() {
    return v2sendSimpleRequest(5);
  }

  /**
   * Requests a reset of the cube using V2 protocol
   * @returns {Promise|undefined} Promise from v2sendRequest
   */
  function v2requestReset() {
    return v2sendRequest([
      10, 5, 57, 119, 0, 0, 1, 35, 69, 103, 137, 171, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  }

  /**
   * Initializes the V2 protocol communication with the cube
   * @param {number} ver - Version number
   * @returns {Promise} Promise chain for initialization
   */
  function v2init(ver, macAddress) {
    DEBUG && console.log('[gancube] v2init start');
    keyCheck = 0;
    v2initKey(true, ver, macAddress);
    return _service_v2data
      .getCharacteristics()
      .then((chrcts) => {
        DEBUG && console.log('[gancube] v2init find chrcts', chrcts);
        for (let i = 0; i < chrcts.length; i++) {
          const chrct = chrcts[i];
          DEBUG && console.log('[gancube] v2init find chrct', chrct.uuid);
          if (matchUUID(chrct.uuid, CHRCT_UUID_V2READ)) {
            _chrct_v2read = chrct;
          } else if (matchUUID(chrct.uuid, CHRCT_UUID_V2WRITE)) {
            _chrct_v2write = chrct;
          }
        }
        if (!_chrct_v2read) {
          DEBUG && console.log('[gancube] v2init cannot find v2read chrct');
        }
      })
      .then(() => {
        DEBUG && console.log('[gancube] v2init v2read start notifications');
        return _chrct_v2read.startNotifications();
      })
      .then(() => {
        DEBUG && console.log('[gancube] v2init v2read notification started');
        return _chrct_v2read.addEventListener(
          'characteristicvaluechanged',
          onStateChangedV2,
        );
      })
      .then(() => v2requestHardwareInfo())
      .then(() => v2requestFacelets())
      .then(() => v2requestBattery());
  }

  /**
   * Initializes communication with the GAN cube
   * @param {BluetoothDevice} device - Bluetooth device object
   * @returns {Promise} Promise chain for initialization
   */
  function init(device, macAddress) {
    clear();
    deviceName = device.name;
    DEBUG && console.log('[gancube] init gan cube start');
    return waitForAdvs()
      .then(
        (mac) => {
          DEBUG
            && console.log(
              `[gancube] init, found cube bluetooth hardware MAC = ${mac}`,
            );
          deviceMac = mac;
        },
        (err) => {
          DEBUG
            && console.log(
              `[gancube] init, unable to automatically determine cube MAC, error code = ${err}`,
            );
        },
      )
      .then(() => device.gatt.connect())
      .then((gatt) => {
        _gatt = gatt;
        return gatt.getPrimaryServices();
      })
      .then((services) => {
        for (let i = 0; i < services.length; i++) {
          const service = services[i];
          DEBUG
            && console.log('[gancube] checkHardware find service', service.uuid);
          if (matchUUID(service.uuid, SERVICE_UUID_META)) {
            _service_meta = service;
          } else if (matchUUID(service.uuid, SERVICE_UUID_DATA)) {
            _service_data = service;
          } else if (matchUUID(service.uuid, SERVICE_UUID_V2DATA)) {
            _service_v2data = service;
          }
        }
        if (_service_v2data) {
          return v2init(
            (deviceName || '').startsWith('AiCube') ? 1 : 0,
            macAddress,
          );
        }
        throw new Error('Wrong cube :(');
      });
  }

  let prevMoves = [];
  let timeOffs = [];
  let moveBuffer = []; // [ [moveCnt, move, ts, locTime], ... ]
  let prevCubie = new mathlib.CubieCube();
  let curCubie = new mathlib.CubieCube();
  let latestFacelet = mathlib.SOLVED_FACELET;
  let deviceTime = 0;
  let deviceTimeOffset = 0;
  let moveCnt = -1;
  let prevMoveCnt = -1;
  let movesFromLastCheck = 1000;
  let batteryLevel = 100;

  /**
   * Initializes the cube state and notifies the callback
   * @returns {void}
   */
  function initCubeState() {
    const locTime = Date.now();
    DEBUG && console.log('[gancube]', 'init cube state');
    callback(latestFacelet, [], [null, locTime], deviceName);
    prevCubie.fromFacelet(latestFacelet);
    prevMoveCnt = moveCnt;
    if (latestFacelet != getProp('giiSolved', mathlib.SOLVED_FACELET)) {
      const rst = getProp('giiRST');
      if (rst == 'a' || (rst == 'p' && confirm(CONFIRM_GIIRST))) {
        // giikerutil.markSolved();
      }
    }
  }

  /**
   * Checks the current state of the cube by reading facelet data
   * @returns {Promise<boolean>} Promise resolving to true if state was updated, false otherwise
   */
  function checkState() {
    if (movesFromLastCheck < 50) {
      return Promise.resolve(false);
    }
    return _chrct_f2.readValue().then((value) => {
      value = decode(value);
      const state = [];
      for (let i = 0; i < value.length - 2; i += 3) {
        const face = (value[i ^ 1] << 16) | (value[(i + 1) ^ 1] << 8) | value[(i + 2) ^ 1];
        for (let j = 21; j >= 0; j -= 3) {
          state.push('URFDLB'.charAt((face >> j) & 0x7));
          if (j == 12) {
            state.push('URFDLB'.charAt(i / 3));
          }
        }
      }
      latestFacelet = state.join('');
      movesFromLastCheck = 0;
      if (prevMoveCnt == -1) {
        initCubeState();
        return;
      }
      return Promise.resolve(true);
    });
  }

  /**
   * Updates move times and processes cube moves
   * @param {number} locTime - Local timestamp in milliseconds
   * @param {boolean} isV2 - Whether using V2 protocol
   * @returns {void}
   */
  function updateMoveTimes(locTime, isV2) {
    let moveDiff = (moveCnt - prevMoveCnt) & 0xff;
    DEBUG
      && moveDiff > 1
      && console.log(
        '[gancube]',
        `bluetooth event was lost, moveDiff = ${moveDiff}`,
      );
    prevMoveCnt = moveCnt;
    movesFromLastCheck += moveDiff;
    if (moveDiff > prevMoves.length) {
      movesFromLastCheck = 50;
      moveDiff = prevMoves.length;
    }
    let calcTs = deviceTime + deviceTimeOffset;
    for (var i = moveDiff - 1; i >= 0; i--) {
      calcTs += timeOffs[i];
    }
    if (!deviceTime || Math.abs(locTime - calcTs) > 2000) {
      DEBUG
        && console.log('[gancube]', 'time adjust', locTime - calcTs, '@', locTime);
      deviceTime += locTime - calcTs;
    }
    for (var i = moveDiff - 1; i >= 0; i--) {
      const m = 'URFDLB'.indexOf(prevMoves[i][0]) * 3 + " 2'".indexOf(prevMoves[i][1]);
      mathlib.CubieCube.EdgeMult(
        prevCubie,
        mathlib.CubieCube.moveCube[m],
        curCubie,
      );
      mathlib.CubieCube.CornMult(
        prevCubie,
        mathlib.CubieCube.moveCube[m],
        curCubie,
      );
      deviceTime += timeOffs[i];
      callback(
        curCubie.toFaceCube(),
        prevMoves.slice(i),
        [deviceTime, i == 0 ? locTime : null],
        deviceName + (isV2 ? '*' : ''),
      );

      // Log the cube state after applying the move
      console.log(`Move applied: ${prevMoves[i]}`);
      console.log(`Cube state after move: ${curCubie.toFaceCube()}`);

      // Dispatch a custom event with the updated cube state
      const cubeStateEvent = new CustomEvent('cubeStateChanged', {
        detail: {
          facelet: curCubie.toFaceCube(),
          move: prevMoves[i],
          corners: [...curCubie.ca],
          edges: [...curCubie.ea],
          timestamp: deviceTime,
        },
      });
      window.dispatchEvent(cubeStateEvent);

      const tmp = curCubie;
      curCubie = prevCubie;
      prevCubie = tmp;
      const moveEvent = new CustomEvent('move', {
        detail: { move: prevMoves[i], time: timeOffs[i] },
      });
      window.dispatchEvent(moveEvent);
      DEBUG && console.log('[gancube] move', prevMoves[i], timeOffs[i]);
    }
    deviceTimeOffset = locTime - deviceTime;
  }

  /**
   * Continuously reads cube state and processes moves
   * @returns {Promise|undefined} Promise chain for reading or undefined if device not connected
   */
  function loopRead() {
    if (!_device) {
      return;
    }
    return _chrct_f5
      .readValue()
      .then((value) => {
        value = decode(value);
        const locTime = Date.now();
        moveCnt = value[12];
        if (moveCnt == prevMoveCnt) {
          return;
        }
        prevMoves = [];
        for (let i = 0; i < 6; i++) {
          const m = value[13 + i];
          prevMoves.unshift('URFDLB'.charAt(~~(m / 3)) + " 2'".charAt(m % 3));
        }
        let f6val;
        return _chrct_f6
          .readValue()
          .then((value) => {
            value = decode(value);
            f6val = value;
            return checkState();
          })
          .then((isUpdated) => {
            if (isUpdated) {
              DEBUG
                && console.log(
                  '[gancube]',
                  'facelet state calc',
                  prevCubie.toFaceCube(),
                );
              DEBUG
                && console.log('[gancube]', 'facelet state read', latestFacelet);
              if (prevCubie.toFaceCube() != latestFacelet) {
                DEBUG && console.log('[gancube]', 'Cube state check error');
              }
              return;
            }

            timeOffs = [];
            for (let i = 0; i < 9; i++) {
              const off = f6val[i * 2 + 1] | (f6val[i * 2 + 2] << 8);
              timeOffs.unshift(off);
            }
            updateMoveTimes(locTime, 0);
          });
      })
      .then(loopRead);
  }

  /**
   * Gets the current battery level of the cube
   * @returns {Promise<[number, string]>} Promise resolving to [batteryLevel, deviceName]
   */
  function getBatteryLevel() {
    if (!_gatt) {
      return Promise.reject('Bluetooth Cube is not connected');
    }
    if (_service_v2data) {
      return Promise.resolve([batteryLevel, `${deviceName}*`]);
    }
    if (_chrct_f7) {
      return _chrct_f7.readValue().then((value) => {
        value = decode(value);
        return Promise.resolve([value[7], deviceName]);
      });
    }
    return Promise.resolve([batteryLevel, deviceName]);
  }

  var keyCheck = 0;

  /**
   * Event handler for V2 characteristic value changes
   * @param {Event} event - Bluetooth characteristic value changed event
   * @returns {void}
   */
  function onStateChangedV2(event) {
    const { value } = event.target;
    if (decoder == null) {
      return;
    }
    parseV2Data(value);
  }

  /**
   * Parses data received from the cube using V2 protocol
   * @param {DataView} value - Raw data from the cube
   * @returns {void}
   */
  function parseV2Data(value) {
    const locTime = Date.now();
    // DEBUG && console.log('[gancube]', 'dec v2', value);
    value = decode(value);
    for (var i = 0; i < value.length; i++) {
      value[i] = (value[i] + 256).toString(2).slice(1);
    }
    value = value.join('');
    const mode = parseInt(value.slice(0, 4), 2);
    if (mode == 1) {
      // gyro
      // Extract gyroscope data
      const gyroX = parseInt(value.slice(8, 16), 2) - 128; // Convert to signed value
      const gyroY = parseInt(value.slice(16, 24), 2) - 128;
      const gyroZ = parseInt(value.slice(24, 32), 2) - 128;

      // Log the gyroscope data
      // console.log('[gancube] Gyroscope data:', {
      //   x: gyroX,
      //   y: gyroY,
      //   z: gyroZ,
      //   timestamp: locTime
      // });

      // Dispatch a custom event with gyroscope data
      const gyroEvent = new CustomEvent('gyroData', {
        detail: {
          x: gyroX,
          y: gyroY,
          z: gyroZ,
          timestamp: locTime,
        },
      });
      window.dispatchEvent(gyroEvent);
    } else if (mode == 2) {
      // cube move
      // DEBUG && console.log('[gancube]', 'v2 received move event', value);
      moveCnt = parseInt(value.slice(4, 12), 2);
      if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {
        return;
      }
      timeOffs = [];
      prevMoves = [];
      let keyChkInc = 0;
      for (var i = 0; i < 7; i++) {
        const m = parseInt(value.slice(12 + i * 5, 17 + i * 5), 2);
        timeOffs[i] = parseInt(value.slice(47 + i * 16, 63 + i * 16), 2);
        prevMoves[i] = 'URFDLB'.charAt(m >> 1) + " '".charAt(m & 1);
        if (m >= 12) {
          // invalid data
          prevMoves[i] = 'U ';
          keyChkInc = 1;
        }
      }
      keyCheck += keyChkInc;
      if (keyChkInc == 0) {
        // Log the moves that will be processed
        console.log('V2 Protocol - Moves to be processed:', prevMoves);
        updateMoveTimes(locTime, 1);
        // Log the current cube state after all moves have been applied
        console.log(
          'V2 Protocol - Current cube state after all moves:',
          prevCubie.faceletToNumber(prevCubie.toFaceCube()),
        );
      }
    } else if (mode == 4) {
      // cube state
      // DEBUG && console.log('[gancube]', 'v2 received facelets event', value);
      moveCnt = parseInt(value.slice(4, 12), 2);
      const cc = new mathlib.CubieCube();
      let echk = 0;
      let cchk = 0xf00;
      for (var i = 0; i < 7; i++) {
        var perm = parseInt(value.slice(12 + i * 3, 15 + i * 3), 2);
        var ori = parseInt(value.slice(33 + i * 2, 35 + i * 2), 2);
        cchk -= ori << 3;
        cchk ^= perm;
        cc.ca[i] = (ori << 3) | perm;
      }
      cc.ca[7] = (cchk & 0xff8) % 24 | (cchk & 0x7);
      for (var i = 0; i < 11; i++) {
        var perm = parseInt(value.slice(47 + i * 4, 51 + i * 4), 2);
        var ori = parseInt(value.slice(91 + i, 92 + i), 2);
        echk ^= (perm << 1) | ori;
        cc.ea[i] = (perm << 1) | ori;
      }
      cc.ea[11] = echk;
      latestFacelet = cc.toFaceCube();
      DEBUG
        && console.log(
          '[gancube]',
          'v2 facelets event state parsed',
          latestFacelet,
        );

      // Update the prevCubie with the new state from the cube
      // Create a new CubieCube and copy the state since there's no clone method
      prevCubie = new mathlib.CubieCube();
      prevCubie.ca = [...cc.ca];
      prevCubie.ea = [...cc.ea];

      // Dispatch cube state changed event with the updated state
      // Only update the UI without changing the last move display
      const cubeStateEvent = new CustomEvent('cubeStateChanged', {
        detail: {
          facelet: latestFacelet,
          // Don't set move property here to avoid "State Update" appearing in Last Move
          corners: [...cc.ca],
          edges: [...cc.ea],
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(cubeStateEvent);

      if (
        latestFacelet
        === 'LLUDULLUDRFFURUBBFDRBBFFFRULFRFDRFBLBLBDLLDDURUUBBRDDR'
      ) {
        console.log('SOLVED');
        event = new CustomEvent('cubeSolved');
        window.dispatchEvent(event);
      } else {
        event = new CustomEvent('unSolved');
        window.dispatchEvent(event);
      }
      if (prevMoveCnt == -1) {
        initCubeState();
      }
    } else if (mode == 5) {
      // hardware info
      DEBUG
        && console.log('[gancube]', 'v2 received hardware info event', value);
      const hardwareVersion = `${parseInt(value.slice(8, 16), 2)}.${parseInt(
        value.slice(16, 24),
        2,
      )}`;
      const softwareVersion = `${parseInt(value.slice(24, 32), 2)}.${parseInt(
        value.slice(32, 40),
        2,
      )}`;
      let devName = '';
      for (var i = 0; i < 8; i++) {
        devName += String.fromCharCode(
          parseInt(value.slice(40 + i * 8, 48 + i * 8), 2),
        );
      }
      const gyroEnabled = parseInt(value.slice(104, 105), 2) === 1;
      DEBUG && console.log('[gancube]', 'Hardware Version', hardwareVersion);
      DEBUG && console.log('[gancube]', 'Software Version', softwareVersion);
      DEBUG && console.log('[gancube]', 'Device Name', devName);
      DEBUG && console.log('[gancube]', 'Gyro Enabled', gyroEnabled);
    } else if (mode == 9) {
      // battery
      DEBUG && console.log('[gancube]', 'v2 received battery event', value);
      batteryLevel = parseInt(value.slice(8, 16), 2);
      // giikerutil.updateBattery([batteryLevel, deviceName + '*']);
    } else {
      DEBUG && console.log('[gancube]', 'v2 received unknown event', value);
    }
  }

  /**
   * Clears all cube connections and resets state
   * @returns {Promise} Promise that resolves when cleanup is complete
   */
  function clear() {
    let result = Promise.resolve();
    if (_chrct_v2read) {
      _chrct_v2read.removeEventListener(
        'characteristicvaluechanged',
        onStateChangedV2,
      );
      result = _chrct_v2read.stopNotifications().catch(() => {});
      _chrct_v2read = null;
    }
    _service_data = null;
    _service_meta = null;
    _service_v2data = null;
    _gatt = null;
    deviceName = null;
    deviceMac = null;
    prevMoves = [];
    timeOffs = [];
    moveBuffer = [];
    prevCubie = new mathlib.CubieCube();
    curCubie = new mathlib.CubieCube();
    latestFacelet = mathlib.SOLVED_FACELET;
    deviceTime = 0;
    deviceTimeOffset = 0;
    moveCnt = -1;
    prevMoveCnt = -1;
    movesFromLastCheck = 1000;
    batteryLevel = 100;
    return result;
  }

  /**
   * Logs the current state of the cube to the console
   * This function can be called at any time to get the current state of the cube
   * without having to wait for a move to be made.
   *
   * Usage example:
   * ```
   * // Log the current cube state
   * GanCube.logCubeState();
   *
   * // Or listen for cube state changes
   * window.addEventListener('cubeStateChanged', (event) => {
   *   console.log('Cube state changed:', event.detail);
   * });
   * ```
   *
   * @returns {void}
   */
  function logCubeState() {
    console.log('=== Current Cube State ===');
    console.log('Facelet Representation:', prevCubie.toFaceCube());
    console.log('Corner Array:', prevCubie.ca);
    console.log('Edge Array:', prevCubie.ea);
    console.log('========================');

    return {
      facelet: prevCubie.toFaceCube(),
      corners: [...prevCubie.ca],
      edges: [...prevCubie.ea],
    };
  }

  return {
    init,
    opservs: [SERVICE_UUID_DATA, SERVICE_UUID_META, SERVICE_UUID_V2DATA],
    cics: GAN_CIC_LIST,
    getBatteryLevel,
    clear,
    v2requestFacelets,
    v2requestReset,
    logCubeState, // Export the function to allow manual logging
  };
}());
