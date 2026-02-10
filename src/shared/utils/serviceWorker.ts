/**
 * Service Worker registration utility
 */

type ServiceWorkerConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
  ),
);

export function register(config?: ServiceWorkerConfig): void {
  if ('serviceWorker' in navigator) {
    // Get the base URL for the service worker
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);

    // Don't register if service worker URL is on a different origin
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        // Running on localhost - check if service worker still exists
        checkValidServiceWorker(swUrl, config);

        navigator.serviceWorker.ready.then(() => {
          if (import.meta.env.DEV) {
            console.log(
              'This web app is being served cache-first by a service worker.',
            );
          }
        });
      } else {
        // Not localhost - just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          handleInstallingWorkerStateChange(
            installingWorker,
            registration,
            config,
          );
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

function handleInstallingWorkerStateChange(
  installingWorker: ServiceWorker,
  registration: ServiceWorkerRegistration,
  config?: ServiceWorkerConfig,
): void {
  if (installingWorker.state !== 'installed') {
    return;
  }

  if (navigator.serviceWorker.controller) {
    // New content is available; please refresh
    if (import.meta.env.DEV) {
      console.log(
        'New content is available and will be used when all tabs for this page are closed.',
      );
    }

    if (config && config.onUpdate) {
      config.onUpdate(registration);
    }
  } else {
    // Content is cached for offline use
    if (import.meta.env.DEV) {
      console.log('Content is cached for offline use.');
    }

    if (config && config.onSuccess) {
      config.onSuccess(registration);
    }
  }
}

function checkValidServiceWorker(
  swUrl: string,
  config?: ServiceWorkerConfig,
): void {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists and that we got a JS file
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found - probably a different app
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found - proceed as normal
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      if (import.meta.env.DEV) {
        console.log(
          'No internet connection found. App is running in offline mode.',
        );
      }
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
