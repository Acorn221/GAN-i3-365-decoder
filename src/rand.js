/* eslint-disable */

/**
 * Modern replacement for isaac PRNG using Web Crypto API
 * Provides a compatible API with the original isaac implementation
 */
export const modernRandom = (function() {
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