/* eslint-disable no-param-reassign */
/**
 * Converts between Rubik's cube states and unique numbers (0 to 43,252,003,274,489,856,000 - 1)
 * Uses Lehmer codes for permutations and direct encoding for orientations
 */

export class CubeNumberConverter {
  // Total number of possible cube states
  private static readonly TOTAL_STATES = BigInt('43252003274489856000');

  // Component sizes
  private static readonly CORNER_PERMS = 40320n; // 8!

  private static readonly CORNER_ORIS = 2187n; // 3^7

  private static readonly EDGE_PERMS = 479001600n; // 12!

  private static readonly EDGE_ORIS = 2048n; // 2^11

  /**
   * Converts corner permutation to Lehmer code
   * @param corners Array of 8 corner positions (0-7)
   * @returns Lehmer code for the permutation
   */
  private static cornersToLehmer(corners: number[]): number {
    let lehmer = 0;
    const n = corners.length;

    for (let i = 0; i < n - 1; i++) {
      let count = 0;
      for (let j = i + 1; j < n; j++) {
        if (corners[i] > corners[j]) {
          count++;
        }
      }
      lehmer = lehmer * (n - i) + count;
    }

    return lehmer;
  }

  /**
   * Converts Lehmer code to corner permutation
   * @param lehmer Lehmer code
   * @returns Array of corner positions
   */
  private static lehmerToCorners(lehmer: number): number[] {
    const n = 8;
    const perm: number[] = [];
    const available = Array.from({ length: n }, (_, i) => i);

    for (let i = n - 1; i >= 0; i--) {
      const index = lehmer % (i + 1);
      lehmer = Math.floor(lehmer / (i + 1));
      perm.push(available.splice(index, 1)[0]);
    }

    return perm.reverse();
  }

  /**
   * Converts edge permutation to Lehmer code
   * @param edges Array of 12 edge positions (0-11)
   * @returns Lehmer code for the permutation
   */
  private static edgesToLehmer(edges: number[]): number {
    let lehmer = 0;
    const n = edges.length;

    for (let i = 0; i < n - 1; i++) {
      let count = 0;
      for (let j = i + 1; j < n; j++) {
        if (edges[i] > edges[j]) {
          count++;
        }
      }
      lehmer = lehmer * (n - i) + count;
    }

    return lehmer;
  }

  /**
   * Converts Lehmer code to edge permutation
   * @param lehmer Lehmer code
   * @returns Array of edge positions
   */
  private static lehmerToEdges(lehmer: number): number[] {
    const n = 12;
    const perm: number[] = [];
    const available = Array.from({ length: n }, (_, i) => i);

    for (let i = n - 1; i >= 0; i--) {
      const index = lehmer % (i + 1);
      lehmer = Math.floor(lehmer / (i + 1));
      perm.push(available.splice(index, 1)[0]);
    }

    return perm.reverse();
  }

  /**
   * Extracts corner orientations from corner array
   * @param ca Corner array from CubieCube
   * @returns Array of orientations (0-2)
   */
  private static getCornerOrientations(ca: number[]): number[] {
    return ca.slice(0, 7).map((c) => (c >> 3) & 0x7);
  }

  /**
   * Extracts corner positions from corner array
   * @param ca Corner array from CubieCube
   * @returns Array of positions (0-7)
   */
  private static getCornerPositions(ca: number[]): number[] {
    return ca.map((c) => c & 0x7);
  }

  /**
   * Extracts edge orientations from edge array
   * @param ea Edge array from CubieCube
   * @returns Array of orientations (0-1)
   */
  private static getEdgeOrientations(ea: number[]): number[] {
    return ea.slice(0, 11).map((e) => e & 0x1);
  }

  /**
   * Extracts edge positions from edge array
   * @param ea Edge array from CubieCube
   * @returns Array of positions (0-11)
   */
  private static getEdgePositions(ea: number[]): number[] {
    return ea.map((e) => e >> 1);
  }

  /**
   * Converts corner orientations to a number (base 3)
   * @param orientations Array of 7 orientations (8th is determined by others)
   * @returns Number representing orientations
   */
  private static cornerOriToNumber(orientations: number[]): number {
    let result = 0;
    for (let i = 0; i < 7; i++) {
      result = result * 3 + orientations[i];
    }
    return result;
  }

  /**
   * Converts number to corner orientations
   * @param num Number representing orientations
   * @returns Array of 8 orientations
   */
  private static numberToCornerOri(num: number): number[] {
    const orientations: number[] = [];
    for (let i = 6; i >= 0; i--) {
      orientations.unshift(num % 3);
      num = Math.floor(num / 3);
    }
    // Calculate 8th orientation
    const sum = orientations.reduce((a, b) => a + b, 0);
    orientations.push((3 - (sum % 3)) % 3);
    return orientations;
  }

  /**
   * Converts edge orientations to a number (base 2)
   * @param orientations Array of 11 orientations (12th is determined by others)
   * @returns Number representing orientations
   */
  private static edgeOriToNumber(orientations: number[]): number {
    let result = 0;
    for (let i = 0; i < 11; i++) {
      result = result * 2 + orientations[i];
    }
    return result;
  }

  /**
   * Converts number to edge orientations
   * @param num Number representing orientations
   * @returns Array of 12 orientations
   */
  private static numberToEdgeOri(num: number): number[] {
    const orientations: number[] = [];
    for (let i = 10; i >= 0; i--) {
      orientations.unshift(num % 2);
      num = Math.floor(num / 2);
    }
    // Calculate 12th orientation
    const sum = orientations.reduce((a, b) => a + b, 0);
    orientations.push(sum % 2);
    return orientations;
  }

  /**
   * Converts cube state to a unique number
   * @param ca Corner array from CubieCube
   * @param ea Edge array from CubieCube
   * @returns BigInt representing the unique cube state (0 to TOTAL_STATES-1)
   */
  public static cubeStateToNumber(ca: number[], ea: number[]): bigint {
    // Extract components
    const cornerPositions = this.getCornerPositions(ca);
    const cornerOrientations = this.getCornerOrientations(ca);
    const edgePositions = this.getEdgePositions(ea);
    const edgeOrientations = this.getEdgeOrientations(ea);

    // Convert to numbers
    const cornerPermNum = BigInt(this.cornersToLehmer(cornerPositions));
    const cornerOriNum = BigInt(this.cornerOriToNumber(cornerOrientations));
    const edgePermNum = BigInt(this.edgesToLehmer(edgePositions));
    const edgeOriNum = BigInt(this.edgeOriToNumber(edgeOrientations));

    // Combine using mixed radix system
    const result = edgeOriNum
      + this.EDGE_ORIS * (edgePermNum
      + this.EDGE_PERMS * (cornerOriNum
      + this.CORNER_ORIS * cornerPermNum));

    return result;
  }

  /**
   * Converts a unique number back to cube state
   * @param cubeNumber BigInt representing the cube state
   * @returns Object with corner array and edge array
   */
  public static numberToCubeState(cubeNumber: bigint): { ca: number[], ea: number[] } {
    // Validate input
    if (cubeNumber < 0n || cubeNumber >= this.TOTAL_STATES) {
      throw new Error(`Cube number must be between 0 and ${this.TOTAL_STATES - 1n}`);
    }

    // Extract components
    const edgeOriNum = Number(cubeNumber % this.EDGE_ORIS);
    cubeNumber /= this.EDGE_ORIS;

    const edgePermNum = Number(cubeNumber % this.EDGE_PERMS);
    cubeNumber /= this.EDGE_PERMS;

    const cornerOriNum = Number(cubeNumber % this.CORNER_ORIS);
    cubeNumber /= this.CORNER_ORIS;

    const cornerPermNum = Number(cubeNumber);

    // Convert back to arrays
    const cornerPositions = this.lehmerToCorners(cornerPermNum);
    const cornerOrientations = this.numberToCornerOri(cornerOriNum);
    const edgePositions = this.lehmerToEdges(edgePermNum);
    const edgeOrientations = this.numberToEdgeOri(edgeOriNum);

    // Build corner and edge arrays
    const ca: number[] = [];
    for (let i = 0; i < 8; i++) {
      ca[i] = (cornerOrientations[i] << 3) | cornerPositions[i];
    }

    const ea: number[] = [];
    for (let i = 0; i < 12; i++) {
      ea[i] = (edgePositions[i] << 1) | edgeOrientations[i];
    }

    return { ca, ea };
  }

  /**
   * Converts cube number to hexadecimal string (for storage/display)
   * @param cubeNumber BigInt cube number
   * @returns Hex string representation
   */
  public static cubeNumberToHex(cubeNumber: bigint): string {
    return cubeNumber.toString(16).padStart(16, '0');
  }

  /**
   * Converts hexadecimal string to cube number
   * @param hex Hex string representation
   * @returns BigInt cube number
   */
  public static hexToCubeNumber(hex: string): bigint {
    return BigInt(`0x${hex}`);
  }
}
