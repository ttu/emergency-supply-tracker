import 'vitest';
import type { ProvidedContext } from 'vitest';

declare module 'vitest' {
  export interface ProvidedContext {
    fakerSeed: number;
  }
}

declare module 'vitest/node' {
  /**
   * Context object passed to globalSetup function.
   * Provides mechanism to share data with test workers via the provide method.
   */
  export interface GlobalSetupContext {
    provide: <T extends keyof ProvidedContext & string>(
      key: T,
      value: ProvidedContext[T],
    ) => void;
  }
}
