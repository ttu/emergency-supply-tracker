import 'vitest';

declare module 'vitest' {
  export interface ProvidedContext {
    fakerSeed: number;
  }
}
