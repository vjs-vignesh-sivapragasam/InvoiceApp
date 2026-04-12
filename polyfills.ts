/**
 * Global polyfills — must be imported before moti/framer-motion.
 *
 * framer-motion (bundled inside moti) calls:
 *   navigator.userAgent.toLowerCase()
 * at module initialization time (not just on render).
 * On React Native mobile, navigator.userAgent is undefined → TypeError.
 */
if (typeof navigator !== 'undefined' && !navigator.userAgent) {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'ReactNative',
    writable: true,
    configurable: true,
  });
}
