/* eslint-disable */

/**
 * Type definitions for ModernRandom
 */
export type SeedType = number | number[] | string | null;

export interface InternalState {
  buffer: Uint32Array;
  index: number;
  seed: SeedType;
}

/**
 * Modern replacement for isaac PRNG using Web Crypto API
 * Provides a compatible API with the original isaac implementation
 */
export class ModernRandom {
  // Private class fields for internal state
  private _seedData: SeedType = null;
  private _seedIndex: number = 0;
  private _seedBuffer: Uint32Array = new Uint32Array(256);

  /**
   * Create a new ModernRandom instance
   * @param initialSeed - Optional initial seed value
   */
  constructor(initialSeed?: SeedType) {
    // Initialize with provided seed or random seed
    this.seed(initialSeed ?? String(Math.random()));
  }

  /**
   * Generate cryptographically secure random values using Web Crypto
   * or fall back to Math.random if not available
   */
  private generateRandomValues(): void {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(this._seedBuffer);
    } else {
      // Fallback to Math.random (less secure)
      for (let i = 0; i < this._seedBuffer.length; i++) {
        this._seedBuffer[i] = Math.floor(Math.random() * 0x100000000);
      }
    }
    this._seedIndex = 0;
  }

  /**
   * Reset the internal state
   */
  public reset(): void {
    this._seedData = null;
    this._seedIndex = 0;
    this._seedBuffer = new Uint32Array(256);
    this.generateRandomValues();
  }

  /**
   * Seed the random number generator
   * @param s - Seed value (number, array of numbers, or string)
   */
  public seed(s: SeedType): void {
    // Reset state
    this.reset();
    
    if (s === null) {
      this.generateRandomValues();
      return;
    }
    
    // Handle different seed types
    if (typeof s === 'number') {
      s = [s];
    }
    
    if (Array.isArray(s)) {
      // Use the seed array to influence our random state
      const seedArray = new Uint32Array(s.length);
      for (let i = 0; i < s.length; i++) {
        seedArray[i] = typeof s[i] === 'number' ? s[i] : 0;
      }
      
      // Mix the seed with our random buffer
      for (let i = 0; i < this._seedBuffer.length; i++) {
        this._seedBuffer[i] ^= seedArray[i % seedArray.length];
      }
    } else if (typeof s === 'string') {
      // Convert string to array of character codes
      const charCodes: number[] = [];
      for (let i = 0; i < s.length; i++) {
        charCodes.push(s.charCodeAt(i));
      }
      this.seed(charCodes);
    }
    
    // Store the seed data for potential reuse
    this._seedData = s;
    
    // Generate initial random values
    this.generateRandomValues();
  }

  /**
   * Get a random 32-bit integer
   * @returns A random 32-bit integer
   */
  public rand(): number {
    // If we've used all our random values, generate more
    if (this._seedIndex >= this._seedBuffer.length) {
      this.generateRandomValues();
    }
    
    return this._seedBuffer[this._seedIndex++];
  }

  /**
   * Get a random number between 0 and 1
   * @returns A random number between 0 and 1
   */
  public random(): number {
    return this.rand() / 0x100000000;
  }

  /**
   * Compatibility function for the original isaac API
   * @param n - Number of iterations (default: 1)
   */
  public prng(n?: number): void {
    const iterations = (n !== undefined && typeof n === 'number')
      ? Math.abs(Math.floor(n))
      : 1;
    
    // Just regenerate our random values
    if (iterations > 0) {
      this.generateRandomValues();
    }
  }

  /**
   * Get/set internal state (for compatibility)
   * @param obj - Optional object to set internal state
   * @returns Current internal state
   */
  public internals(obj?: Partial<InternalState>): InternalState {
    const ret: InternalState = {
      buffer: this._seedBuffer.slice(),
      index: this._seedIndex,
      seed: this._seedData
    };
    
    if (obj) {
      if (obj.buffer) this._seedBuffer = obj.buffer.slice();
      if (obj.index !== undefined) this._seedIndex = obj.index;
      if (obj.seed !== undefined) this._seedData = obj.seed;
    }
    
    return ret;
  }
}

/**
 * Default instance for backward compatibility with the original API
 */
export const modernRandom = new ModernRandom();