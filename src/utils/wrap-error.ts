/**
 * Wrap a caught error.
 * This allows specifying a new error message to provide useful context.
 * The stack trace will show both the location of re-throw *and* the wrapped
 * error message and stack trace.
 */
export function wrapError(wrappedError: Error, newError: Error) {
  // It's impossible to extend an Error's `stack` property without eagerly
  // computing the stack trace via retrieval, so instead we use the
  // prototype chain to wrap it.
  // This ensures `instanceof Error === true` and all other properties
  // are inherited.
  return Object.create(newError, {
    stack: {
      // Must be a getter to avoid eagerly computing the stack trace, which is
      // expensive.
      get: () => {
        return newError.stack + '\nCaused by: ' + wrappedError.stack;
      },
    },
    wrapped: {
      value: wrappedError,
    },
  });
}
