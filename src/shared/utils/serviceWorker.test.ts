import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest';
import { register, unregister } from './serviceWorker';

/**
 * jsdom's default location is http://localhost:3000/, so the module's
 * isLocalhost check (computed once at import time) is always true in this
 * suite - these tests exercise the localhost/checkValidServiceWorker path.
 */

interface MockRegistration {
  installing: {
    state: string;
    onstatechange: (() => void) | null;
  } | null;
  onupdatefound: (() => void) | null;
  unregister: ReturnType<typeof vi.fn>;
}

function createMockRegistration(): MockRegistration {
  return {
    installing: null,
    onupdatefound: null,
    unregister: vi.fn().mockResolvedValue(true),
  };
}

// register() adds a fresh 'load' listener every call and never removes it,
// so dispatching a real event would also re-fire every earlier test's
// listener (stale mocks, duplicate registrations). Capture only the most
// recently added one and invoke that directly instead.
let capturedLoadCallback: (() => void) | undefined;
let addEventListenerSpy: MockInstance<typeof window.addEventListener>;

function triggerLoad(): void {
  capturedLoadCallback?.();
}

function mockFetchResponse(
  status: number,
  contentType: string | null,
): Response {
  return {
    status,
    headers: { get: () => contentType },
  } as unknown as Response;
}

describe('serviceWorker', () => {
  let consoleLogSpy: MockInstance<typeof console.log>;
  let consoleErrorSpy: MockInstance<typeof console.error>;
  let registerMock: ReturnType<typeof vi.fn>;
  let readyPromise: Promise<MockRegistration>;
  let resolveReady: (registration: MockRegistration) => void;
  let rejectReady: (error: unknown) => void;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    capturedLoadCallback = undefined;
    addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'load') {
          capturedLoadCallback = listener as () => void;
        }
      });

    globalThis.location = {
      ...globalThis.location,
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      reload: vi.fn(),
    } as unknown as Location;

    readyPromise = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    registerMock = vi.fn();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        get ready() {
          return readyPromise;
        },
        controller: null,
      },
    });

    originalFetch = globalThis.fetch;
    fetchMock = vi.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    capturedLoadCallback = undefined;
    globalThis.fetch = originalFetch;
    // @ts-expect-error -- cleanup of a property defined only for these tests
    delete navigator.serviceWorker;
  });

  describe('register', () => {
    it('does nothing when the browser has no serviceWorker support', () => {
      // @ts-expect-error -- cleanup of a property defined only for these tests
      delete navigator.serviceWorker;

      register();
      triggerLoad();

      expect(registerMock).not.toHaveBeenCalled();
    });

    it('does not register when the public URL origin differs from the page origin', () => {
      globalThis.location = {
        ...globalThis.location,
        href: 'http://localhost:3000/',
        origin: 'http://example.com',
      } as unknown as Location;

      register();
      triggerLoad();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(registerMock).not.toHaveBeenCalled();
    });

    it('logs when the service worker becomes ready on localhost', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );

      register();
      triggerLoad();
      resolveReady(createMockRegistration());
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'This web app is being served cache-first by a service worker.',
      );
    });

    it('logs an error when waiting for readiness rejects', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );

      register();
      triggerLoad();
      rejectReady(new Error('ready failed'));
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error waiting for service worker readiness:',
        expect.any(Error),
      );
    });

    it('unregisters and reloads when the fetched service worker is missing (404)', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse(404, null));
      const registration = createMockRegistration();
      resolveReady(registration);

      register();
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(registration.unregister).toHaveBeenCalled();
      expect(globalThis.location.reload).toHaveBeenCalled();
    });

    it('unregisters and reloads when the fetched response is not javascript', async () => {
      fetchMock.mockResolvedValue(mockFetchResponse(200, 'text/html'));
      const registration = createMockRegistration();
      resolveReady(registration);

      register();
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(registration.unregister).toHaveBeenCalled();
      expect(globalThis.location.reload).toHaveBeenCalled();
    });

    it('registers the service worker when the fetched file is valid javascript', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );
      registerMock.mockResolvedValue(createMockRegistration());
      resolveReady(createMockRegistration());

      register();
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });

    it('logs offline mode when the validity fetch fails', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));
      resolveReady(createMockRegistration());

      register();
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'No internet connection found. App is running in offline mode.',
      );
    });

    it('calls onSuccess when content is cached for offline use with no controller', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );
      const registration = createMockRegistration();
      registerMock.mockResolvedValue(registration);
      resolveReady(createMockRegistration());
      const onSuccess = vi.fn();

      register({ onSuccess });
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      registration.onupdatefound?.();
      registration.installing = { state: 'installed', onstatechange: null };
      registration.onupdatefound?.();
      registration.installing.onstatechange?.();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Content is cached for offline use.',
      );
      expect(onSuccess).toHaveBeenCalledWith(registration);
    });

    it('calls onUpdate when new content is available with an existing controller', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );
      const registration = createMockRegistration();
      registerMock.mockResolvedValue(registration);
      resolveReady(createMockRegistration());
      const onUpdate = vi.fn();

      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          register: registerMock,
          get ready() {
            return readyPromise;
          },
          controller: {},
        },
      });

      register({ onUpdate });
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      registration.installing = { state: 'installed', onstatechange: null };
      registration.onupdatefound?.();
      registration.installing.onstatechange?.();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'New content is available and will be used when all tabs for this page are closed.',
      );
      expect(onUpdate).toHaveBeenCalledWith(registration);
    });

    it('calls onError and logs when registration fails', async () => {
      fetchMock.mockResolvedValue(
        mockFetchResponse(200, 'application/javascript'),
      );
      const registrationError = new Error('registration failed');
      registerMock.mockRejectedValue(registrationError);
      resolveReady(createMockRegistration());
      const onError = vi.fn();

      register({ onError });
      triggerLoad();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during service worker registration:',
        registrationError,
      );
      expect(onError).toHaveBeenCalledWith(registrationError);
    });
  });

  describe('unregister', () => {
    it('does nothing when the browser has no serviceWorker support', () => {
      // @ts-expect-error -- cleanup of a property defined only for these tests
      delete navigator.serviceWorker;

      expect(() => unregister()).not.toThrow();
    });

    it('unregisters the active service worker', async () => {
      const registration = createMockRegistration();
      resolveReady(registration);

      unregister();
      await Promise.resolve();
      await Promise.resolve();

      expect(registration.unregister).toHaveBeenCalled();
    });

    it('logs an error when the ready promise rejects', async () => {
      rejectReady(new Error('not ready'));

      unregister();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error unregistering service worker:',
        expect.any(Error),
      );
    });
  });
});
