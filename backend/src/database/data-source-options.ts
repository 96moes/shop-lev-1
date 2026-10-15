import type { DataSourceOptions } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { ProductImage } from './entities/product-image.entity.js';
import { User } from './entities/user.entity.js';
import { Cart } from './entities/cart.entity.js';
import { CartItem } from './entities/cart-item.entity.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Payment } from './entities/payment.entity.js';
import { Address } from './entities/address.entity.js';
import { Coupon } from './entities/coupon.entity.js';
import { Review } from './entities/review.entity.js';
import { Wishlist } from './entities/wishlist.entity.js';
import { Notification } from './entities/notification.entity.js';

/**
 * Complete entity list. Kept explicit (rather than a glob) so the same set is
 * used by the Nest application and the TypeORM CLI, with no path resolution
 * differences between `dist` and source.
 */
export const entities = [
  User,
  Category,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Address,
  Coupon,
  Review,
  Wishlist,
  Notification,
];

/**
 * Migrations glob.
 *
 * The TypeORM CLI is run through `tsx` against the TypeScript sources, while the
 * compiled application runs from `dist`. Detect which is active so the same
 * options object serves both. `tsconfig.build.json` sets `rootDir: "./src"`, so
 * compiled output mirrors `src/` directly under `dist/`.
 */
const migrationGlob = import.meta.filename.endsWith('.ts')
  ? ['src/database/migrations/*.ts']
  : ['dist/database/migrations/*.js'];

/** The PostgreSQL member of TypeORM's exported options union. */
type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

/**
 * Resolves the PostgreSQL connection.
 *
 * `DATABASE_URL` takes precedence when set (as production platforms provide it);
 * otherwise the individual `DB_*` variables are used, defaulting to a local
 * development database. Credentials are never hard-coded here.
 */
function buildConnectionOptions(env: NodeJS.ProcessEnv): PostgresOptions {
  const ssl =
    env.DB_SSL === 'true'
      ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined;

  if (env.DATABASE_URL) {
    return { type: 'postgres', url: env.DATABASE_URL, ssl };
  }

  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? '',
    database: env.DB_DATABASE ?? 'shop',
    ssl,
  };
}

/**
 * Builds the PostgreSQL connection options from the environment.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    ...buildConnectionOptions(env),
    entities,
    // Schema changes are applied through migrations only — never auto-sync.
    synchronize: false,
    migrationsRun: false,
    migrations: migrationGlob,
    logging: env.DB_LOGGING === 'true',
  };
}
