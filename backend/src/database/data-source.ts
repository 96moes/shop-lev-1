import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source-options.js';

// The TypeORM CLI runs outside Nest, so the environment is loaded here.
loadEnv();

/** DataSource used by the TypeORM CLI (`migration:generate`, `migration:run`). */
export default new DataSource(buildDataSourceOptions());
