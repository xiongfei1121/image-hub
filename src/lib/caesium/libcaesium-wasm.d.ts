declare module './libcaesium-wasm' {
  interface CaesiumModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAP8: Int8Array;
    HEAPU8: Uint8Array;
    cwrap(ident: string, returnType: string, argTypes: string[]): (...args: number[]) => number;
    getValue(ptr: number, type: string): number;
    ready: Promise<unknown>;
  }

  type CaesiumFactory = (options?: { locateFile?: (path: string) => string }) => Promise<CaesiumModule>;

  const CaesiumWASM: CaesiumFactory;
  export default CaesiumWASM;
}