/* eslint-disable */
import "./crypto.js"
import * as LZString from 'lz-string';
import { mathlib } from "./mathlib";

/**
 * Empty function that does nothing
 * @returns {void}
 */
window.$.noop = () => { };

/**
 * Returns the current timestamp in milliseconds
 * @returns {number} Current timestamp in milliseconds
 */
window.$.now = () => new Date().getTime();

(function () {
  const Sbox = [99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22];
  const SboxI = [];
  const ShiftTabI = [0, 13, 10, 7, 4, 1, 14, 11, 8, 5, 2, 15, 12, 9, 6, 3];
  const xtime = [];

  /**
   * Adds a round key to the state in AES
   * @param {Array<number>} state - Current state array (16 bytes)
   * @param {Array<number>} rkey - Round key array (16 bytes)
   * @returns {void}
   */
  function addRoundKey(state, rkey) {
    for (let i = 0; i < 16; i++) {
      state[i] ^= rkey[i];
    }
  }

  /**
   * Performs inverse shift rows, inverse sub bytes, and add round key operations
   * @param {Array<number>} state - Current state array (16 bytes)
   * @param {Array<number>} rkey - Round key array (16 bytes)
   * @returns {void}
   */
  function shiftSubAdd(state, rkey) {
    const state0 = state.slice();
    for (let i = 0; i < 16; i++) {
      state[i] = SboxI[state0[ShiftTabI[i]]] ^ rkey[i];
    }
  }

  /**
   * Performs add round key, sub bytes, and shift rows operations
   * @param {Array<number>} state - Current state array (16 bytes)
   * @param {Array<number>} rkey - Round key array (16 bytes)
   * @returns {void}
   */
  function shiftSubAddI(state, rkey) {
    const state0 = state.slice();
    for (let i = 0; i < 16; i++) {
      state[ShiftTabI[i]] = Sbox[state0[i] ^ rkey[i]];
    }
  }

  /**
   * Performs the mix columns operation in AES
   * @param {Array<number>} state - Current state array (16 bytes)
   * @returns {void}
   */
  function mixColumns(state) {
    for (let i = 12; i >= 0; i -= 4) {
      const s0 = state[i + 0];
      const s1 = state[i + 1];
      const s2 = state[i + 2];
      const s3 = state[i + 3];
      const h = s0 ^ s1 ^ s2 ^ s3;
      state[i + 0] ^= h ^ xtime[s0 ^ s1];
      state[i + 1] ^= h ^ xtime[s1 ^ s2];
      state[i + 2] ^= h ^ xtime[s2 ^ s3];
      state[i + 3] ^= h ^ xtime[s3 ^ s0];
    }
  }

  /**
   * Performs the inverse mix columns operation in AES
   * @param {Array<number>} state - Current state array (16 bytes)
   * @returns {void}
   */
  function mixColumnsInv(state) {
    for (let i = 0; i < 16; i += 4) {
      const s0 = state[i + 0];
      const s1 = state[i + 1];
      const s2 = state[i + 2];
      const s3 = state[i + 3];
      const h = s0 ^ s1 ^ s2 ^ s3;
      const xh = xtime[h];
      const h1 = xtime[xtime[xh ^ s0 ^ s2]] ^ h;
      const h2 = xtime[xtime[xh ^ s1 ^ s3]] ^ h;
      state[i + 0] ^= h1 ^ xtime[s0 ^ s1];
      state[i + 1] ^= h2 ^ xtime[s1 ^ s2];
      state[i + 2] ^= h1 ^ xtime[s2 ^ s3];
      state[i + 3] ^= h2 ^ xtime[s3 ^ s0];
    }
  }

  /**
   * Initializes the AES tables if not already initialized
   * @returns {void}
   */
  function init() {
    if (xtime.length != 0) {
      return;
    }
    for (let i = 0; i < 256; i++) {
      SboxI[Sbox[i]] = i;
    }
    for (let i = 0; i < 128; i++) {
      xtime[i] = i << 1;
      xtime[128 + i] = (i << 1) ^ 0x1b;
    }
  }

  /**
   * AES-128 constructor
   * @param {Array<number>} key - 16-byte key array
   * @constructor
   */
  function AES128(key) {
    init();
    const exKey = key.slice();
    let Rcon = 1;
    for (let i = 16; i < 176; i += 4) {
      let tmp = exKey.slice(i - 4, i);
      if (i % 16 == 0) {
        tmp = [Sbox[tmp[1]] ^ Rcon, Sbox[tmp[2]], Sbox[tmp[3]], Sbox[tmp[0]]];
        Rcon = xtime[Rcon];
      }
      for (let j = 0; j < 4; j++) {
        exKey[i + j] = exKey[i + j - 16] ^ tmp[j];
      }
    }
    this.key = exKey;
  }

  /**
   * Decrypts a 16-byte block using AES-128
   * @param {Array<number>} block - 16-byte block to decrypt
   * @returns {Array<number>} Decrypted block
   */
  AES128.prototype.decrypt = function (block) {
    addRoundKey(block, this.key.slice(160, 176));
    for (let i = 144; i >= 16; i -= 16) {
      shiftSubAdd(block, this.key.slice(i, i + 16));
      mixColumnsInv(block);
    }
    shiftSubAdd(block, this.key.slice(0, 16));
    return block;
  };

  /**
   * Encrypts a 16-byte block using AES-128
   * @param {Array<number>} block - 16-byte block to encrypt
   * @returns {Array<number>} Encrypted block
   */
  AES128.prototype.encrypt = function (block) {
    shiftSubAddI(block, this.key.slice(0, 16));
    for (let i = 16; i < 160; i += 16) {
      mixColumns(block);
      shiftSubAddI(block, this.key.slice(i, i + 16));
    }
    addRoundKey(block, this.key.slice(160, 176));
    return block;
  };

  /**
   * Creates a new AES-128 instance with the given key
   * @param {Array<number>} key - 16-byte key array
   * @returns {AES128} New AES-128 instance
   */
  window.$.aes128 = function (key) {
    return new AES128(key);
  };
}());

const DEBUG = true;

class Kernal {
  constructor() {
    this.props = {};
  }

  getProp(key, def) {
    if (this.props.hasOwnProperty(key)) {
      return this.props[key];
    }
    return def;
  }

  setProp(key, value) {
    this.props[key] = value;
  }
}

const kernel = new Kernal();

function matchUUID(uuid1, uuid2) {
  return uuid1.toUpperCase() == uuid2.toUpperCase();
}

const GanCube = (function () {
  let _device = null;

  const callback = window.$.noop;
  const evtCallback = window.$.noop;

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

  let _service_v3data;
  let _chrct_v3read;
  let _chrct_v3write;
  const SERVICE_UUID_V3DATA = '8653000a-43e6-47b7-9cb0-5fc21d4ae340';
  const CHRCT_UUID_V3READ = '8653000b-43e6-47b7-9cb0-5fc21d4ae340';
  const CHRCT_UUID_V3WRITE = '8653000c-43e6-47b7-9cb0-5fc21d4ae340';

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

  function getKey(version, value) {
    let key = KEYS[version >> 8 & 0xff];
    if (!key) {
      return;
    }
    key = JSON.parse(LZString.decompressFromEncodedURIComponent(key));
    for (let i = 0; i < 6; i++) {
      key[i] = (key[i] + value.getUint8(5 - i)) & 0xff;
    }
    return key;
  }

  function getKeyV2(value, ver) {
    ver = ver || 0;
    const key = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[2 + ver * 2]));
    const iv = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[3 + ver * 2]));
    for (let i = 0; i < 6; i++) {
      key[i] = (key[i] + value[5 - i]) % 255;
      iv[i] = (iv[i] + value[5 - i]) % 255;
    }
    return [key, iv];
  }

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
        ret[i + offset] = block[i] ^ (~~iv[i]);
      }
    }
    decoder.decrypt(ret);
    for (var i = 0; i < 16; i++) {
      ret[i] ^= (~~iv[i]);
    }
    return ret;
  }

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

  function getManufacturerDataBytes(mfData) {
    if (mfData instanceof DataView) { // this is workaround for Bluefy browser
      return mfData;
    }
    for (const id of GAN_CIC_LIST) {
      if (mfData.has(id)) {
        DEBUG && console.log(`[gancube] found Manufacturer Data under CIC = 0x${id.toString(16).padStart(4, '0')}`);
        return mfData.get(id);
      }
    }
    DEBUG && console.log('[gancube] Looks like this cube has new unknown CIC');
  }

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
            mac.push((dataView.getUint8(dataView.byteLength - i - 1) + 0x100).toString(16).slice(1));
          }
          _device?.removeEventListener('advertisementreceived', onAdvEvent);
          abortController.abort();
          resolve(mac.join(':'));
        }
      };
      _device.addEventListener('advertisementreceived', onAdvEvent);
      _device.watchAdvertisements({ signal: abortController.signal });
      setTimeout(() => { // reject if no mac found
        _device?.removeEventListener('advertisementreceived', onAdvEvent);
        abortController.abort();
        reject(-2);
      }, 10000);
    });
  }

  function v2initKey(forcePrompt, isWrongKey, ver) {
    if (deviceMac) {
      var savedMacMap = JSON.parse(kernel.getProp('giiMacMap', '{}'));
      const prevMac = savedMacMap[deviceName];
      if (prevMac && prevMac.toUpperCase() == deviceMac.toUpperCase()) {
        DEBUG && console.log('[gancube] v2init mac matched');
      } else {
        DEBUG && console.log('[gancube] v2init mac updated');
        savedMacMap[deviceName] = deviceMac;
        kernel.setProp('giiMacMap', JSON.stringify(savedMacMap));
      }
      v2initDecoder(deviceMac, ver);
    } else {
      var savedMacMap = JSON.parse(kernel.getProp('giiMacMap', '{}'));
      let mac = savedMacMap[deviceName];
      if (!mac || forcePrompt) {
        mac = 'AB:12:34:5F:B0:C4';
      }
      const m = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.exec(mac);
      if (!m) {
        logohint.push(LGHINT_BTINVMAC);
        decoder = null;
        return;
      }
      if (mac != savedMacMap[deviceName]) {
        savedMacMap[deviceName] = mac;
        kernel.setProp('giiMacMap', JSON.stringify(savedMacMap));
      }
      v2initDecoder(mac, ver);
    }
  }

  function v2initDecoder(mac, ver) {
    const value = [];
    for (let i = 0; i < 6; i++) {
      value.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));
    }
    const keyiv = getKeyV2(value, ver);
    DEBUG && console.log('[gancube] ver=', ver, ' key=', JSON.stringify(keyiv));
    decoder = window.$.aes128(keyiv[0]);
    decoder.iv = keyiv[1];
  }

  function v2sendRequest(req) {
    if (!_chrct_v2write) {
      DEBUG && console.log('[gancube] v2sendRequest cannot find v2write chrct');
      return;
    }
    const encodedReq = encode(req.slice());
    DEBUG && console.log('[gancube] v2sendRequest', req, encodedReq);
    return _chrct_v2write.writeValue(new Uint8Array(encodedReq).buffer);
  }

  function v2sendSimpleRequest(opcode) {
    const req = mathlib.valuedArray(20, 0);
    req[0] = opcode;
    return v2sendRequest(req);
  }

  function v2requestFacelets() {
    return v2sendSimpleRequest(4);
  }

  function v2requestBattery() {
    return v2sendSimpleRequest(9);
  }

  function v2requestHardwareInfo() {
    return v2sendSimpleRequest(5);
  }

  function v2requestReset() {
    return v2sendRequest([10, 5, 57, 119, 0, 0, 1, 35, 69, 103, 137, 171, 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  function v2init(ver) {
    DEBUG && console.log('[gancube] v2init start');
    keyCheck = 0;
    v2initKey(true, false, ver);
    return _service_v2data.getCharacteristics().then((chrcts) => {
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
    }).then(() => {
      DEBUG && console.log('[gancube] v2init v2read start notifications');
      return _chrct_v2read.startNotifications();
    }).then(() => {
      DEBUG && console.log('[gancube] v2init v2read notification started');
      return _chrct_v2read.addEventListener('characteristicvaluechanged', onStateChangedV2);
    })
      .then(() => v2requestHardwareInfo())
      .then(() => v2requestFacelets())
      .then(() => v2requestBattery());
  }

  function v3sendRequest(req) {
    if (!_chrct_v3write) {
      DEBUG && console.log('[gancube] v3sendRequest cannot find v3write chrct');
      return;
    }
    const encodedReq = encode(req.slice());
    DEBUG && console.log('[gancube] v3sendRequest', req, encodedReq);
    return _chrct_v3write.writeValue(new Uint8Array(encodedReq).buffer);
  }

  function v3sendSimpleRequest(opcode) {
    const req = mathlib.valuedArray(16, 0);
    req[0] = 0x68;
    req[1] = opcode;
    return v3sendRequest(req);
  }

  function v3requestFacelets() {
    return v3sendSimpleRequest(1);
  }

  function v3requestBattery() {
    return v3sendSimpleRequest(7);
  }

  function v3requestHardwareInfo() {
    return v3sendSimpleRequest(4);
  }

  function v3init() {
    DEBUG && console.log('[gancube] v3init start');
    keyCheck = 0;
    v2initKey(true, false, 0);
    return _service_v3data.getCharacteristics().then((chrcts) => {
      DEBUG && console.log('[gancube] v3init find chrcts', chrcts);
      for (let i = 0; i < chrcts.length; i++) {
        const chrct = chrcts[i];
        DEBUG && console.log('[gancube] v3init find chrct', chrct.uuid);
        if (matchUUID(chrct.uuid, CHRCT_UUID_V3READ)) {
          _chrct_v3read = chrct;
        } else if (matchUUID(chrct.uuid, CHRCT_UUID_V3WRITE)) {
          _chrct_v3write = chrct;
        }
      }
      if (!_chrct_v3read) {
        DEBUG && console.log('[gancube] v3init cannot find v3read chrct');
      }
    }).then(() => {
      DEBUG && console.log('[gancube] v3init v3read start notifications');
      return _chrct_v3read.startNotifications();
    }).then(() => {
      DEBUG && console.log('[gancube] v3init v3read notification started');
      return _chrct_v3read.addEventListener('characteristicvaluechanged', onStateChangedV3);
    })
      .then(() => v3requestHardwareInfo())
      .then(() => v3requestFacelets())
      .then(() => v3requestBattery());
  }

  function init(device) {
    clear();
    deviceName = device.name;
    DEBUG && console.log('[gancube] init gan cube start');
    return waitForAdvs().then((mac) => {
      DEBUG && console.log(`[gancube] init, found cube bluetooth hardware MAC = ${mac}`);
      deviceMac = mac;
    }, (err) => {
      DEBUG && console.log(`[gancube] init, unable to automatically determine cube MAC, error code = ${err}`);
    }).then(() => device.gatt.connect()).then((gatt) => {
      _gatt = gatt;
      return gatt.getPrimaryServices();
    })
      .then((services) => {
        for (let i = 0; i < services.length; i++) {
          const service = services[i];
          DEBUG && console.log('[gancube] checkHardware find service', service.uuid);
          if (matchUUID(service.uuid, SERVICE_UUID_META)) {
            _service_meta = service;
          } else if (matchUUID(service.uuid, SERVICE_UUID_DATA)) {
            _service_data = service;
          } else if (matchUUID(service.uuid, SERVICE_UUID_V2DATA)) {
            _service_v2data = service;
          } else if (matchUUID(service.uuid, SERVICE_UUID_V3DATA)) {
            _service_v3data = service;
          }
        }
        if (_service_v2data) {
          return v2init((deviceName || '').startsWith('AiCube') ? 1 : 0);
        } if (_service_v3data) {
          return v3init();
        }
        logohint.push(LGHINT_BTNOTSUP);
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

  function initCubeState() {
    const locTime = window.$.now();
    DEBUG && console.log('[gancube]', 'init cube state');
    callback(latestFacelet, [], [null, locTime], deviceName);
    prevCubie.fromFacelet(latestFacelet);
    prevMoveCnt = moveCnt;
    if (latestFacelet != kernel.getProp('giiSolved', mathlib.SOLVED_FACELET)) {
      const rst = kernel.getProp('giiRST');
      if (rst == 'a' || rst == 'p' && confirm(CONFIRM_GIIRST)) {
        // giikerutil.markSolved();
      }
    }
  }

  function checkState() {
    if (movesFromLastCheck < 50) {
      return Promise.resolve(false);
    }
    return _chrct_f2.readValue().then((value) => {
      value = decode(value);
      const state = [];
      for (let i = 0; i < value.length - 2; i += 3) {
        const face = value[i ^ 1] << 16 | value[i + 1 ^ 1] << 8 | value[i + 2 ^ 1];
        for (let j = 21; j >= 0; j -= 3) {
          state.push('URFDLB'.charAt(face >> j & 0x7));
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

  function updateMoveTimes(locTime, isV2) {
    let moveDiff = (moveCnt - prevMoveCnt) & 0xff;
    DEBUG && moveDiff > 1 && console.log('[gancube]', `bluetooth event was lost, moveDiff = ${moveDiff}`);
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
      DEBUG && console.log('[gancube]', 'time adjust', locTime - calcTs, '@', locTime);
      deviceTime += locTime - calcTs;
    }
    for (var i = moveDiff - 1; i >= 0; i--) {
      const m = 'URFDLB'.indexOf(prevMoves[i][0]) * 3 + " 2'".indexOf(prevMoves[i][1]);
      mathlib.CubieCube.EdgeMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
      mathlib.CubieCube.CornMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
      deviceTime += timeOffs[i];
      callback(curCubie.toFaceCube(), prevMoves.slice(i), [deviceTime, i == 0 ? locTime : null], deviceName + (isV2 ? '*' : ''));
      const tmp = curCubie;
      curCubie = prevCubie;
      prevCubie = tmp;
      const moveEvent = new CustomEvent('move', { detail: { move: prevMoves[i], time: timeOffs[i] } });
      window.dispatchEvent(moveEvent);
      DEBUG && console.log('[gancube] move', prevMoves[i], timeOffs[i]);
    }
    deviceTimeOffset = locTime - deviceTime;
  }

  function loopRead() {
    if (!_device) {
      return;
    }
    return _chrct_f5.readValue().then((value) => {
      value = decode(value);
      const locTime = window.$.now();
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
      return _chrct_f6.readValue().then((value) => {
        value = decode(value);
        f6val = value;
        return checkState();
      }).then((isUpdated) => {
        if (isUpdated) {
          DEBUG && console.log('[gancube]', 'facelet state calc', prevCubie.toFaceCube());
          DEBUG && console.log('[gancube]', 'facelet state read', latestFacelet);
          if (prevCubie.toFaceCube() != latestFacelet) {
            DEBUG && console.log('[gancube]', 'Cube state check error');
          }
          return;
        }

        timeOffs = [];
        for (let i = 0; i < 9; i++) {
          const off = f6val[i * 2 + 1] | f6val[i * 2 + 2] << 8;
          timeOffs.unshift(off);
        }
        updateMoveTimes(locTime, 0);
      });
    }).then(loopRead);
  }

  function getBatteryLevel() {
    if (!_gatt) {
      return Promise.reject('Bluetooth Cube is not connected');
    }
    if (_service_v2data || _service_v3data) {
      return Promise.resolve([batteryLevel, `${deviceName}*`]);
    } if (_chrct_f7) {
      return _chrct_f7.readValue().then((value) => {
        value = decode(value);
        return Promise.resolve([value[7], deviceName]);
      });
    }
    return Promise.resolve([batteryLevel, deviceName]);
  }

  var keyCheck = 0;

  function onStateChangedV2(event) {
    const { value } = event.target;
    if (decoder == null) {
      return;
    }
    parseV2Data(value);
  }

  function parseV2Data(value) {
    const locTime = window.$.now();
    // DEBUG && console.log('[gancube]', 'dec v2', value);
    value = decode(value);
    for (var i = 0; i < value.length; i++) {
      value[i] = (value[i] + 256).toString(2).slice(1);
    }
    value = value.join('');
    const mode = parseInt(value.slice(0, 4), 2);
    if (mode == 1) { // gyro
    } else if (mode == 2) { // cube move
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
        if (m >= 12) { // invalid data
          prevMoves[i] = 'U ';
          keyChkInc = 1;
        }
      }
      keyCheck += keyChkInc;
      if (keyChkInc == 0) {
        updateMoveTimes(locTime, 1);
      }
    } else if (mode == 4) { // cube state
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
        cc.ca[i] = ori << 3 | perm;
      }
      cc.ca[7] = (cchk & 0xff8) % 24 | cchk & 0x7;
      for (var i = 0; i < 11; i++) {
        var perm = parseInt(value.slice(47 + i * 4, 51 + i * 4), 2);
        var ori = parseInt(value.slice(91 + i, 92 + i), 2);
        echk ^= perm << 1 | ori;
        cc.ea[i] = perm << 1 | ori;
      }
      cc.ea[11] = echk;
      if (cc.verify() != 0) {
        keyCheck++;
        DEBUG && console.log('[gancube]', 'v2 facelets state verify error');
        event = new CustomEvent('unSolved');
        window.dispatchEvent(event);
        return;
      }
      latestFacelet = cc.toFaceCube();
      DEBUG && console.log('[gancube]', 'v2 facelets event state parsed', latestFacelet);
      if (latestFacelet === 'LLUDULLUDRFFURUBBFDRBBFFFRULFRFDRFBLBLBDLLDDURUUBBRDDR') {
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
    } else if (mode == 5) { // hardware info
      DEBUG && console.log('[gancube]', 'v2 received hardware info event', value);
      const hardwareVersion = `${parseInt(value.slice(8, 16), 2)}.${parseInt(value.slice(16, 24), 2)}`;
      const softwareVersion = `${parseInt(value.slice(24, 32), 2)}.${parseInt(value.slice(32, 40), 2)}`;
      let devName = '';
      for (var i = 0; i < 8; i++) devName += String.fromCharCode(parseInt(value.slice(40 + i * 8, 48 + i * 8), 2));
      const gyroEnabled = parseInt(value.slice(104, 105), 2) === 1;
      DEBUG && console.log('[gancube]', 'Hardware Version', hardwareVersion);
      DEBUG && console.log('[gancube]', 'Software Version', softwareVersion);
      DEBUG && console.log('[gancube]', 'Device Name', devName);
      DEBUG && console.log('[gancube]', 'Gyro Enabled', gyroEnabled);
    } else if (mode == 9) { // battery
      DEBUG && console.log('[gancube]', 'v2 received battery event', value);
      batteryLevel = parseInt(value.slice(8, 16), 2);
      // giikerutil.updateBattery([batteryLevel, deviceName + '*']);
    } else {
      DEBUG && console.log('[gancube]', 'v2 received unknown event', value);
    }
  }

  // Check if circular move number (modulo 256) fits into (start,end) range exclusive.
  function isMoveNumberInRange(start, end, moveCnt) {
    return ((end - start) & 0xFF) > ((moveCnt - start) & 0xFF)
      && ((start - moveCnt) & 0xFF) > 0
      && ((end - moveCnt) & 0xFF) > 0;
  }

  function v3InjectLostMoveToBuffer(move) {
    if (moveBuffer.length > 0) {
      // Skip if move with the same number already in the buffer
      if (moveBuffer.some((e) => e[0] == move[0])) return;
      // Skip if move number does not fit in range between last evicted move number and move number on buffer head, i.e. move must be one of missed
      if (!isMoveNumberInRange(prevMoveCnt, moveBuffer[0][0], move[0])) return;
      // Lost moves should be injected in reverse order, so just put suitable move on buffer head
      if (move[0] == ((moveBuffer[0][0] - 1) & 0xFF)) {
        move[2] = moveBuffer[0][2] - 10; // Set lost move device hardware timestamp near to next move event
        moveBuffer.unshift(move);
        DEBUG && console.log('[gancube]', 'v3 lost move recovered', move[0], move[1]);
      }
    }
  }

  function v3requestMoveHistory(startMoveCnt, numberOfMoves) {
    const req = mathlib.valuedArray(16, 0);
    // Move history response data is byte-aligned, and moves always starting with near-ceil odd serial number, regardless of requested.
    // Adjust start move and number of moves to get odd number aligned history window with even number of moves inside.
    if (startMoveCnt % 2 == 0) startMoveCnt = (startMoveCnt - 1) & 0xFF;
    if (numberOfMoves % 2 == 1) numberOfMoves++;
    // Never overflow requested history window beyond the move number cycle edge 255 -> 0.
    // Because due to iCarry2 firmware bug the moves beyond the edge spoofed with 'D' (just zero bytes).
    numberOfMoves = Math.min(numberOfMoves, startMoveCnt + 1);
    req[0] = 0x68;
    req[1] = 0x03;
    req[2] = startMoveCnt;
    req[3] = 0;
    req[4] = numberOfMoves;
    req[5] = 0;
    // We can safely suppress and ignore possible GATT write errors, v3requestMoveHistory command is automatically retried on each move event if needed
    return v3sendRequest(req).catch(window.$.noop);
  }

  function v3EvictMoveBuffer(reqLostMoves) {
    while (moveBuffer.length > 0) {
      const diff = (moveBuffer[0][0] - prevMoveCnt) & 0xFF;
      if (diff > 1) {
        DEBUG && console.log('[gancube]', 'v3 lost move detected', prevMoveCnt, moveBuffer[0][0], diff);
        if (reqLostMoves) {
          v3requestMoveHistory(moveBuffer[0][0], diff);
        }
        break;
      } else {
        const move = moveBuffer.shift();
        const m = 'URFDLB'.indexOf(move[1][0]) * 3 + " 2'".indexOf(move[1][1]);
        mathlib.CubieCube.EdgeMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
        mathlib.CubieCube.CornMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
        prevMoves.unshift(move[1]);
        if (prevMoves.length > 8) prevMoves = prevMoves.slice(0, 8);
        callback(curCubie.toFaceCube(), prevMoves, [move[2], move[3]], `${deviceName}*`);
        const tmp = curCubie;
        curCubie = prevCubie;
        prevCubie = tmp;
        prevMoveCnt = move[0];
        DEBUG && console.log('[gancube]', 'v3 move evicted from fifo buffer', move[0], move[1], move[2], move[3]);
      }
    }
    if (moveBuffer.length > 32) { // Something wrong, moves are not evicted from buffer, force cube disconnection
      onDisconnect();
    }
  }

  function onStateChangedV3(event) {
    const { value } = event.target;
    if (decoder == null) {
      return;
    }
    parseV3Data(value);
  }

  function parseV3Data(value) {
    const locTime = window.$.now();
    DEBUG && console.log('[gancube]', 'v3 raw message', value);
    value = decode(value);
    for (var i = 0; i < value.length; i++) {
      value[i] = (value[i] + 256).toString(2).slice(1);
    }
    value = value.join('');
    DEBUG && console.log('[gancube]', 'v3 decrypted message', value);
    const magic = parseInt(value.slice(0, 8), 2);
    const mode = parseInt(value.slice(8, 16), 2);
    const len = parseInt(value.slice(16, 24), 2);
    if (magic != 0x55 || len <= 0) {
      DEBUG && console.log('[gancube]', 'v3 invalid magic or len', value);
      return;
    }
    if (mode == 1) { // cube move
      DEBUG && console.log('[gancube]', 'v3 received move event', value);
      moveCnt = parseInt(value.slice(64, 72) + value.slice(56, 64), 2);
      if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {
        return;
      }
      const ts = parseInt(value.slice(48, 56) + value.slice(40, 48) + value.slice(32, 40) + value.slice(24, 32), 2);
      var pow = parseInt(value.slice(72, 74), 2);
      var axis = [2, 32, 8, 1, 16, 4].indexOf(parseInt(value.slice(74, 80), 2));
      if (axis == -1) {
        DEBUG && console.log('[gancube]', 'v3 move event invalid axis');
        return;
      }
      var move = 'URFDLB'.charAt(axis) + " '".charAt(pow);
      moveBuffer.push([moveCnt, move, ts, locTime]);
      DEBUG && console.log('[gancube]', 'v3 move placed to fifo buffer', moveCnt, move, ts, locTime);
      v3EvictMoveBuffer(true);
    } else if (mode == 2) { // cube state
      DEBUG && console.log('[gancube]', 'v3 received facelets event', value);
      moveCnt = parseInt(value.slice(32, 40) + value.slice(24, 32), 2);
      const cc = new mathlib.CubieCube();
      let echk = 0;
      let cchk = 0xf00;
      for (var i = 0; i < 7; i++) {
        var perm = parseInt(value.slice(40 + i * 3, 43 + i * 3), 2);
        var ori = parseInt(value.slice(61 + i * 2, 63 + i * 2), 2);
        cchk -= ori << 3;
        cchk ^= perm;
        cc.ca[i] = ori << 3 | perm;
      }
      cc.ca[7] = (cchk & 0xff8) % 24 | cchk & 0x7;
      for (var i = 0; i < 11; i++) {
        var perm = parseInt(value.slice(77 + i * 4, 81 + i * 4), 2);
        var ori = parseInt(value.slice(121 + i, 122 + i), 2);
        echk ^= perm << 1 | ori;
        cc.ea[i] = perm << 1 | ori;
      }
      cc.ea[11] = echk;
      if (cc.verify() != 0) {
        keyCheck++;
        DEBUG && console.log('[gancube]', 'v3 facelets state verify error');
        return;
      }
      latestFacelet = cc.toFaceCube();
      DEBUG && console.log('[gancube]', 'v3 facelets event state parsed', latestFacelet);
      if (prevMoveCnt == -1) {
        initCubeState();
      }
    } else if (mode == 6) { // move history
      DEBUG && console.log('[gancube]', 'v3 received move history event', value);
      const startMoveCnt = parseInt(value.slice(24, 32), 2);
      const numberOfMoves = (len - 1) * 2;
      for (var i = 0; i < numberOfMoves; i++) {
        var axis = parseInt(value.slice(32 + 4 * i, 35 + 4 * i), 2);
        var pow = parseInt(value.slice(35 + 4 * i, 36 + 4 * i), 2);
        if (axis < 6) {
          var move = 'DUBFLR'.charAt(axis) + " '".charAt(pow);
          v3InjectLostMoveToBuffer([(startMoveCnt - i) & 0xFF, move, null, null]);
        }
      }
      v3EvictMoveBuffer(false);
    } else if (mode == 7) { // hardware info
      DEBUG && console.log('[gancube]', 'v3 received hardware info event', value);
      const hardwareVersion = `${parseInt(value.slice(80, 84), 2)}.${parseInt(value.slice(84, 88), 2)}`;
      const softwareVersion = `${parseInt(value.slice(72, 76), 2)}.${parseInt(value.slice(76, 80), 2)}`;
      let devName = '';
      for (var i = 0; i < 5; i++) devName += String.fromCharCode(parseInt(value.slice(32 + i * 8, 40 + i * 8), 2));
      DEBUG && console.log('[gancube]', 'Hardware Version', hardwareVersion);
      DEBUG && console.log('[gancube]', 'Software Version', softwareVersion);
      DEBUG && console.log('[gancube]', 'Device Name', devName);
    } else if (mode == 16) { // battery
      DEBUG && console.log('[gancube]', 'v3 received battery event', value);
      batteryLevel = parseInt(value.slice(24, 32), 2);
      // giikerutil.updateBattery([batteryLevel, deviceName + '*']);
    } else {
      DEBUG && console.log('[gancube]', 'v3 received unknown event', value);
    }
  }

  function clear() {
    let result = Promise.resolve();
    if (_chrct_v2read) {
      _chrct_v2read.removeEventListener('characteristicvaluechanged', onStateChangedV2);
      result = _chrct_v2read.stopNotifications().catch(window.$.noop);
      _chrct_v2read = null;
    }
    if (_chrct_v3read) {
      _chrct_v3read.removeEventListener('characteristicvaluechanged', onStateChangedV3);
      result = _chrct_v3read.stopNotifications().catch(window.$.noop);
      _chrct_v3read = null;
    }
    _service_data = null;
    _service_meta = null;
    _service_v2data = null;
    _service_v3data = null;
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

  return {
    init,
    opservs: [SERVICE_UUID_DATA, SERVICE_UUID_META, SERVICE_UUID_V2DATA, SERVICE_UUID_V3DATA],
    cics: GAN_CIC_LIST,
    getBatteryLevel,
    clear,
  };
}());


const GiikerCube = function () {
  let cube;
  let _device = null;
  const solved = false;

  function onHardwareEvent(info, event) {
    let res = Promise.resolve();
    if (info == 'disconnect') {
      res = Promise.resolve(stop());
    }
    return res.then(() => typeof evtCallback === 'function' && evtCallback(info, event));
  }

  const onDisconnect = onHardwareEvent.bind(null, 'disconnect');

  function init(timer) {
    if (!window.navigator.bluetooth) {
      alert('NO BLUETOOTH ON BROWSER');
      return Promise.reject();
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
          namePrefix: 'Gi',
        }, {
          namePrefix: 'Mi Smart',
        }, {
          namePrefix: 'GAN',
        }, {
          namePrefix: 'MG',
        }, {
          namePrefix: 'AiCube',
        }, {
          namePrefix: 'GoCube',
        }, {
          namePrefix: 'Rubiks',
        }, {
          namePrefix: 'MHC',
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
        return GanCube.init(device);
      }
      return Promise.reject('Cannot detect device type');
    });
  }

  function stop() {
    if (!_device) {
      return Promise.resolve();
    }
    return Promise.resolve(cube?.clear()).then(() => {
      _device.removeEventListener('gattserverdisconnected', onDisconnect);
      _device.gatt.disconnect();
      _device = null;
    });
  }

  return {
    init,
    stop,
    isConnected() {
      return _device != null || DEBUGBL;
    },
    setCallback(func) {
      callback = func;
    },
    setEventCallback(func) {
      evtCallback = func;
    },
    getCube() {
      return cube || (DEBUGBL && {
        getBatteryLevel() { return Promise.resolve(80); },
      });
    },
  };
};

// Export GiikerCube to the global scope
export const giikerCube = GiikerCube();
