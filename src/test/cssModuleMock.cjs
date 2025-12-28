// CSS Module mock that returns strings for all property access
// Works around issues with identity-obj-proxy and ESM/React 19

// Create a proxy that returns strings for class names, but returns itself for 'default'
// This handles both ESM imports (which access .default first) and CSS classes named 'default'
const handler = {
  get: function (target, prop) {
    // Handle Symbol.toPrimitive - this is called when the proxy needs to be converted
    // to a primitive value (e.g., in array.join() or string concatenation)
    if (prop === Symbol.toPrimitive) {
      return () => 'default';
    }
    // Return undefined for other symbols
    if (typeof prop === 'symbol') {
      return undefined;
    }
    // For ESM compatibility: when accessing .default, return the proxy itself
    // so that styles.default.className works (ESM import pattern)
    if (prop === 'default' || prop === '__esModule') {
      return prop === '__esModule' ? true : proxy;
    }
    // Return the property name as a string for CSS class access
    return String(prop);
  },
};

const proxy = new Proxy({}, handler);

// Export for CommonJS
module.exports = proxy;
