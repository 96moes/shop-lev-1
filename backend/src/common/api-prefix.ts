/**
 * Path prefix applied to every backend route, matching the API URLs in the
 * specification (e.g. `GET /api/products`).
 *
 * Kept out of `main.ts` so tests and other modules can reference it without
 * importing the bootstrap file, which starts an HTTP listener as a side effect.
 */
export const API_PREFIX = 'api';
