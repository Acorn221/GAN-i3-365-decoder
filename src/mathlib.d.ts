// Type declaration for mathlib.js
export namespace mathlib {
  export const SOLVED_FACELET: string;

  export interface ICubieCube {
    ca: number[];
    ea: number[];
    fromFacelet(facelet: string): void;
    toFaceCube(): string;
    faceletToNumber(facelet: string): number;
  }

  export interface CubieCubeConstructor {
    new(): ICubieCube;
    EdgeMult(a: ICubieCube, b: ICubieCube, c: ICubieCube): void;
    CornMult(a: ICubieCube, b: ICubieCube, c: ICubieCube): void;
    moveCube: ICubieCube[];
  }

  export const CubieCube: CubieCubeConstructor;

  // valuedArray can accept either a function or a static value
  export function valuedArray<T>(length: number, valueOrFn: T | ((i: number) => T)): T[];
}
