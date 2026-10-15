import './config/load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './common/configure-app.js';

/**
 * Reads a positive integer setting, failing fast on a malformed value rather
 * than silently binding to a surprising port.
 */
function readPort(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${value}"`);
  }

  return port;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app, { frontendOrigin: process.env.FRONTEND_ORIGIN });
  await app.listen(readPort(process.env.PORT, 3000));
}
await bootstrap();
