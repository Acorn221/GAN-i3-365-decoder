/* eslint-disable */

if(!window.$) {
	window.$ = {};
}

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
  window.$.sha256 = function (string) {
    if (/[\x80-\xFF]/.test(string)) {
      string = unescape(encodeURI(string));
    }
    return binb2hex(core_sha256(str2binb(string), string.length * 8));
  };
}());
