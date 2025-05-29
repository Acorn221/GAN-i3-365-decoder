/* eslint-disable */
import * as LZString from 'lz-string';

const $ = {};
/**
 * Empty function that does nothing
 * @returns {void}
 */
$.noop = () => { };

/**
 * Returns the current timestamp in milliseconds
 * @returns {number} Current timestamp in milliseconds
 */
$.now = () => new Date().getTime();
(function () {
  /**
   * Safely adds two 32-bit integers without overflow
   * @param {number} x - First 32-bit integer
   * @param {number} y - Second 32-bit integer
   * @returns {number} Sum of x and y as a 32-bit integer
   */
  const safe_add = function (x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  };

  /**
   * Bitwise rotate 32-bit number to the right
   * @param {number} X - 32-bit integer
   * @param {number} n - Number of bits to rotate
   * @returns {number} Rotated result
   */
  const S = function (X, n) {
    return (X >>> n) | (X << (32 - n));
  };

  /**
   * Bitwise shift 32-bit number to the right
   * @param {number} X - 32-bit integer
   * @param {number} n - Number of bits to shift
   * @returns {number} Shifted result
   */
  const R = function (X, n) {
    return (X >>> n);
  };

  /**
   * SHA-256 Ch function
   * @param {number} x - 32-bit integer
   * @param {number} y - 32-bit integer
   * @param {number} z - 32-bit integer
   * @returns {number} Result of Ch function
   */
  const Ch = function (x, y, z) {
    return ((x & y) ^ ((~x) & z));
  };

  /**
   * SHA-256 Maj function
   * @param {number} x - 32-bit integer
   * @param {number} y - 32-bit integer
   * @param {number} z - 32-bit integer
   * @returns {number} Result of Maj function
   */
  const Maj = function (x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z));
  };

  /**
   * SHA-256 Sigma0 function
   * @param {number} x - 32-bit integer
   * @returns {number} Result of Sigma0 function
   */
  const Sigma0256 = function (x) {
    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
  };

  /**
   * SHA-256 Sigma1 function
   * @param {number} x - 32-bit integer
   * @returns {number} Result of Sigma1 function
   */
  const Sigma1256 = function (x) {
    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
  };

  /**
   * SHA-256 Gamma0 function
   * @param {number} x - 32-bit integer
   * @returns {number} Result of Gamma0 function
   */
  const Gamma0256 = function (x) {
    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
  };

  /**
   * SHA-256 Gamma1 function
   * @param {number} x - 32-bit integer
   * @returns {number} Result of Gamma1 function
   */
  const Gamma1256 = function (x) {
    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
  };

  /**
   * Core SHA-256 algorithm implementation
   * @param {Array<number>} m - Message array of 32-bit integers
   * @param {number} l - Message length in bits
   * @returns {Array<number>} Hash result as array of 8 32-bit integers
   */
  const core_sha256 = function (m, l) {
    const K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];
    const HASH = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
    const W = [64];
    m[l >> 5] |= 0x80 << (24 - l % 32);
    m[((l + 64 >> 9) << 4) + 15] = l;
    for (let i = 0; i < m.length; i += 16) {
      let a = HASH[0];
      let b = HASH[1];
      let c = HASH[2];
      let d = HASH[3];
      let e = HASH[4];
      let f = HASH[5];
      let g = HASH[6];
      let h = HASH[7];
      for (let j = 0; j < 64; j++) {
        W[j] = j < 16 ? m[i + j] : safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
        const T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
        const T2 = safe_add(Sigma0256(a), Maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = safe_add(d, T1);
        d = c;
        c = b;
        b = a;
        a = safe_add(T1, T2);
      }
      HASH[0] = safe_add(a, HASH[0]);
      HASH[1] = safe_add(b, HASH[1]);
      HASH[2] = safe_add(c, HASH[2]);
      HASH[3] = safe_add(d, HASH[3]);
      HASH[4] = safe_add(e, HASH[4]);
      HASH[5] = safe_add(f, HASH[5]);
      HASH[6] = safe_add(g, HASH[6]);
      HASH[7] = safe_add(h, HASH[7]);
    }
    return HASH;
  };

  /**
   * Converts a string to an array of 32-bit integers
   * @param {string} str - Input string
   * @returns {Array<number>} Array of 32-bit integers
   */
  const str2binb = function (str) {
    const bin = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (24 - i % 32);
    }
    return bin;
  };

  /**
   * Converts an array of 32-bit integers to a hexadecimal string
   * @param {Array<number>} barr - Array of 32-bit integers
   * @returns {string} Hexadecimal string representation
   */
  const binb2hex = function (barr) {
    const hex_tab = '0123456789abcdef';
    let str = '';
    for (let i = 0; i < barr.length * 4; i++) {
      str += hex_tab.charAt((barr[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((barr[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
    }
    return str;
  };

  /**
   * Calculates SHA-256 hash of a string
   * @param {string} string - Input string to hash
   * @returns {string} SHA-256 hash as a hexadecimal string
   */
  $.sha256 = function (string) {
    if (/[\x80-\xFF]/.test(string)) {
      string = unescape(encodeURI(string));
    }
    return binb2hex(core_sha256(str2binb(string), string.length * 8));
  };
}());

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
  $.aes128 = function (key) {
    return new AES128(key);
  };
}());

/**
 * Modern replacement for isaac PRNG using Web Crypto API
 * Provides a compatible API with the original isaac implementation
 */
const modernRandom = (function() {
  // Internal state
  let seedData = null;
  let seedIndex = 0;
  let seedBuffer = new Uint32Array(256);
  
  // Initialize with a random seed
  seed(String(Math.random()));
  
  /**
   * Generate cryptographically secure random values using Web Crypto
   * or fall back to Math.random if not available
   */
  function generateRandomValues() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(seedBuffer);
    } else {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < seedBuffer.length; i++) {
        seedBuffer[i] = Math.floor(Math.random() * 0x100000000);
      }
    }
    seedIndex = 0;
  }
  
  /**
   * Reset the internal state
   */
  function reset() {
    seedData = null;
    seedIndex = 0;
    seedBuffer = new Uint32Array(256);
    generateRandomValues();
  }
  
  /**
   * Seed the random number generator
   * @param {number|Array|string} s - Seed value
   */
  function seed(s) {
    // Reset state
    reset();
    
    // Handle different seed types
    if (typeof s === 'number') {
      s = [s];
    }
    
    if (s instanceof Array) {
      // Use the seed array to influence our random state
      const seedArray = new Uint32Array(s.length);
      for (let i = 0; i < s.length; i++) {
        seedArray[i] = typeof s[i] === 'number' ? s[i] : 0;
      }
      
      // Mix the seed with our random buffer
      for (let i = 0; i < seedBuffer.length; i++) {
        seedBuffer[i] ^= seedArray[i % seedArray.length];
      }
    } else if (typeof s === 'string') {
      // Convert string to array of character codes
      const charCodes = [];
      for (let i = 0; i < s.length; i++) {
        charCodes.push(s.charCodeAt(i));
      }
      seed(charCodes);
    }
    
    // Store the seed data for potential reuse
    seedData = s;
    
    // Generate initial random values
    generateRandomValues();
  }
  
  /**
   * Get a random 32-bit integer
   */
  function rand() {
    // If we've used all our random values, generate more
    if (seedIndex >= seedBuffer.length) {
      generateRandomValues();
    }
    
    return seedBuffer[seedIndex++];
  }
  
  /**
   * Get a random number between 0 and 1
   */
  function random() {
    return rand() / 0x100000000;
  }
  
  /**
   * Compatibility function for the original isaac API
   */
  function prng(n) {
    n = (n && typeof n === 'number') ? Math.abs(Math.floor(n)) : 1;
    
    // Just regenerate our random values
    if (n > 0) {
      generateRandomValues();
    }
  }
  
  /**
   * Get/set internal state (for compatibility)
   */
  function internals(obj) {
    const ret = {
      buffer: seedBuffer.slice(),
      index: seedIndex,
      seed: seedData
    };
    
    if (obj) {
      if (obj.buffer) seedBuffer = obj.buffer.slice();
      if (obj.index !== undefined) seedIndex = obj.index;
      if (obj.seed !== undefined) seedData = obj.seed;
    }
    
    return ret;
  }
  
  // Return the public API
  return {
    reset,
    seed,
    prng,
    rand,
    random,
    internals
  };
})();

// For backward compatibility
const isaac = modernRandom;

const DEBUG = true;

const mathlib = (function () {
  const Cnk = [];
  const fact = [1];
  for (let i = 0; i < 32; ++i) {
    Cnk[i] = [];
    for (let j = 0; j < 32; ++j) {
      Cnk[i][j] = 0;
    }
  }
  for (let i = 0; i < 32; ++i) {
    Cnk[i][0] = Cnk[i][i] = 1;
    fact[i + 1] = fact[i] * (i + 1);
    for (let j = 1; j < i; ++j) {
      Cnk[i][j] = Cnk[i - 1][j - 1] + Cnk[i - 1][j];
    }
  }

  /**
   * Performs a 4-cycle permutation with orientation on an array
   * @param {Array<number>} arr - Array to modify
   * @param {number} a - First index
   * @param {number} b - Second index
   * @param {number} c - Third index
   * @param {number} d - Fourth index
   * @param {number} ori - Orientation value to XOR
   * @returns {void}
   */
  function circleOri(arr, a, b, c, d, ori) {
    const temp = arr[a];
    arr[a] = arr[d] ^ ori;
    arr[d] = arr[c] ^ ori;
    arr[c] = arr[b] ^ ori;
    arr[b] = temp ^ ori;
  }

  /**
   * Performs a cycle permutation on an array
   * @param {Array<number>} arr - Array to modify
   * @param {...number} indices - Indices to cycle
   * @returns {function} The circle function for chaining
   */
  function circle(arr) {
    const length = arguments.length - 1;
    const temp = arr[arguments[length]];
    for (let i = length; i > 1; i--) {
      arr[arguments[i]] = arr[arguments[i - 1]];
    }
    arr[arguments[1]] = temp;
    return circle;
  }

  // perm: [idx1, idx2, ..., idxn]
  // pow: 1, 2, 3, ...
  // ori: ori1, ori2, ..., orin, base
  // arr[perm[idx2]] = arr[perm[idx1]] + ori[idx2] - ori[idx1] + base
  /**
   * Performs a general cycle permutation with orientation
   * @param {Array<number>} arr - Array to modify
   * @param {Array<number>} perm - Permutation indices
   * @param {number} pow - Power of the permutation (default: 1)
   * @param {Array<number>} ori - Orientation values (optional)
   * @returns {function} The acycle function for chaining
   */
  function acycle(arr, perm, pow, ori) {
    pow = pow || 1;
    const plen = perm.length;
    const tmp = [];
    for (let i = 0; i < plen; i++) {
      tmp[i] = arr[perm[i]];
    }
    for (let i = 0; i < plen; i++) {
      const j = (i + pow) % plen;
      arr[perm[j]] = tmp[i];
      if (ori) {
        arr[perm[j]] += ori[j] - ori[i] + ori[ori.length - 1];
      }
    }
    return acycle;
  }

  /**
   * Gets a pruning value from a compressed table
   * @param {Array<number>} table - Pruning table
   * @param {number} index - Index to look up
   * @returns {number} Pruning value (0-15)
   */
  function getPruning(table, index) {
    return table[index >> 3] >> ((index & 7) << 2) & 15;
  }

  /**
   * Sets a permutation based on an index
   * @param {Array<number>} arr - Array to modify
   * @param {number} idx - Index of the permutation
   * @param {number} n - Size of the permutation
   * @param {number} even - If negative, ensures even parity
   * @returns {Array<number>} Modified array
   */
  function setNPerm(arr, idx, n, even) {
    let prt = 0;
    if (even < 0) {
      idx <<= 1;
    }
    if (n >= 16) {
      arr[n - 1] = 0;
      for (let i = n - 2; i >= 0; i--) {
        arr[i] = idx % (n - i);
        prt ^= arr[i];
        idx = ~~(idx / (n - i));
        for (let j = i + 1; j < n; j--) {
          arr[j] >= arr[i] && arr[j]++;
        }
      }
      if (even < 0 && (prt & 1) != 0) {
        const tmp = arr[n - 1];
        arr[n - 1] = arr[n - 2];
        arr[n - 2] = tmp;
      }
      return arr;
    }
    let vall = 0x76543210;
    let valh = 0xfedcba98;
    for (let i = 0; i < n - 1; i++) {
      const p = fact[n - 1 - i];
      let v = idx / p;
      idx %= p;
      prt ^= v;
      v <<= 2;
      if (v >= 32) {
        v -= 32;
        arr[i] = valh >> v & 0xf;
        let m = (1 << v) - 1;
        valh = (valh & m) + ((valh >> 4) & ~m);
      } else {
        arr[i] = vall >> v & 0xf;
        let m = (1 << v) - 1;
        vall = (vall & m) + ((vall >>> 4) & ~m) + (valh << 28);
        valh >>= 4;
      }
    }
    if (even < 0 && (prt & 1) != 0) {
      arr[n - 1] = arr[n - 2];
      arr[n - 2] = vall & 0xf;
    } else {
      arr[n - 1] = vall & 0xf;
    }
    return arr;
  }

  /**
   * Gets the index of a permutation
   * @param {Array<number>} arr - Permutation array
   * @param {number} n - Size of the permutation (default: arr.length)
   * @param {number} even - If negative, returns index for even parity permutations
   * @returns {number} Index of the permutation
   */
  function getNPerm(arr, n, even) {
    n = n || arr.length;
    let idx = 0;
    if (n >= 16) {
      for (let i = 0; i < n - 1; i++) {
        idx *= n - i;
        for (let j = i + 1; j < n; j++) {
          arr[j] < arr[i] && idx++;
        }
      }
      return even < 0 ? (idx >> 1) : idx;
    }
    let vall = 0x76543210;
    let valh = 0xfedcba98;
    for (var i = 0; i < n - 1; i++) {
      const v = arr[i] << 2;
      idx *= n - i;
      if (v >= 32) {
        idx += (valh >> (v - 32)) & 0xf;
        valh -= 0x11111110 << (v - 32);
      } else {
        idx += (vall >> v) & 0xf;
        valh -= 0x11111111;
        vall -= 0x11111110 << v;
      }
    }
    return even < 0 ? (idx >> 1) : idx;
  }

  /**
   * Gets the parity of a permutation index
   * @param {number} idx - Index of the permutation
   * @param {number} n - Size of the permutation
   * @returns {number} Parity (0 or 1)
   */
  function getNParity(idx, n) {
    let i; let
      p;
    p = 0;
    for (i = n - 2; i >= 0; --i) {
      p ^= idx % (n - i);
      idx = ~~(idx / (n - i));
    }
    return p & 1;
  }

  /**
   * Gets the index of an orientation
   * @param {Array<number>} arr - Orientation array
   * @param {number} n - Size of the orientation
   * @param {number} evenbase - Base for orientation values, if negative, first element is computed
   * @returns {number} Index of the orientation
   */
  function getNOri(arr, n, evenbase) {
    const base = Math.abs(evenbase);
    let idx = evenbase < 0 ? 0 : arr[0] % base;
    for (let i = n - 1; i > 0; i--) {
      idx = idx * base + arr[i] % base;
    }
    return idx;
  }

  function setNOri(arr, idx, n, evenbase) {
    const base = Math.abs(evenbase);
    let parity = base * n;
    for (let i = 1; i < n; i++) {
      arr[i] = idx % base;
      parity -= arr[i];
      idx = ~~(idx / base);
    }
    arr[0] = (evenbase < 0 ? parity : idx) % base;
    return arr;
  }

  function bitCount(x) {
    x -= (x >> 1) & 0x55555555;
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    return ((x + (x >> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
  }

  function getMPerm(arr, n, cnts, cums) {
    let seen = ~0;
    let idx = 0;
    let x = 1;
    for (let i = 0; i < n; i++) {
      const pi = arr[i];
      idx = idx * (n - i) + bitCount(seen & ((1 << cums[pi]) - 1)) * x;
      x *= cnts[pi]--;
      seen &= ~(1 << (cums[pi] + cnts[pi]));
    }
    return Math.round(idx / x);
  }

  function setMPerm(arr, idx, n, cnts, x) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < cnts.length; j++) {
        if (cnts[j] == 0) {
          continue;
        }
        const x2 = ~~(x * cnts[j] / (n - i));
        if (idx < x2) {
          cnts[j]--;
          arr[i] = j;
          x = x2;
          break;
        }
        idx -= x2;
      }
    }
  }

  // type: 'p' (permutation), 'o' (orientation), 'c' (combination)
  // evenbase: base for ori, sign for even parity, cnts for combination
  function coord(type, length, evenbase) {
    this.length = length;
    this.evenbase = evenbase;
    if (type == 'p') {
      this.get = function (arr) {
        return getNPerm(arr, this.length, this.evenbase);
      };
      this.set = function (arr, idx) {
        return setNPerm(arr, idx, this.length, this.evenbase);
      };
    } else if (type == 'o') {
      this.get = function (arr) {
        return getNOri(arr, this.length, this.evenbase);
      };
      this.set = function (arr, idx) {
        return setNOri(arr, idx, this.length, this.evenbase);
      };
    } else if (type == 'c') {
      const cnts = evenbase;
      this.cnts = cnts.slice();
      this.cums = [0];
      for (var i = 1; i <= this.cntn; i++) {
        this.cums[i] = this.cums[i - 1] + cnts[i - 1];
      }
      this.n = this.cums[this.cntn];
      let { n } = this;
      let x = 1;
      for (var i = 0; i < this.cntn; i++) {
        for (let j = 1; j <= cnts[i]; j++, n--) {
          x *= n / j;
        }
      }
      this.x = Math.round(x);
      this.get = function (arr) {
        return getMPerm(arr, this.n, this.cnts.slice(), this.cums);
      };
      this.set = function (arr, idx) {
        return setMPerm(arr, idx, this.n, this.cnts.slice(), this.x);
      };
    } else { // invalid type
      debugger;
    }
  }

  function fillFacelet(facelets, f, perm, ori, divcol) {
    for (let i = 0; i < facelets.length; i++) {
      const cubie = facelets[i];
      if (typeof (cubie) === 'number') {
        f[cubie] = ~~(facelets[perm[i]] / divcol);
        continue;
      }
      const o = ori[i] || 0;
      for (let j = 0; j < cubie.length; j++) {
        f[cubie[(j + o) % cubie.length]] = ~~(facelets[perm[i]][j] / divcol);
      }
    }
  }

  function detectFacelet(facelets, f, perm, ori, divcol) {
    for (let i = 0; i < facelets.length; i++) {
      const n_ori = facelets[i].length;
      out: for (let j = 0; j < facelets.length + 1; j++) {
        if (j == facelets.length) { // not matched
          return -1;
        } if (facelets[j].length != n_ori) {
          continue;
        }
        for (let o = 0; o < n_ori; o++) {
          let isMatch = true;
          for (let t = 0; t < n_ori; t++) {
            if (~~(facelets[j][t] / divcol) != f[facelets[i][(t + o) % n_ori]]) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            perm[i] = j;
            ori[i] = o;
            break out;
          }
        }
      }
    }
    return 0;
  }

  function createMove(moveTable, size, doMove, N_MOVES) {
    N_MOVES = N_MOVES || 6;
    if ($.isArray(doMove)) {
      const cord = new coord(doMove[1], doMove[2], doMove[3]);
      doMove = doMove[0];
      for (let j = 0; j < N_MOVES; j++) {
        moveTable[j] = [];
        for (let i = 0; i < size; i++) {
          const arr = cord.set([], i);
          doMove(arr, j);
          moveTable[j][i] = cord.get(arr);
        }
      }
    } else {
      for (let j = 0; j < N_MOVES; j++) {
        moveTable[j] = [];
        for (let i = 0; i < size; i++) {
          moveTable[j][i] = doMove(i, j);
        }
      }
    }
  }

  function createMoveHash(initState, validMoves, hashFunc, moveFunc) {
    const states = [initState];
    const hash2idx = {};
    const depthEnds = [];
    hash2idx[hashFunc(initState)] = 0;
    depthEnds[0] = 1;
    const moveTable = [];
    for (let m = 0; m < validMoves.length; m++) {
      moveTable[m] = [];
    }
    const tt = +new Date();
    for (let i = 0; i < states.length; i++) {
      if (i == depthEnds[depthEnds.length - 1]) {
        depthEnds.push(states.length);
      }
      if (i % 10000 == 9999) {
        DEBUG && console.log(i, 'states scanned, tt=', +new Date() - tt);
      }
      const curState = states[i];
      for (var m = 0; m < validMoves.length; m++) {
        const newState = moveFunc(curState, validMoves[m]);
        if (!newState) {
          moveTable[m][i] = -1;
          continue;
        }
        const newHash = hashFunc(newState);
        if (!(newHash in hash2idx)) {
          hash2idx[newHash] = states.length;
          states.push(newState);
        }
        moveTable[m][i] = hash2idx[newHash];
      }
    }
    DEBUG && console.log(`[move hash] ${states.length} states generated, tt=`, +new Date() - tt, JSON.stringify(depthEnds));
    return [moveTable, hash2idx];
  }

  function edgeMove(arr, m) {
    if (m == 0) { // F
      circleOri(arr, 0, 7, 8, 4, 1);
    } else if (m == 1) { // R
      circleOri(arr, 3, 6, 11, 7, 0);
    } else if (m == 2) { // U
      circleOri(arr, 0, 1, 2, 3, 0);
    } else if (m == 3) { // B
      circleOri(arr, 2, 5, 10, 6, 1);
    } else if (m == 4) { // L
      circleOri(arr, 1, 4, 9, 5, 0);
    } else if (m == 5) { // D
      circleOri(arr, 11, 10, 9, 8, 0);
    }
  }

  function CubieCube() {
    this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
    this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  }

  CubieCube.SOLVED = new CubieCube();

  CubieCube.EdgeMult = function (a, b, prod) {
    for (let ed = 0; ed < 12; ed++) {
      prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
    }
  };

  CubieCube.CornMult = function (a, b, prod) {
    for (let corn = 0; corn < 8; corn++) {
      const ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
      prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
    }
  };

  CubieCube.CubeMult = function (a, b, prod) {
    CubieCube.CornMult(a, b, prod);
    CubieCube.EdgeMult(a, b, prod);
  };

  CubieCube.prototype.init = function (ca, ea) {
    this.ca = ca.slice();
    this.ea = ea.slice();
    return this;
  };

  CubieCube.prototype.hashCode = function () {
    let ret = 0;
    for (let i = 0; i < 20; i++) {
      ret = 0 | (ret * 31 + (i < 12 ? this.ea[i] : this.ca[i - 12]));
    }
    return ret;
  };

  CubieCube.prototype.isEqual = function (c) {
    c = c || CubieCube.SOLVED;
    for (var i = 0; i < 8; i++) {
      if (this.ca[i] != c.ca[i]) {
        return false;
      }
    }
    for (var i = 0; i < 12; i++) {
      if (this.ea[i] != c.ea[i]) {
        return false;
      }
    }
    return true;
  };

  CubieCube.cFacelet = [
    [8, 9, 20], // URF
    [6, 18, 38], // UFL
    [0, 36, 47], // ULB
    [2, 45, 11], // UBR
    [29, 26, 15], // DFR
    [27, 44, 24], // DLF
    [33, 53, 42], // DBL
    [35, 17, 51], // DRB
  ];
  CubieCube.eFacelet = [
    [5, 10], // UR
    [7, 19], // UF
    [3, 37], // UL
    [1, 46], // UB
    [32, 16], // DR
    [28, 25], // DF
    [30, 43], // DL
    [34, 52], // DB
    [23, 12], // FR
    [21, 41], // FL
    [50, 39], // BL
    [48, 14], // BR
  ];
  CubieCube.faceMap = (function () {
    const f = [];
    for (let c = 0; c < 8; c++) {
      for (var n = 0; n < 3; n++) {
        f[CubieCube.cFacelet[c][n]] = [0, c, n];
      }
    }
    for (let e = 0; e < 12; e++) {
      for (var n = 0; n < 2; n++) f[CubieCube.eFacelet[e][n]] = [1, e, n];
    }
    return f;
  }());

  CubieCube.prototype.toFaceCube = function (cFacelet, eFacelet) {
    cFacelet = cFacelet || CubieCube.cFacelet;
    eFacelet = eFacelet || CubieCube.eFacelet;
    const ts = 'URFDLB';
    const f = [];
    for (let i = 0; i < 54; i++) {
      f[i] = ts[~~(i / 9)];
    }
    for (let c = 0; c < 8; c++) {
      var j = this.ca[c] & 0x7; // cornercubie with index j is at
      var ori = this.ca[c] >> 3; // Orientation of this cubie
      for (var n = 0; n < 3; n++) f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
    }
    for (let e = 0; e < 12; e++) {
      var j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
      var ori = this.ea[e] & 1; // Orientation of this cubie
      for (var n = 0; n < 2; n++) f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
    }
    return f.join('');
  };

  CubieCube.prototype.invFrom = function (cc) {
    for (let edge = 0; edge < 12; edge++) {
      this.ea[cc.ea[edge] >> 1] = edge << 1 | cc.ea[edge] & 1;
    }
    for (let corn = 0; corn < 8; corn++) {
      this.ca[cc.ca[corn] & 0x7] = corn | 0x20 >> (cc.ca[corn] >> 3) & 0x18;
    }
    return this;
  };

  CubieCube.prototype.fromFacelet = function (facelet, cFacelet, eFacelet) {
    cFacelet = cFacelet || CubieCube.cFacelet;
    eFacelet = eFacelet || CubieCube.eFacelet;
    let count = 0;
    const f = [];
    const centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
    for (var i = 0; i < 54; ++i) {
      f[i] = centers.indexOf(facelet[i]);
      if (f[i] == -1) {
        return -1;
      }
      count += 1 << (f[i] << 2);
    }
    if (count != 0x999999) {
      return -1;
    }
    let col1; let col2; var i; let j; let
      ori;
    for (i = 0; i < 8; ++i) {
      for (ori = 0; ori < 3; ++ori) if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3) break;
      col1 = f[cFacelet[i][(ori + 1) % 3]];
      col2 = f[cFacelet[i][(ori + 2) % 3]];
      for (j = 0; j < 8; ++j) {
        if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
          this.ca[i] = j | ori % 3 << 3;
          break;
        }
      }
    }
    for (i = 0; i < 12; ++i) {
      for (j = 0; j < 12; ++j) {
        if (f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)) {
          this.ea[i] = j << 1;
          break;
        }
        if (f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)) {
          this.ea[i] = j << 1 | 1;
          break;
        }
      }
    }
    return this;
  };

  CubieCube.prototype.verify = function () {
    let mask = 0;
    let sum = 0;
    for (let e = 0; e < 12; e++) {
      mask |= 1 << 8 << (this.ea[e] >> 1);
      sum ^= this.ea[e] & 1;
    }
    const cp = [];
    for (let c = 0; c < 8; c++) {
      mask |= 1 << (this.ca[c] & 7);
      sum += this.ca[c] >> 3 << 1;
      cp.push(this.ca[c] & 0x7);
    }
    if (mask != 0xfffff || sum % 6 != 0
			|| getNParity(getNPerm(this.ea, 12), 12) != getNParity(getNPerm(cp, 8), 8)) {
      return -1;
    }
    return 0;
  };

  CubieCube.moveCube = (function () {
    const moveCube = [];
    for (let i = 0; i < 18; i++) {
      moveCube[i] = new CubieCube();
    }
    moveCube[0].init([3, 0, 1, 2, 4, 5, 6, 7], [6, 0, 2, 4, 8, 10, 12, 14, 16, 18, 20, 22]);
    moveCube[3].init([20, 1, 2, 8, 15, 5, 6, 19], [16, 2, 4, 6, 22, 10, 12, 14, 8, 18, 20, 0]);
    moveCube[6].init([9, 21, 2, 3, 16, 12, 6, 7], [0, 19, 4, 6, 8, 17, 12, 14, 3, 11, 20, 22]);
    moveCube[9].init([0, 1, 2, 3, 5, 6, 7, 4], [0, 2, 4, 6, 10, 12, 14, 8, 16, 18, 20, 22]);
    moveCube[12].init([0, 10, 22, 3, 4, 17, 13, 7], [0, 2, 20, 6, 8, 10, 18, 14, 16, 4, 12, 22]);
    moveCube[15].init([0, 1, 11, 23, 4, 5, 18, 14], [0, 2, 4, 23, 8, 10, 12, 21, 16, 18, 7, 15]);
    for (let a = 0; a < 18; a += 3) {
      for (let p = 0; p < 2; p++) {
        CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
        CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
      }
    }
    return moveCube;
  }());

  CubieCube.rotCube = (function () {
    const u4 = new CubieCube().init([3, 0, 1, 2, 7, 4, 5, 6], [6, 0, 2, 4, 14, 8, 10, 12, 23, 17, 19, 21]);
    const f2 = new CubieCube().init([5, 4, 7, 6, 1, 0, 3, 2], [12, 10, 8, 14, 4, 2, 0, 6, 18, 16, 22, 20]);
    const urf = new CubieCube().init([8, 20, 13, 17, 19, 15, 22, 10], [3, 16, 11, 18, 7, 22, 15, 20, 1, 9, 13, 5]);
    const c = new CubieCube();
    const d = new CubieCube();
    const rotCube = [];
    for (var i = 0; i < 24; i++) {
      rotCube[i] = new CubieCube().init(c.ca, c.ea);
      CubieCube.CornMult(c, u4, d);
      CubieCube.EdgeMult(c, u4, d);
      c.init(d.ca, d.ea);
      if (i % 4 == 3) {
        CubieCube.CornMult(c, f2, d);
        CubieCube.EdgeMult(c, f2, d);
        c.init(d.ca, d.ea);
      }
      if (i % 8 == 7) {
        CubieCube.CornMult(c, urf, d);
        CubieCube.EdgeMult(c, urf, d);
        c.init(d.ca, d.ea);
      }
    }

    const movHash = [];
    const rotHash = [];
    const rotMult = [];
    const rotMulI = [];
    const rotMulM = [];
    for (var i = 0; i < 24; i++) {
      rotHash[i] = rotCube[i].hashCode();
      rotMult[i] = [];
      rotMulI[i] = [];
      rotMulM[i] = [];
    }
    for (var i = 0; i < 18; i++) {
      movHash[i] = CubieCube.moveCube[i].hashCode();
    }
    for (var i = 0; i < 24; i++) {
      for (var j = 0; j < 24; j++) {
        CubieCube.CornMult(rotCube[i], rotCube[j], c);
        CubieCube.EdgeMult(rotCube[i], rotCube[j], c);
        var k = rotHash.indexOf(c.hashCode());
        rotMult[i][j] = k;
        rotMulI[k][j] = i;
      }
    }
    for (var i = 0; i < 24; i++) {
      for (var j = 0; j < 18; j++) {
        CubieCube.CornMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
        CubieCube.EdgeMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
        CubieCube.CornMult(c, rotCube[i], d);
        CubieCube.EdgeMult(c, rotCube[i], d);
        var k = movHash.indexOf(d.hashCode());
        rotMulM[i][j] = k;
      }
    }

    const rot2str = [
      '', "y'", 'y2', 'y',
      'z2', "y' z2", 'y2 z2', 'y z2',
      "y' x'", "y2 x'", "y x'", "x'",
      "y' x", 'y2 x', 'y x', 'x',
      'y z', 'z', "y' z", 'y2 z',
      "y' z'", "y2 z'", "y z'", "z'",
    ];

    CubieCube.rotMult = rotMult;
    CubieCube.rotMulI = rotMulI;
    CubieCube.rotMulM = rotMulM;
    CubieCube.rot2str = rot2str;
    return rotCube;
  }());

  CubieCube.prototype.edgeCycles = function () {
    const visited = [];
    const small_cycles = [0, 0, 0];
    let cycles = 0;
    let parity = false;
    for (let x = 0; x < 12; ++x) {
      if (visited[x]) {
        continue;
      }
      let length = -1;
      let flip = false;
      let y = x;
      do {
        visited[y] = true;
        ++length;
        flip ^= this.ea[y] & 1;
        y = this.ea[y] >> 1;
      } while (y != x);
      cycles += length >> 1;
      if (length & 1) {
        parity = !parity;
        ++cycles;
      }
      if (flip) {
        if (length == 0) {
          ++small_cycles[0];
        } else if (length & 1) {
          small_cycles[2] ^= 1;
        } else {
          ++small_cycles[1];
        }
      }
    }
    small_cycles[1] += small_cycles[2];
    if (small_cycles[0] < small_cycles[1]) {
      cycles += (small_cycles[0] + small_cycles[1]) >> 1;
    } else {
      const flip_cycles = [0, 2, 3, 5, 6, 8, 9];
      cycles += small_cycles[1] + flip_cycles[(small_cycles[0] - small_cycles[1]) >> 1];
    }
    return cycles - parity;
  };

  const CubeMoveRE = /^\s*([URFDLB]w?|[EMSyxz]|2-2[URFDLB]w)(['2]?)(@\d+)?\s*$/;
  const tmpCubie = new CubieCube();
  CubieCube.prototype.selfMoveStr = function (moveStr, isInv) {
    let m = CubeMoveRE.exec(moveStr);
    if (!m) {
      return;
    }
    const face = m[1];
    let pow = "2'".indexOf(m[2] || '-') + 2;
    if (isInv) {
      pow = 4 - pow;
    }
    if (m[3]) {
      this.tstamp = ~~m[3].slice(1);
    }
    this.ori = this.ori || 0;
    let axis = 'URFDLB'.indexOf(face);
    if (axis != -1) {
      m = axis * 3 + pow % 4 - 1;
      m = CubieCube.rotMulM[this.ori][m];
      CubieCube.EdgeMult(this, CubieCube.moveCube[m], tmpCubie);
      CubieCube.CornMult(this, CubieCube.moveCube[m], tmpCubie);
      this.init(tmpCubie.ca, tmpCubie.ea);
      return m;
    }
    axis = 'UwRwFwDwLwBw'.indexOf(face);
    if (axis != -1) {
      axis >>= 1;
      m = (axis + 3) % 6 * 3 + pow % 4 - 1;
      m = CubieCube.rotMulM[this.ori][m];
      CubieCube.EdgeMult(this, CubieCube.moveCube[m], tmpCubie);
      CubieCube.CornMult(this, CubieCube.moveCube[m], tmpCubie);
      this.init(tmpCubie.ca, tmpCubie.ea);
      var rot = [3, 15, 17, 1, 11, 23][axis];
      for (var i = 0; i < pow; i++) {
        this.ori = CubieCube.rotMult[rot][this.ori];
      }
      return m;
    }
    axis = ['2-2Uw', '2-2Rw', '2-2Fw', '2-2Dw', '2-2Lw', '2-2Bw'].indexOf(face);
    if (axis == -1) {
      axis = [null, null, 'S', 'E', 'M', null].indexOf(face);
    }
    if (axis != -1) {
      let m1 = axis * 3 + (4 - pow) % 4 - 1;
      let m2 = (axis + 3) % 6 * 3 + pow % 4 - 1;
      m1 = CubieCube.rotMulM[this.ori][m1];
      CubieCube.EdgeMult(this, CubieCube.moveCube[m1], tmpCubie);
      CubieCube.CornMult(this, CubieCube.moveCube[m1], tmpCubie);
      this.init(tmpCubie.ca, tmpCubie.ea);
      m2 = CubieCube.rotMulM[this.ori][m2];
      CubieCube.EdgeMult(this, CubieCube.moveCube[m2], tmpCubie);
      CubieCube.CornMult(this, CubieCube.moveCube[m2], tmpCubie);
      this.init(tmpCubie.ca, tmpCubie.ea);
      var rot = [3, 15, 17, 1, 11, 23][axis];
      for (var i = 0; i < pow; i++) {
        this.ori = CubieCube.rotMult[rot][this.ori];
      }
      return m1 + 18;
    }
    axis = 'yxz'.indexOf(face);
    if (axis != -1) {
      var rot = [3, 15, 17][axis];
      for (var i = 0; i < pow; i++) {
        this.ori = CubieCube.rotMult[rot][this.ori];
      }
    }
  };

  CubieCube.prototype.selfConj = function (conj) {
    if (conj === undefined) {
      conj = this.ori;
    }
    if (conj != 0) {
      CubieCube.CornMult(CubieCube.rotCube[conj], this, tmpCubie);
      CubieCube.EdgeMult(CubieCube.rotCube[conj], this, tmpCubie);
      CubieCube.CornMult(tmpCubie, CubieCube.rotCube[CubieCube.rotMulI[0][conj]], this);
      CubieCube.EdgeMult(tmpCubie, CubieCube.rotCube[CubieCube.rotMulI[0][conj]], this);
      this.ori = CubieCube.rotMulI[this.ori][conj] || 0;
    }
  };

  const minx = (function () {
    const U = 0; const R = 1; const F = 2; const L = 3; const BL = 4; const BR = 5; const DR = 6; const DL = 7; const DBL = 8; const B = 9; const DBR = 10; const
      D = 11;
    const oppFace = [D, DBL, B, DBR, DR, DL, BL, BR, R, F, L, U];
    const adjFaces = [
      [BR, R, F, L, BL], // U
      [DBR, DR, F, U, BR], // R
      [DR, DL, L, U, R], // F
      [DL, DBL, BL, U, F], // L
      [DBL, B, BR, U, L], // BL
      [B, DBR, R, U, BL], // BR
      [D, DL, F, R, DBR], // DR
      [D, DBL, L, F, DR], // DL
      [D, B, BL, L, DL], // DBL
      [D, DBR, BR, BL, DBL], // B
      [D, DR, R, BR, B], // DBR
      [DR, DBR, B, DBL, DL], // D
    ];

    // wide: 0=single, 1=all, 2=all but single
    // state: corn*5, edge*5, center*1
    function doMove(state, face, pow, wide) {
      pow = (pow % 5 + 5) % 5;
      if (pow == 0) {
        return;
      }
      const base = face * 11;
      const adjs = [];
      const swaps = [[], [], [], [], []];
      for (var i = 0; i < 5; i++) {
        const aface = adjFaces[face][i];
        const ridx = adjFaces[aface].indexOf(face);
        if (wide == 0 || wide == 1) {
          swaps[i].push(base + i);
          swaps[i].push(base + i + 5);
          swaps[i].push(aface * 11 + ridx % 5 + 5);
          swaps[i].push(aface * 11 + ridx % 5);
          swaps[i].push(aface * 11 + (ridx + 1) % 5);
        }
        if (wide == 1 || wide == 2) {
          swaps[i].push(aface * 11 + 10);
          for (var j = 1; j < 5; j++) {
            swaps[i].push(aface * 11 + (ridx + j) % 5 + 5);
          }
          for (var j = 2; j < 5; j++) {
            swaps[i].push(aface * 11 + (ridx + j) % 5);
          }
          const ii = 4 - i;
          const opp = oppFace[face];
          const oaface = adjFaces[opp][ii];
          const oridx = adjFaces[oaface].indexOf(opp);
          swaps[i].push(opp * 11 + ii);
          swaps[i].push(opp * 11 + ii + 5);
          swaps[i].push(oaface * 11 + 10);
          for (var j = 0; j < 5; j++) {
            swaps[i].push(oaface * 11 + (oridx + j) % 5 + 5);
            swaps[i].push(oaface * 11 + (oridx + j) % 5);
          }
        }
      }
      for (var i = 0; i < swaps[0].length; i++) {
        mathlib.acycle(state, [swaps[0][i], swaps[1][i], swaps[2][i], swaps[3][i], swaps[4][i]], pow);
      }
    }

    return {
      doMove,
      oppFace,
      adjFaces,
    };
  }());

  function createPrun(prun, init, size, maxd, doMove, N_MOVES, N_POWER, N_INV) {
    const isMoveTable = $.isArray(doMove);
    N_MOVES = N_MOVES || 6;
    N_POWER = N_POWER || 3;
    N_INV = N_INV || 256;
    maxd = maxd || 256;
    for (var i = 0, len = (size + 7) >>> 3; i < len; i++) {
      prun[i] = -1;
    }
    if (!$.isArray(init)) {
      init = [init];
    }
    for (var i = 0; i < init.length; i++) {
      prun[init[i] >> 3] ^= 15 << ((init[i] & 7) << 2);
    }
    let val = 0;
    // var t = +new Date;
    for (let l = 0; l <= maxd; l++) {
      let done = 0;
      const inv = l >= N_INV;
      const fill = (l + 1) ^ 15;
      const find = inv ? 0xf : l;
      const check = inv ? l : 0xf;

      out: for (let p = 0; p < size; p++, val >>= 4) {
        if ((p & 7) == 0) {
          val = prun[p >> 3];
          if (!inv && val == -1) {
            p += 7;
            continue;
          }
        }
        if ((val & 0xf) != find) {
          continue;
        }
        for (let m = 0; m < N_MOVES; m++) {
          let q = p;
          for (let c = 0; c < N_POWER; c++) {
            q = isMoveTable ? doMove[m][q] : doMove(q, m);
            if (getPruning(prun, q) != check) {
              continue;
            }
            ++done;
            if (inv) {
              prun[p >> 3] ^= fill << ((p & 7) << 2);
              continue out;
            }
            prun[q >> 3] ^= fill << ((q & 7) << 2);
          }
        }
      }
      if (done == 0) {
        break;
      }
      DEBUG && console.log('[prun]', done);
    }
  }

  // state_params: [[init, doMove, size, [maxd], [N_INV]], [...]...]
  function Solver(N_MOVES, N_POWER, state_params) {
    this.N_STATES = state_params.length;
    this.N_MOVES = N_MOVES;
    this.N_POWER = N_POWER;
    this.state_params = state_params;
    this.inited = false;
  }

  let _ = Solver.prototype;

  _.search = function (state, minl, MAXL) {
    MAXL = (MAXL || 99) + 1;
    if (!this.inited) {
      this.move = [];
      this.prun = [];
      for (let i = 0; i < this.N_STATES; i++) {
        const state_param = this.state_params[i];
        const init = state_param[0];
        const doMove = state_param[1];
        const size = state_param[2];
        const maxd = state_param[3];
        const N_INV = state_param[4];
        this.move[i] = [];
        this.prun[i] = [];
        createMove(this.move[i], size, doMove, this.N_MOVES);
        createPrun(this.prun[i], init, size, maxd, this.move[i], this.N_MOVES, this.N_POWER, N_INV);
      }
      this.inited = true;
    }
    this.sol = [];
    for (var maxl = minl; maxl < MAXL; maxl++) {
      if (this.idaSearch(state, maxl, -1)) {
        break;
      }
    }
    return maxl == MAXL ? null : this.sol.reverse();
  };

  _.toStr = function (sol, move_map, power_map) {
    const ret = [];
    for (let i = 0; i < sol.length; i++) {
      ret.push(move_map[sol[i][0]] + power_map[sol[i][1]]);
    }
    return ret.join(' ').replace(/ +/g, ' ');
  };

  _.idaSearch = function (state, maxl, lm) {
    const { N_STATES } = this;
    for (var i = 0; i < N_STATES; i++) {
      if (getPruning(this.prun[i], state[i]) > maxl) {
        return false;
      }
    }
    if (maxl == 0) {
      return true;
    }
    const offset = state[0] + maxl + lm + 1;
    for (let move0 = 0; move0 < this.N_MOVES; move0++) {
      const move = (move0 + offset) % this.N_MOVES;
      if (move == lm) {
        continue;
      }
      const cur_state = state.slice();
      for (let power = 0; power < this.N_POWER; power++) {
        for (var i = 0; i < N_STATES; i++) {
          cur_state[i] = this.move[i][move][cur_state[i]];
        }
        if (this.idaSearch(cur_state, maxl - 1, move)) {
          this.sol.push([move, power]);
          return true;
        }
      }
    }
    return false;
  };

  function Searcher(isSolved, getPrun, doMove, N_AXIS, N_POWER, ckmv) {
    this.isSolved = isSolved || function () { return true; };
    this.getPrun = getPrun;
    this.doMove = doMove;
    this.N_AXIS = N_AXIS;
    this.N_POWER = N_POWER;
    this.ckmv = ckmv || valuedArray(N_AXIS, (i) => 1 << i);
  }

  _ = Searcher.prototype;

  _.solve = function (idx, maxl, callback) {
    const sols = this.solveMulti([idx], maxl, callback);
    return sols == null ? null : sols[0];
  };

  _.solveMulti = function (idxs, maxl, callback) {
    this.callback = callback || function () { return true; };
    const sol = [];
    out: for (let l = 0; l <= maxl; l++) {
      for (let s = 0; s < idxs.length; s++) {
        this.sidx = s;
        if (this.idaSearch(idxs[s], l, -1, sol) == 0) {
          break out;
        }
      }
      this.sidx = -1;
    }
    return this.sidx == -1 ? null : [sol, this.sidx];
  };

  _.idaSearch = function (idx, maxl, lm, sol) {
    const prun = this.getPrun(idx);
    if (prun > maxl) {
      return prun > maxl + 1 ? 2 : 1;
    }
    if (maxl == 0) {
      return this.isSolved(idx) && this.callback(sol, this.sidx) ? 0 : 1;
    }
    if (prun == 0 && this.isSolved(idx) && maxl == 1) {
      return 1;
    }
    for (let axis = 0; axis < this.N_AXIS; axis++) {
      if (this.ckmv[lm] >> axis & 1) {
        continue;
      }
      let idx1 = idx;
      for (let pow = 0; pow < this.N_POWER; pow++) {
        idx1 = this.doMove(idx1, axis);
        if (idx1 == null) {
          break;
        }
        sol.push([axis, pow]);
        const ret = this.idaSearch(idx1, maxl - 1, axis, sol);
        if (ret == 0) {
          return 0;
        }
        sol.pop();
        if (ret == 2) {
          break;
        }
      }
    }
    return 1;
  };

  // state: string not null
  // solvedStates: [solvedstate, solvedstate, ...], string not null
  // moveFunc: function(state, move);
  // moves: {move: face0 | axis0}, face0 | axis0 = 4 + 4 bits
  function gSolver(solvedStates, doMove, moves) {
    this.solvedStates = solvedStates;
    this.doMove = doMove;
    this.movesList = [];
    for (const move in moves) {
      this.movesList.push([move, moves[move]]);
    }
    this.prunTable = {};
    this.toUpdateArr = null;
    this.prunTableSize = 0;
    this.prunDepth = -1;
    this.cost = 0;
    this.MAX_PRUN_SIZE = 100000;
  }

  _ = gSolver.prototype;

  /*
	_.calcNumOfStates = function() {
		var len = this.solvedStates[0].length;
		var genMove = [];
		for (var moveIdx = 0; moveIdx < this.movesList.length; moveIdx++) {
			var state = [];
			for (var i = 0; i < len; i++) {
				state.push(i + 32);
			}
			var newState = this.doMove(String.fromCharCode.apply(null, state), this.movesList[moveIdx][0]);
			if (!newState) {
				continue;
			}
			for (var i = 0; i < len; i++) {
				state[i] = newState.charCodeAt(i) - 32;
			}
			genMove.push(state);
		}
		console.log(genMove);
		var sgsObj = new SchreierSims(genMove);
		console.log(sgsObj.size());
		return sgsObj;

		var genColor = [];
		var state = this.solvedStates[0];
		var e = [];
		for (var i = 0; i < len; i++) {
			e[i] = i;
		}
		var checked = [];
		for (var i = 0; i < len; i++) {
			if (checked[i]) {
				continue;
			}
			for (var j = i + 1; j < len; j++) {
				if (state[i] == state[j] && (i % 9 % 2) == (j % 9 % 2)) {
					var perm = e.slice();
					perm[i] = j;
					perm[j] = i;
					checked[j] = 1;
					genColor.push(perm);
				}
			}
		}

		var sgsObj = new SchreierSims(genMove);
		sgsObj.minkwitz();
		var perm = e.slice();
		var initMv = [];
		for (var i = 0; i < 50; i++) {
			var mv = rn(genMove.length);
			perm = sgsObj.permMult(genMove[mv], perm);
			initMv.push(sgsObj.invMap[mv]);
		}
		var sol = sgsObj.getGen(perm);
		var move2str = function(v) { return "URFDLB"[~~(v/3)] + " 2'"[v%3]; };
		sol = $.map(Array.prototype.concat.apply([], sol).reverse(), move2str).join(' ');
		console.log($.map(initMv.reverse(), move2str).join(' '), '\n', sol);

		var sgs0, sgs1, sgs01;
		for (var r = 0; r < 100; r++) {
			var shuffle = [];
			for (var i = 0; i < len; i++) {
				shuffle[i] = i;
			}
			for (var i = 0; i < len; i++) {
				var j = ~~(Math.random() * (len - i)) + i;
				var tmp = shuffle[i];
				shuffle[i] = shuffle[j];
				shuffle[j] = tmp;
			}
			sgs0 = new SchreierSims(genColor, shuffle);
			sgs1 = new SchreierSims(genMove, shuffle);
			sgs01 = sgs0.intersect(sgs1);
			if (sgs01.cnt != -1) {
				console.log(r);
				break;
			}
		}
		console.log(sgs01.cnt, sgs0.size(), sgs1.size(), sgs01.size(), sgs1.size() / sgs01.size());
	};
	*/

  _.updatePrun = function (targetDepth) {
    targetDepth = targetDepth === undefined ? this.prunDepth + 1 : targetDepth;
    for (let depth = this.prunDepth + 1; depth <= targetDepth; depth++) {
      if (this.prevSize >= this.MAX_PRUN_SIZE) {
        DEBUG && console.log('[gSolver] skipPrun', depth, this.prunTableSize);
        break;
      }
      const t = +new Date();
      if (depth < 1) {
        this.prevSize = 0;
        for (let i = 0; i < this.solvedStates.length; i++) {
          const state = this.solvedStates[i];
          if (!(state in this.prunTable)) {
            this.prunTable[state] = depth;
            this.prunTableSize++;
          }
        }
      } else {
        this.updatePrunBFS(depth - 1);
      }
      if (this.cost == 0) {
        return;
      }
      this.prunDepth = depth;
      DEBUG && console.log('[gSolver] updatePrun', depth, this.prunTableSize - this.prevSize, +new Date() - t);
      this.prevSize = this.prunTableSize;
    }
  };

  _.updatePrunBFS = function (fromDepth) {
    if (this.toUpdateArr == null) {
      this.toUpdateArr = [];
      for (var state in this.prunTable) {
        if (this.prunTable[state] != fromDepth) {
          continue;
        }
        this.toUpdateArr.push(state);
      }
    }
    while (this.toUpdateArr.length != 0) {
      var state = this.toUpdateArr.pop();
      for (let moveIdx = 0; moveIdx < this.movesList.length; moveIdx++) {
        const newState = this.doMove(state, this.movesList[moveIdx][0]);
        if (!newState || newState in this.prunTable) {
          continue;
        }
        this.prunTable[newState] = fromDepth + 1;
        this.prunTableSize++;
      }
      if (this.cost >= 0) {
        if (this.cost == 0) {
          return;
        }
        this.cost--;
      }
    }
    this.toUpdateArr = null;
  };

  _.search = function (state, minl, MAXL) {
    this.sol = [];
    this.subOpt = false;
    this.state = state;
    this.visited = {};
    this.maxl = minl = minl || 0;
    return this.searchNext(MAXL);
  };

  _.searchNext = function (MAXL, cost) {
    MAXL = (MAXL + 1) || 99;
    this.prevSolStr = this.solArr ? this.solArr.join(',') : null;
    this.solArr = null;
    this.cost = cost || -1;
    for (; this.maxl < MAXL; this.maxl++) {
      this.updatePrun(Math.ceil(this.maxl / 2));
      if (this.cost == 0) {
        return null;
      }
      if (this.idaSearch(this.state, this.maxl, null, 0)) {
        break;
      }
    }
    return this.solArr;
  };

  _.getPruning = function (state) {
    const prun = this.prunTable[state];
    return prun === undefined ? this.prunDepth + 1 : prun;
  };

  _.idaSearch = function (state, maxl, lm, depth) {
    if (this.getPruning(state) > maxl) {
      return false;
    }
    if (maxl == 0) {
      if (this.solvedStates.indexOf(state) == -1) {
        return false;
      }
      const solArr = this.getSolArr();
      this.subOpt = true;
      if (solArr.join(',') == this.prevSolStr) {
        return false;
      }
      this.solArr = solArr;
      return true;
    }
    if (!this.subOpt) {
      if (state in this.visited && this.visited[state] < depth) {
        return false;
      }
      this.visited[state] = depth;
    }
    if (this.cost >= 0) {
      if (this.cost == 0) {
        return true;
      }
      this.cost--;
    }
    const lastMove = lm == null ? '' : this.movesList[lm][0];
    const lastAxisFace = lm == null ? -1 : this.movesList[lm][1];
    for (let moveIdx = this.sol[depth] || 0; moveIdx < this.movesList.length; moveIdx++) {
      const moveArgs = this.movesList[moveIdx];
      const axisface = moveArgs[1] ^ lastAxisFace;
      const move = moveArgs[0];
      if (axisface == 0
				|| (axisface & 0xf) == 0 && move <= lastMove) {
        continue;
      }
      const newState = this.doMove(state, move);
      if (!newState || newState == state) {
        continue;
      }
      this.sol[depth] = moveIdx;
      if (this.idaSearch(newState, maxl - 1, moveIdx, depth + 1)) {
        return true;
      }
      this.sol.pop();
    }
    return false;
  };

  _.getSolArr = function () {
    const solArr = [];
    for (let i = 0; i < this.sol.length; i++) {
      solArr.push(this.movesList[this.sol[i]][0]);
    }
    return solArr;
  };

  const randGen = (function () {
    let rndFunc;
    let rndCnt;
    let seedStr; // '' + new Date().getTime();

    function random() {
      rndCnt++;
      // console.log(rndCnt);
      return rndFunc();
    }

    function getSeed() {
      return [rndCnt, seedStr];
    }

    function setSeed(_rndCnt, _seedStr) {
      if (_seedStr && (_seedStr != seedStr || rndCnt > _rndCnt)) {
        // Use the modernRandom implementation directly
        modernRandom.seed(_seedStr);
        rndFunc = modernRandom.random;
        rndCnt = 0;
        seedStr = _seedStr;
      }
      while (rndCnt < _rndCnt) {
        rndFunc();
        rndCnt++;
      }
    }

    let seed = `${new Date().getTime()}`;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      seed = String.fromCharCode.apply(null, crypto.getRandomValues(new Uint16Array(256)));
      DEBUG && console.log('[mathlib] use crypto seed', seed);
    } else {
      DEBUG && console.log('[mathlib] use datetime seed', seed);
    }
    setSeed(256, seed);

    return {
      random,
      getSeed,
      setSeed,
    };
  }());

  function rndEl(x) {
    return x[~~(randGen.random() * x.length)];
  }

  function rn(n) {
    return ~~(randGen.random() * n);
  }

  function rndHit(prob) {
    return randGen.random() < prob;
  }

  function rndPerm(n, isEven) {
    let p = 0;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr[i] = i;
    }
    for (let i = 0; i < n - 1; i++) {
      const k = rn(n - i);
      circle(arr, i, i + k);
      p ^= k != 0;
    }
    if (isEven && p) {
      circle(arr, 0, 1);
    }
    return arr;
  }

  function rndProb(plist) {
    let cum = 0;
    let curIdx = 0;
    for (let i = 0; i < plist.length; i++) {
      if (plist[i] == 0) {
        continue;
      }
      if (randGen.random() < plist[i] / (cum + plist[i])) {
        curIdx = i;
      }
      cum += plist[i];
    }
    return curIdx;
  }

  function time2str(unix, format) {
    if (!unix) {
      return 'N/A';
    }
    format = format || '%Y-%M-%D %h:%m:%s';
    const date = new Date(unix * 1000);
    return format
      .replace('%Y', date.getFullYear())
      .replace('%M', (`0${date.getMonth() + 1}`).slice(-2))
      .replace('%D', (`0${date.getDate()}`).slice(-2))
      .replace('%h', (`0${date.getHours()}`).slice(-2))
      .replace('%m', (`0${date.getMinutes()}`).slice(-2))
      .replace('%s', (`0${date.getSeconds()}`).slice(-2));
  }

  const timeRe = /^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/;

  function str2time(val) {
    const m = timeRe.exec(val);
    if (!m) {
      return null;
    }
    const date = new Date(0);
    date.setFullYear(~~m[1]);
    date.setMonth(~~m[2] - 1);
    date.setDate(~~m[3]);
    date.setHours(~~m[4]);
    date.setMinutes(~~m[5]);
    date.setSeconds(~~m[6]);
    return ~~(date.getTime() / 1000);
  }

  function obj2str(val) {
    if (typeof val === 'string') {
      return val;
    }
    return JSON.stringify(val);
  }

  function str2obj(val) {
    if (typeof val !== 'string') {
      return val;
    }
    return JSON.parse(val);
  }

  function valuedArray(len, val) {
    const ret = [];
    const isFun = typeof val === 'function';
    for (let i = 0; i < len; i++) {
      ret[i] = isFun ? val(i) : val;
    }
    return ret;
  }

  function idxArray(arr, idx) {
    const ret = [];
    for (let i = 0; i < arr.length; i++) {
      ret.push(arr[i][idx]);
    }
    return ret;
  }

  Math.TAU = Math.PI * 2;

  return {
    Cnk,
    fact,
    bitCount,
    getPruning,
    setNOri,
    getNOri,
    setNPerm,
    getNPerm,
    getNParity,
    coord,
    createMove,
    createMoveHash,
    edgeMove,
    circle,
    circleOri,
    acycle,
    createPrun,
    CubieCube,
    minx,
    SOLVED_FACELET: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB',
    fillFacelet,
    detectFacelet,
    rn,
    rndEl,
    rndProb,
    rndHit,
    time2str,
    str2time,
    obj2str,
    str2obj,
    valuedArray,
    idxArray,
    Solver,
    Searcher,
    rndPerm,
    gSolver,
    getSeed: randGen.getSeed,
    setSeed: randGen.setSeed,
  };
}());

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

const GiikerCube = function () {
  let cube;
  let _device = null;
  const solved = false;

  function matchUUID(uuid1, uuid2) {
    return uuid1.toUpperCase() == uuid2.toUpperCase();
  }

  const GanCube = (function () {
    const callback = $.noop;
    const evtCallback = $.noop;

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
      decoder = $.aes128(keyiv[0]);
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
      const locTime = $.now();
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
        const locTime = $.now();
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
      const locTime = $.now();
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
      return v3sendRequest(req).catch($.noop);
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
      const locTime = $.now();
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
        result = _chrct_v2read.stopNotifications().catch($.noop);
        _chrct_v2read = null;
      }
      if (_chrct_v3read) {
        _chrct_v3read.removeEventListener('characteristicvaluechanged', onStateChangedV3);
        result = _chrct_v3read.stopNotifications().catch($.noop);
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
