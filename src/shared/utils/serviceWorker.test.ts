import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { register, unregister } from './serviceWorker';

describe('serviceWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('register', () => {
    it('should not register if serviceWorker is not supported', () => {
      // Save original
      const originalServiceWorker = Object.getOwnPropertyDescriptor(
        global.navigator,
        'serviceWorker',
      );

      // Remove serviceWorker
      Reflect.deleteProperty(global.navigator, 'serviceWorker');

      const addEventListener = vi.fn();
      Object.defineProperty(global, 'window', {
        value: { addEventListener },
        writable: true,
        configurable: true,
      });

      register();

      expect(addEventListener).not.toHaveBeenCalled();

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(
          global.navigator,
          'serviceWorker',
          originalServiceWorker,
        );
      }
    });

    it('should add load event listener when serviceWorker is supported', () => {
      const mockServiceWorkerContainer = {
        register: vi.fn(),
        ready: Promise.resolve({} as ServiceWorkerRegistration),
      };

      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: mockServiceWorkerContainer,
        writable: true,
        configurable: true,
      });

      const addEventListener = vi.fn();
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            hostname: 'localhost',
            origin: 'http://localhost:3000',
            href: 'http://localhost:3000/',
          },
          addEventListener,
        },
        writable: true,
        configurable: true,
      });

      vi.stubGlobal('import.meta', {
        env: {
          BASE_URL: '/',
          DEV: true,
        },
      });

      register();

      expect(addEventListener).toHaveBeenCalledWith(
        'load',
        expect.any(Function),
      );
    });

    it.skip('should handle successful registration with onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const mockInstallingWorker = {
        state: 'installed',
        onstatechange: null as
          | ((this: ServiceWorker, ev: Event) => void)
          | null,
      } as ServiceWorker;

      const mockRegistration = {
        installing: mockInstallingWorker,
        waiting: null,
        active: null,
        onupdatefound: null as
          | ((this: ServiceWorkerRegistration, ev: Event) => void)
          | null,
      } as ServiceWorkerRegistration;

      const mockServiceWorkerContainer = {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve({} as ServiceWorkerRegistration),
        controller: null,
      };

      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: mockServiceWorkerContainer,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(global, 'window', {
        value: {
          location: {
            hostname: 'example.com',
            origin: 'https://example.com',
            href: 'https://example.com/',
          },
          addEventListener: (event: string, callback: () => void) => {
            if (event === 'load') {
              setTimeout(callback, 0);
            }
          },
        },
        writable: true,
        configurable: true,
      });

      vi.stubGlobal('import.meta', {
        env: {
          BASE_URL: '/',
          DEV: true,
        },
      });

      register({ onSuccess });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate onupdatefound
      if (mockRegistration.onupdatefound) {
        mockRegistration.onupdatefound.call(
          mockRegistration,
          new Event('updatefound'),
        );

        // Simulate onstatechange
        if (mockInstallingWorker.onstatechange) {
          mockInstallingWorker.onstatechange.call(
            mockInstallingWorker,
            new Event('statechange'),
          );
        }
      }

      expect(onSuccess).toHaveBeenCalled();
    });

    it.skip('should handle error during registration', async () => {
      const onError = vi.fn();
      const error = new Error('Registration failed');

      const mockServiceWorkerContainer = {
        register: vi.fn().mockRejectedValue(error),
        ready: Promise.resolve({} as ServiceWorkerRegistration),
      };

      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: mockServiceWorkerContainer,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(global, 'window', {
        value: {
          location: {
            hostname: 'example.com',
            origin: 'https://example.com',
            href: 'https://example.com/',
          },
          addEventListener: (event: string, callback: () => void) => {
            if (event === 'load') {
              setTimeout(callback, 0);
            }
          },
        },
        writable: true,
        configurable: true,
      });

      vi.stubGlobal('import.meta', {
        env: {
          BASE_URL: '/',
          DEV: true,
        },
      });

      register({ onError });

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(onError).toHaveBeenCalledWith(error);
      expect(console.error).toHaveBeenCalledWith(
        'Error during service worker registration:',
        error,
      );
    });
  });

  describe('unregister', () => {
    it('should unregister service worker', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true);

      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            unregister: mockUnregister,
          } as unknown as ServiceWorkerRegistration),
        },
        writable: true,
        configurable: true,
      });

      unregister();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(mockUnregister).toHaveBeenCalled();
    });

    it('should do nothing if serviceWorker is not supported', () => {
      const originalServiceWorker = Object.getOwnPropertyDescriptor(
        global.navigator,
        'serviceWorker',
      );

      Reflect.deleteProperty(global.navigator, 'serviceWorker');

      expect(() => unregister()).not.toThrow();
      expect(console.error).not.toHaveBeenCalled();

      if (originalServiceWorker) {
        Object.defineProperty(
          global.navigator,
          'serviceWorker',
          originalServiceWorker,
        );
      }
    });
  });
});
