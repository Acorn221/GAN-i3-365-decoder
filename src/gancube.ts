/* eslint-disable */

import * as LZString from 'lz-string';
import { mathlib } from './mathlib';
import { AES128 } from './aes128';
import { matchUUID, EventEmitter } from './utils';
import { CubeNumberConverter } from './cubenum';

/**
 * Event types for GanCube
 * This is exported so it can be reused by other components
 */
export interface GanCubeEventMap {
  // Gyroscope data event
  gyroData: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  
  // Cube state changed event
  cubeStateChanged: {
    facelet: string;
    corners?: number[];
    edges?: number[];
    move?: string;
    timestamp: number;
  };
  
  // Cube solved event
  cubeSolved: Record<string, never>;
  
  // Cube unsolved event
  unSolved: Record<string, never>;
  
  // Move event
  move: {
    move: string;
    time: number;
  };
}

export class GanCube extends EventEmitter<GanCubeEventMap> {
	private readonly debug: boolean = true; // Enable debug mode temporarily to help diagnose issues
	
	// Internal state storage
	private props: Record<string, any> = {};
	
	// Bluetooth device and connection
	private _device: BluetoothDevice | null = null;
	private _gatt: BluetoothRemoteGATTServer | null = null;
	private _service_data: BluetoothRemoteGATTService | null = null;
	private _service_meta: BluetoothRemoteGATTService | null = null;
	private _chrct_f2: BluetoothRemoteGATTCharacteristic | null = null;
	private _chrct_f5: BluetoothRemoteGATTCharacteristic | null = null;
	private _chrct_f6: BluetoothRemoteGATTCharacteristic | null = null;
	private _chrct_f7: BluetoothRemoteGATTCharacteristic | null = null;
	
	// V2 protocol specific
	private _service_v2data: BluetoothRemoteGATTService | null = null;
	private _chrct_v2read: BluetoothRemoteGATTCharacteristic | null = null;
	private _chrct_v2write: BluetoothRemoteGATTCharacteristic | null = null;
	
	// UUID constants
	private readonly UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';
	private readonly SERVICE_UUID_META = `0000180a${this.UUID_SUFFIX}`;
	private readonly CHRCT_UUID_VERSION = `00002a28${this.UUID_SUFFIX}`;
	private readonly CHRCT_UUID_HARDWARE = `00002a23${this.UUID_SUFFIX}`;
	private readonly SERVICE_UUID_DATA = `0000fff0${this.UUID_SUFFIX}`;
	private readonly CHRCT_UUID_F2 = `0000fff2${this.UUID_SUFFIX}`; // cube state, (54 - 6) facelets, 3 bit per facelet
	private readonly CHRCT_UUID_F3 = `0000fff3${this.UUID_SUFFIX}`; // prev moves
	private readonly CHRCT_UUID_F5 = `0000fff5${this.UUID_SUFFIX}`; // gyro state, move counter, pre moves
	private readonly CHRCT_UUID_F6 = `0000fff6${this.UUID_SUFFIX}`; // move counter, time offsets between premoves
	private readonly CHRCT_UUID_F7 = `0000fff7${this.UUID_SUFFIX}`;
	
	// V2 protocol UUIDs
	private readonly SERVICE_UUID_V2DATA = '6e400001-b5a3-f393-e0a9-e50e24dc4179';
	private readonly CHRCT_UUID_V2READ = '28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4';
	private readonly CHRCT_UUID_V2WRITE = '28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4';
	
	// List of Company Identifier Codes for GAN cubes
	private readonly GAN_CIC_LIST: number[] = mathlib.valuedArray(256, (i: number) => (i << 8) | 0x01);
	
	// Encryption
	private decoder: AES128 | null = null;
	private deviceName: string | null = null;
	private deviceMac: string | null = null;
	
	// Encryption keys
	private readonly KEYS = [
		'NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA',
		'NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g',
		'NoRgNATGBs1gLABgQTjCeBWSUDsYBmKbCeMADjNnXxHIoIF0g',
		'NoRg7ANAzBCsAMEAsioxBEIAc0Cc0ATJkgSIYhXIjhMQGxgC6QA',
		'NoVgNAjAHGBMYDYCcdJgCwTFBkYVgAY9JpJYUsYBmAXSA',
		'NoRgNAbAHGAsAMkwgMyzClH0LFcArHnAJzIqIBMGWEAukA',
	];
	
	// Cube state tracking
	private prevMoves: string[] = [];
	private timeOffs: number[] = [];
	private moveBuffer: [number, string, number, number][] = []; // [ [moveCnt, move, ts, locTime], ... ]
	private prevCubie = new mathlib.CubieCube();
	private curCubie = new mathlib.CubieCube();
	private latestFacelet = mathlib.SOLVED_FACELET;
	
	// Timing and state tracking
	private deviceTime = 0;
	private deviceTimeOffset = 0;
	private moveCnt = -1;
	private prevMoveCnt = -1;
	private movesFromLastCheck = 1000;
	private batteryLevel = 100;
	private keyCheck = 0;
	
	constructor() {
		super();
		// Initialize the GanCube instance
	}
	
	/**
	 * Gets a property value by key, or returns default if not found
	 * @param key - The property key to retrieve
	 * @param def - The default value to return if key not found
	 * @returns The property value or default
	 */
	private getProp<T>(key: string, def: T): T {
		if (this.props.hasOwnProperty(key)) {
			return this.props[key] as T;
		}
		return def;
	}
	
	/**
	 * Sets a property value
	 * @param key - The property key to set
	 * @param value - The value to set
	 * @returns void
	 */
	private setProp(key: string, value: any): void {
		this.props[key] = value;
	}
	
	/**
	 * Generates encryption key for the cube based on version and value
	 * @param version - Version number used to select the key
	 * @param value - Value containing bytes to modify the key
	 * @returns Generated key or undefined if key not found
	 */
	private getKey(version: number, value: DataView): number[] | undefined {
		let key = this.KEYS[(version >> 8) & 0xff];
		if (!key) {
			return undefined;
		}
		const parsedKey: number[] = JSON.parse(LZString.decompressFromEncodedURIComponent(key));
		for (let i = 0; i < 6; i++) {
			parsedKey[i] = (parsedKey[i] + value.getUint8(5 - i)) & 0xff;
		}
		return parsedKey;
	}
	
	/**
	 * Generates encryption key and initialization vector for V2 protocol
	 * @param value - MAC address bytes
	 * @param ver - Version number
	 * @returns Array containing [key, iv]
	 */
	private getKeyV2(value: number[], ver: number = 0): [number[], number[]] {
		const key: number[] = JSON.parse(
			LZString.decompressFromEncodedURIComponent(this.KEYS[2 + ver * 2]),
		);
		const iv: number[] = JSON.parse(
			LZString.decompressFromEncodedURIComponent(this.KEYS[3 + ver * 2]),
		);
		for (let i = 0; i < 6; i++) {
			key[i] = (key[i] + value[5 - i]) % 255;
			iv[i] = (iv[i] + value[5 - i]) % 255;
		}
		return [key, iv];
	}
	
	/**
	 * Decodes encrypted data from the cube
	 * @param value - Encrypted data from the cube
	 * @returns Decoded data as byte array
	 */
	private decode(value: DataView): number[] {
		const ret: number[] = [];
		for (let i = 0; i < value.byteLength; i++) {
			ret[i] = value.getUint8(i);
		}
		if (this.decoder == null) {
			return ret;
		}
		const iv = this.decoder.iv || [];
		if (ret.length > 16) {
			const offset = ret.length - 16;
			const block = this.decoder.decrypt(ret.slice(offset));
			for (let i = 0; i < 16; i++) {
				ret[i + offset] = block[i] ^ ~~iv[i];
			}
		}
		this.decoder.decrypt(ret);
		for (let i = 0; i < 16; i++) {
			ret[i] ^= ~~iv[i];
		}
		return ret;
	}
	
	/**
	 * Encodes data to send to the cube
	 * @param ret - Data to encode
	 * @returns Encoded data
	 */
	private encode(ret: number[]): number[] {
		if (this.decoder == null) {
			return ret;
		}
		const iv = this.decoder.iv || [];
		for (let i = 0; i < 16; i++) {
			ret[i] ^= ~~iv[i];
		}
		this.decoder.encrypt(ret);
		if (ret.length > 16) {
			const offset = ret.length - 16;
			const block = ret.slice(offset);
			for (let i = 0; i < 16; i++) {
				block[i] ^= ~~iv[i];
			}
			this.decoder.encrypt(block);
			for (let i = 0; i < 16; i++) {
				ret[i + offset] = block[i];
			}
		}
		return ret;
	}
	
	/**
	 * Extracts manufacturer data bytes from Bluetooth advertisement data
	 * @param mfData - Manufacturer data from Bluetooth advertisement
	 * @returns Manufacturer data bytes or undefined if not found
	 */
	private getManufacturerDataBytes(mfData: DataView | Map<number, DataView>): DataView | undefined {
		if (mfData instanceof DataView) {
			// this is workaround for Bluefy browser
			return mfData;
		}
		for (const id of this.GAN_CIC_LIST) {
			if (mfData.has(id)) {
				this.debug
					&& console.log(
						`[gancube] found Manufacturer Data under CIC = 0x${id
							.toString(16)
							.padStart(4, '0')}`,
					);
				return mfData.get(id);
			}
		}
		this.debug && console.log('[gancube] Looks like this cube has new unknown CIC');
		return undefined;
	}
	
	/**
	 * Waits for Bluetooth advertisements to extract MAC address
	 * @returns Promise resolving to MAC address or rejecting with error code
	 */
	private waitForAdvs(): Promise<string> {
		if (!this._device?.watchAdvertisements) {
			return Promise.reject(-1);
		}
		const abortController = new AbortController();
		return new Promise((resolve, reject) => {
			const onAdvEvent = (event: any) => {
				this.debug && console.log('[gancube] receive adv event', event);
				const mfData = event.manufacturerData;
				const dataView = this.getManufacturerDataBytes(mfData);
				if (dataView && dataView.byteLength >= 6) {
					const mac: string[] = [];
					for (let i = 0; i < 6; i++) {
						mac.push(
							(dataView.getUint8(dataView.byteLength - i - 1) + 0x100)
								.toString(16)
								.slice(1),
						);
					}
					if (this._device) {
						this._device.removeEventListener('advertisementreceived', onAdvEvent);
					}
					abortController.abort();
					resolve(mac.join(':'));
				}
			};
			if (this._device) {
				this._device.addEventListener('advertisementreceived', onAdvEvent);
			}
			if (this._device && this._device.watchAdvertisements) {
				this._device.watchAdvertisements({ signal: abortController.signal });
			}
			setTimeout(() => {
				// reject if no mac found
				this._device?.removeEventListener('advertisementreceived', onAdvEvent);
				abortController.abort();
				reject(-2);
			}, 10000);
		});
	}
	
	/**
	 * Initializes encryption key for V2 protocol
	 * @param forcePrompt - Whether to force prompt for MAC address
	 * @param ver - Version number
	 * @param providedMac - Optional MAC address provided by user
	 * @returns void
	 */
	private v2initKey(forcePrompt: boolean, ver: number, providedMac?: string): void {
		if (this.deviceMac) {
			const savedMacMap: Record<string, string> = JSON.parse(this.getProp<string>('giiMacMap', '{}'));
			const prevMac = this.deviceName ? savedMacMap[this.deviceName] : undefined;
			if (prevMac && this.deviceName && prevMac.toUpperCase() === this.deviceMac.toUpperCase()) {
				this.debug && console.log('[gancube] v2init mac matched');
			} else {
				this.debug && console.log('[gancube] v2init mac updated');
				if (this.deviceName) {
					savedMacMap[this.deviceName] = this.deviceMac;
					this.setProp('giiMacMap', JSON.stringify(savedMacMap));
				}
			}
			this.v2initDecoder(this.deviceMac, ver);
		} else {
			const savedMacMap: Record<string, string> = JSON.parse(this.getProp<string>('giiMacMap', '{}'));
			let mac = this.deviceName ? savedMacMap[this.deviceName] : undefined;
			if (!mac || forcePrompt || providedMac) {
				mac = providedMac;
			}
			if (!mac) {
				this.debug && console.log('[gancube] No MAC address provided');
				this.decoder = null;
				return;
			}
			const m = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.exec(mac);
			if (!m) {
				this.decoder = null;
				return;
			}
			if (this.deviceName && mac !== savedMacMap[this.deviceName]) {
				savedMacMap[this.deviceName] = mac;
				this.setProp('giiMacMap', JSON.stringify(savedMacMap));
			}
			this.v2initDecoder(mac, ver);
		}
	}
	
	/**
	 * Initializes the AES decoder with the given MAC address and version
	 * @param mac - MAC address in format XX:XX:XX:XX:XX:XX
	 * @param ver - Version number
	 * @returns void
	 */
	private v2initDecoder(mac: string, ver: number): void {
		const value: number[] = [];
		for (let i = 0; i < 6; i++) {
			value.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));
		}
		const keyiv = this.getKeyV2(value, ver);
		this.debug && console.log('[gancube] ver=', ver, ' key=', JSON.stringify(keyiv));
		this.decoder = new AES128(keyiv[0]);
		this.decoder.iv = keyiv[1];
	}
	
	/**
	 * Sends a request to the cube using V2 protocol
	 * @param req - Request data to send
	 * @returns Promise from writeValue or undefined if characteristic not found
	 */
	private v2sendRequest(req: number[]): Promise<void> | undefined {
		if (!this._chrct_v2write) {
			this.debug && console.log('[gancube] v2sendRequest cannot find v2write chrct');
			return undefined;
		}
		const encodedReq = this.encode(req.slice());
		this.debug && console.log('[gancube] v2sendRequest', req, encodedReq);
		return this._chrct_v2write.writeValue(new Uint8Array(encodedReq).buffer);
	}
	
	/**
	 * Sends a simple request with just an opcode using V2 protocol
	 * @param opcode - Operation code to send
	 * @returns Promise from v2sendRequest
	 */
	private v2sendSimpleRequest(opcode: number): Promise<void> | undefined {
		const req = mathlib.valuedArray(20, 0);
		req[0] = opcode;
		return this.v2sendRequest(req);
	}
	
	/**
	 * Requests facelet state from the cube using V2 protocol
	 * @returns Promise from v2sendSimpleRequest
	 */
	public v2requestFacelets(): Promise<void> | undefined {
		return this.v2sendSimpleRequest(4);
	}
	
	/**
	 * Requests battery level from the cube using V2 protocol
	 * @returns Promise from v2sendSimpleRequest
	 */
	public v2requestBattery(): Promise<void> | undefined {
		return this.v2sendSimpleRequest(9);
	}
	
	/**
	 * Requests hardware information from the cube using V2 protocol
	 * @returns Promise from v2sendSimpleRequest
	 */
	public v2requestHardwareInfo(): Promise<void> | undefined {
		return this.v2sendSimpleRequest(5);
	}
	
	/**
	 * Requests a reset of the cube using V2 protocol
	 * @returns Promise from v2sendRequest
	 */
	public v2requestReset(): Promise<void> | undefined {
		return this.v2sendRequest([
			10, 5, 57, 119, 0, 0, 1, 35, 69, 103, 137, 171, 0, 0, 0, 0, 0, 0, 0, 0,
		]);
	}
	
	/**
	 * Initializes the V2 protocol communication with the cube
	 * @param ver - Version number
	 * @param macAddress - Optional MAC address
	 * @returns Promise chain for initialization
	 */
	private v2init(ver: number, macAddress?: string): Promise<void> {
		this.debug && console.log('[gancube] v2init start');
		this.keyCheck = 0;
		this.v2initKey(true, ver, macAddress);
		
		if (!this._service_v2data) {
			return Promise.reject(new Error('V2 service not found'));
		}
		
		return this._service_v2data
			.getCharacteristics()
			.then((chrcts) => {
				this.debug && console.log('[gancube] v2init find chrcts', chrcts);
				for (let i = 0; i < chrcts.length; i++) {
					const chrct = chrcts[i];
					this.debug && console.log('[gancube] v2init find chrct', chrct.uuid);
					if (matchUUID(chrct.uuid, this.CHRCT_UUID_V2READ)) {
						this._chrct_v2read = chrct;
					} else if (matchUUID(chrct.uuid, this.CHRCT_UUID_V2WRITE)) {
						this._chrct_v2write = chrct;
					}
				}
				if (!this._chrct_v2read) {
					this.debug && console.log('[gancube] v2init cannot find v2read chrct');
				}
			})
			.then(() => {
				this.debug && console.log('[gancube] v2init v2read start notifications');
				if (!this._chrct_v2read) {
					throw new Error('V2 read characteristic not found');
				}
				return this._chrct_v2read.startNotifications();
			})
			.then(() => {
				this.debug && console.log('[gancube] v2init v2read notification started');
				if (!this._chrct_v2read) {
					throw new Error('V2 read characteristic not found');
				}
				return this._chrct_v2read.addEventListener(
					'characteristicvaluechanged',
					this.onStateChangedV2.bind(this) as EventListener,
				);
			})
			.then(() => this.v2requestHardwareInfo())
			.then(() => this.v2requestFacelets())
			.then(() => this.v2requestBattery());
	}
	
	/**
		* Event handler for V2 characteristic value changes
		* @param event - Bluetooth characteristic value changed event
		* @returns void
		*/
	private onStateChangedV2(event: any): void {
		const { value } = event.target;
		if (this.decoder == null) {
			return;
		}
		this.parseV2Data(value);
	}
	
	/**
		* Parses data received from the cube using V2 protocol
		* @param value - Raw data from the cube
		* @returns void
		*/
	private parseV2Data(value: any): void {
		const locTime = Date.now();
		value = this.decode(value);
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
			
			// Emit gyroscope data event
			this.emit('gyroData', {
				x: gyroX,
				y: gyroY,
				z: gyroZ,
				timestamp: locTime,
			});
		} else if (mode == 2) {
			// cube move
			this.moveCnt = parseInt(value.slice(4, 12), 2);
			if (this.moveCnt == this.prevMoveCnt || this.prevMoveCnt == -1) {
				return;
			}
			this.timeOffs = [];
			this.prevMoves = [];
			let keyChkInc = 0;
			for (var i = 0; i < 7; i++) {
				const m = parseInt(value.slice(12 + i * 5, 17 + i * 5), 2);
				this.timeOffs[i] = parseInt(value.slice(47 + i * 16, 63 + i * 16), 2);
				this.prevMoves[i] = 'URFDLB'.charAt(m >> 1) + " '".charAt(m & 1);
				if (m >= 12) {
					// invalid data
					this.prevMoves[i] = 'U ';
					keyChkInc = 1;
				}
			}
			this.keyCheck += keyChkInc;
			if (keyChkInc == 0) {
				// Process the moves
				this.debug && console.log('V2 Protocol - Moves to be processed:', this.prevMoves);
				this.updateMoveTimes(locTime, true);
				// Log the current cube state after all moves have been applied if in debug mode
				this.debug && console.log(
					'V2 Protocol - Current cube state after all moves:',
					this.prevCubie.faceletToNumber(this.prevCubie.toFaceCube()),
				);
			}
		} else if (mode == 4) {
			// cube state
			this.moveCnt = parseInt(value.slice(4, 12), 2);
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
			this.latestFacelet = cc.toFaceCube();
			this.debug
				&& console.log(
					'[gancube]',
					'v2 facelets event state parsed',
					this.latestFacelet,
				);
			
			// Update the prevCubie with the new state from the cube
			this.prevCubie = new mathlib.CubieCube();
			this.prevCubie.ca = [...cc.ca];
			this.prevCubie.ea = [...cc.ea];
			
			// Emit cube state changed event with the updated state
			this.emit('cubeStateChanged', {
				facelet: this.latestFacelet,
				corners: [...cc.ca],
				edges: [...cc.ea],
				timestamp: Date.now(),
			});
			
			if (
				this.latestFacelet
				=== 'LLUDULLUDRFFURUBBFDRBBFFFRULFRFDRFBLBLBDLLDDURUUBBRDDR'
			) {
				this.debug && console.log('SOLVED');
				this.emit('cubeSolved', {});
			} else {
				this.emit('unSolved', {});
			}
			if (this.prevMoveCnt == -1) {
				this.initCubeState();
			}
		} else if (mode == 5) {
			// hardware info
			this.debug
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
			this.debug && console.log('[gancube]', 'Hardware Version', hardwareVersion);
			this.debug && console.log('[gancube]', 'Software Version', softwareVersion);
			this.debug && console.log('[gancube]', 'Device Name', devName);
			this.debug && console.log('[gancube]', 'Gyro Enabled', gyroEnabled);
		} else if (mode == 9) {
			// battery
			this.debug && console.log('[gancube]', 'v2 received battery event', value);
			this.batteryLevel = parseInt(value.slice(8, 16), 2);
		} else {
			this.debug && console.log('[gancube]', 'v2 received unknown event', value);
		}
	}
	
	/**
		* Updates move times and processes cube moves
		* @param locTime - Local timestamp in milliseconds
		* @param isV2 - Whether using V2 protocol
		* @returns void
		*/
	private updateMoveTimes(locTime: number, isV2: boolean): void {
		let moveDiff = (this.moveCnt - this.prevMoveCnt) & 0xff;
		this.debug
			&& moveDiff > 1
			&& console.log(
				'[gancube]',
				`bluetooth event was lost, moveDiff = ${moveDiff}`,
			);
		this.prevMoveCnt = this.moveCnt;
		this.movesFromLastCheck += moveDiff;
		if (moveDiff > this.prevMoves.length) {
			this.movesFromLastCheck = 50;
			moveDiff = this.prevMoves.length;
		}
		let calcTs = this.deviceTime + this.deviceTimeOffset;
		for (var i = moveDiff - 1; i >= 0; i--) {
			calcTs += this.timeOffs[i];
		}
		if (!this.deviceTime || Math.abs(locTime - calcTs) > 2000) {
			this.debug
				&& console.log('[gancube]', 'time adjust', locTime - calcTs, '@', locTime);
			this.deviceTime += locTime - calcTs;
		}
		for (var i = moveDiff - 1; i >= 0; i--) {
			const m = 'URFDLB'.indexOf(this.prevMoves[i][0]) * 3 + " 2'".indexOf(this.prevMoves[i][1]);
			mathlib.CubieCube.EdgeMult(
				this.prevCubie,
				mathlib.CubieCube.moveCube[m],
				this.curCubie,
			);
			mathlib.CubieCube.CornMult(
				this.prevCubie,
				mathlib.CubieCube.moveCube[m],
				this.curCubie,
			);
			this.deviceTime += this.timeOffs[i];
			
			// Log the cube state after applying the move if in debug mode
			this.debug && console.log(`Move applied: ${this.prevMoves[i]}`);
			this.debug && console.log(`Cube state after move: ${this.curCubie.toFaceCube()}`);
			
			// Emit a custom event with the updated cube state
			this.emit('cubeStateChanged', {
				facelet: this.curCubie.toFaceCube(),
				move: this.prevMoves[i],
				corners: [...this.curCubie.ca],
				edges: [...this.curCubie.ea],
				timestamp: this.deviceTime,
			});
			
			const tmp = this.curCubie;
			this.curCubie = this.prevCubie;
			this.prevCubie = tmp;
			this.emit('move', {
				move: this.prevMoves[i],
				time: this.timeOffs[i]
			});
			this.debug && console.log('[gancube] move', this.prevMoves[i], this.timeOffs[i]);
		}
		this.deviceTimeOffset = locTime - this.deviceTime;
	}
	
	/**
		* Initializes the cube state and notifies the callback
		* @returns void
		*/
	private initCubeState(): void {
		const locTime = Date.now();
		this.debug && console.log('[gancube]', 'init cube state');
		this.prevCubie.fromFacelet(this.latestFacelet);
		this.prevMoveCnt = this.moveCnt;
		if (this.latestFacelet != this.getProp('giiSolved', mathlib.SOLVED_FACELET)) {
			const rst = this.getProp<string>('giiRST', '');
			if (rst === 'a') {
				// Mark as solved if needed
			}
		}
	}
	
	/**
		* Clears all cube connections and resets state
		* @returns Promise that resolves when cleanup is complete
		*/
	public clear(): Promise<void> {
		let result = Promise.resolve();
		if (this._chrct_v2read) {
			this._chrct_v2read.removeEventListener(
				'characteristicvaluechanged',
				this.onStateChangedV2 as EventListener,
			);
			result = this._chrct_v2read.stopNotifications().catch(() => {}) as Promise<void>;
			this._chrct_v2read = null;
		}
		this._service_data = null;
		this._service_meta = null;
		this._service_v2data = null;
		this._gatt = null;
		this.deviceName = null;
		this.deviceMac = null;
		this.prevMoves = [];
		this.timeOffs = [];
		this.moveBuffer = [];
		this.prevCubie = new mathlib.CubieCube();
		this.curCubie = new mathlib.CubieCube();
		this.latestFacelet = mathlib.SOLVED_FACELET;
		this.deviceTime = 0;
		this.deviceTimeOffset = 0;
		this.moveCnt = -1;
		this.prevMoveCnt = -1;
		this.movesFromLastCheck = 1000;
		this.batteryLevel = 100;
		
		// Clear all event listeners
		this.clearAllListeners();
		
		return result;
	}
	
	/**
		* Initializes communication with the GAN cube
		* @param device - Bluetooth device object
		* @param macAddress - Optional MAC address
		* @returns Promise chain for initialization
		*/
	public init(device: BluetoothDevice, macAddress?: string): Promise<void> {
		this.clear();
		this.deviceName = device.name || null;
		this._device = device;
		this.debug && console.log('[gancube] init gan cube start');
		return this.waitForAdvs()
			.then(
				(mac) => {
					this.debug
						&& console.log(
							`[gancube] init, found cube bluetooth hardware MAC = ${mac}`,
						);
					this.deviceMac = mac as string;
				},
				(err) => {
					this.debug
						&& console.log(
							`[gancube] init, unable to automatically determine cube MAC, error code = ${err}`,
						);
				},
			)
			.then(() => {
				if (!device.gatt) {
					throw new Error('Bluetooth GATT not available');
				}
				return device.gatt.connect();
			})
			.then((gatt) => {
				this._gatt = gatt;
				return gatt.getPrimaryServices();
			})
			.then((services) => {
				for (let i = 0; i < services.length; i++) {
					const service = services[i];
					this.debug
						&& console.log('[gancube] checkHardware find service', service.uuid);
					if (matchUUID(service.uuid, this.SERVICE_UUID_META)) {
						this._service_meta = service;
					} else if (matchUUID(service.uuid, this.SERVICE_UUID_DATA)) {
						this._service_data = service;
					} else if (matchUUID(service.uuid, this.SERVICE_UUID_V2DATA)) {
						this._service_v2data = service;
					}
				}
				if (this._service_v2data) {
					return this.v2init(
						(this.deviceName || '').startsWith('AiCube') ? 1 : 0,
						macAddress,
					);
				}
				throw new Error('Wrong cube :(');
			});
	}
	
	/**
		* Checks the current state of the cube by reading facelet data
		* @returns Promise resolving to true if state was updated, false otherwise
		*/
	private checkState(): Promise<boolean> {
		if (this.movesFromLastCheck < 50) {
			return Promise.resolve(false);
		}
		if (!this._chrct_f2) {
			return Promise.resolve(false);
		}
		return this._chrct_f2.readValue().then((value) => {
			const decodedValue = this.decode(value);
			const state: string[] = [];
			for (let i = 0; i < decodedValue.length - 2; i += 3) {
				const face = (decodedValue[i ^ 1] << 16) | (decodedValue[(i + 1) ^ 1] << 8) | decodedValue[(i + 2) ^ 1];
				for (let j = 21; j >= 0; j -= 3) {
					state.push('URFDLB'.charAt((face >> j) & 0x7));
					if (j == 12) {
						state.push('URFDLB'.charAt(i / 3));
					}
				}
			}
			this.latestFacelet = state.join('');
			this.movesFromLastCheck = 0;
			if (this.prevMoveCnt == -1) {
				this.initCubeState();
				return false;
			}
			return true;
		});
	}
	
	/**
		* Continuously reads cube state and processes moves
		* @returns Promise chain for reading or undefined if device not connected
		*/
	private loopRead(): Promise<void> | undefined {
		if (!this._device) {
			return undefined;
		}
		if (!this._chrct_f5) {
			return undefined;
		}
		return this._chrct_f5
			.readValue()
			.then((value) => {
				const decodedValue = this.decode(value);
				const locTime = Date.now();
				this.moveCnt = decodedValue[12];
				if (this.moveCnt == this.prevMoveCnt) {
					return Promise.resolve();
				}
				this.prevMoves = [];
				for (let i = 0; i < 6; i++) {
					const m = decodedValue[13 + i];
					this.prevMoves.unshift('URFDLB'.charAt(~~(m / 3)) + " 2'".charAt(m % 3));
				}
				let f6val: number[] = [];
				if (!this._chrct_f6) {
					return Promise.resolve();
				}
				return this._chrct_f6
					.readValue()
					.then((value) => {
						f6val = this.decode(value);
						return this.checkState();
					})
					.then((isUpdated) => {
						if (isUpdated) {
							this.debug
								&& console.log(
									'[gancube]',
									'facelet state calc',
									this.prevCubie.toFaceCube(),
								);
							this.debug
								&& console.log('[gancube]', 'facelet state read', this.latestFacelet);
							if (this.prevCubie.toFaceCube() != this.latestFacelet) {
								this.debug && console.log('[gancube]', 'Cube state check error');
							}
							return;
						}

						this.timeOffs = [];
						for (let i = 0; i < 9; i++) {
							const off = (f6val[i * 2 + 1] | (f6val[i * 2 + 2] << 8)) || 0;
							this.timeOffs.unshift(off);
						}
						this.updateMoveTimes(locTime, false);
						return Promise.resolve();
					});
			})
			.then(() => this.loopRead());
	}
	
	/**
		* Gets the current battery level of the cube
		* @returns Promise resolving to [batteryLevel, deviceName]
		*/
	public getBatteryLevel(): Promise<[number, string]> {
		if (!this._gatt) {
			return Promise.reject('Bluetooth Cube is not connected');
		}
		if (this._service_v2data) {
			return Promise.resolve([this.batteryLevel, `${this.deviceName}*`]);
		}
		if (this._chrct_f7) {
			return this._chrct_f7.readValue().then((value) => {
				const decodedValue = this.decode(value);
				return Promise.resolve([decodedValue[7], this.deviceName || '']);
			});
		}
		return Promise.resolve([this.batteryLevel, this.deviceName || '']);
	}
	
	/**
		* Logs the current state of the cube to the console
		* This function can be called at any time to get the current state of the cube
		* without having to wait for a move to be made.
		*
		* Usage example:
		* ```
		* // Log the current cube state
		* ganCube.logCubeState();
		*
		* // Or listen for cube state changes
		* window.addEventListener('cubeStateChanged', (event) => {
		*   console.log('Cube state changed:', event.detail);
		* });
		* ```
		*
		* @returns Object containing facelet representation and corner/edge arrays
		*/
	public logCubeState(): { facelet: string; corners: number[]; edges: number[] } {
		console.log('=== Current Cube State ===');
		console.log('Facelet Representation:', this.prevCubie.toFaceCube());
		console.log('Corner Array:', this.prevCubie.ca);
		console.log('Edge Array:', this.prevCubie.ea);
		console.log('========================');

		return {
			facelet: this.prevCubie.toFaceCube(),
			corners: [...this.prevCubie.ca],
			edges: [...this.prevCubie.ea],
		};
	}
	
	/**
		* Get the list of operation service UUIDs
		* @returns Array of service UUIDs
		*/
	public get opservs(): string[] {
		return [this.SERVICE_UUID_DATA, this.SERVICE_UUID_META, this.SERVICE_UUID_V2DATA];
	}
	
	/**
		* Get the list of Company Identifier Codes
		* @returns Array of CIC values
		*/
	public get cics(): number[] {
		return this.GAN_CIC_LIST;
	}

	public get facelets(): string {
		return this.latestFacelet;
	}


  public getStateHex(): string {
    return CubeNumberConverter.cubeNumberToHex(CubeNumberConverter.cubeStateToNumber(
      this.prevCubie.ca,
      this.prevCubie.ea
    ));
  }
}