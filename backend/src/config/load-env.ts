import { config as loadDotenv } from 'dotenv';

/**
 * Loads `.env` into `process.env` as a side effect.
 *
 * Imported for its side effect at the very top of `main.ts`, before anything
 * reads configuration, so bootstrap settings (PORT, FRONTEND_ORIGIN, ...) and
 * Nest's `ConfigService` observe the same values. Values already present in the
 * real environment win, which is what deployment platforms rely on.
 */
loadDotenv();
