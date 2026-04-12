/**
 * App entry point — polyfills must run BEFORE expo-router loads any modules.
 *
 * Problem: moti bundles framer-motion, which calls
 *   navigator.userAgent.toLowerCase()
 * at module initialization time. On React Native mobile, navigator.userAgent
 * is undefined, which throws: TypeError: Cannot read property 'toLowerCase' of undefined.
 *
 * This polyfill runs synchronously before any other module is evaluated.
 */
if (typeof navigator !== 'undefined' && !navigator.userAgent) {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'ReactNative',
    writable: true,
    configurable: true,
  });
}

import 'expo-router/entry';
