import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { API_PREFIX } from './api-prefix.js';

/** Default frontend origin used when `FRONTEND_ORIGIN` is not configured. */
export const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

/** Path (relative to the API prefix) where the Swagger UI is served. */
export const SWAGGER_PATH = 'docs';

export interface AppConfig {
  /** Comma-separated list of allowed browser origins. */
  frontendOrigin?: string;
  /** Enables the Swagger UI. Defaults to enabled outside production. */
  enableSwagger?: boolean;
  /** Reject plain-HTTP requests. Defaults to on when NODE_ENV=production. */
  enforceHttps?: boolean;
  /** Trust `X-Forwarded-*` headers from a platform load balancer. */
  trustProxy?: boolean;
}

/**
 * Middleware that redirects plain HTTP to HTTPS.
 *
 * Reads `X-Forwarded-Proto`, which every mainstream platform load balancer
 * sets, so it works when TLS terminates in front of the container. Health
 * checks and the ACME challenge path are exempt so a platform probe cannot be
 * bounced.
 */
export function httpsRedirectMiddleware() {
  return (
    req: { secure?: boolean; headers: Record<string, unknown>; url: string },
    res: { redirect: (status: number, url: string) => void },
    next: () => void,
  ): void => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : ((forwardedProto as string | undefined)?.split(',')[0] ?? '').trim();

    const isSecure = req.secure === true || proto === 'https';
    const isExempt =
      req.url.startsWith('/health') || req.url.startsWith('/.well-known/');

    if (isSecure || isExempt) {
      next();
      return;
    }

    const host = req.headers['host'];
    res.redirect(308, `https://${String(host)}${req.url}`);
  };
}

/** Parses the comma-separated `FRONTEND_ORIGIN` value into a list. */
export function parseAllowedOrigins(frontendOrigin?: string): string[] {
  return (frontendOrigin ?? DEFAULT_FRONTEND_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Applies the cross-cutting HTTP configuration — route prefix, request
 * validation, CORS, security headers and API documentation — shared by the
 * running server and the e2e tests, so tests exercise the same pipeline as the
 * application.
 *
 * Lives outside `main.ts` so it can be imported without triggering the
 * bootstrap listener as a side effect.
 */
export function configureApp(
  app: INestApplication,
  config: AppConfig = {},
): void {
  app.setGlobalPrefix(API_PREFIX, {
    // Deployment platforms probe /health directly, without the API prefix.
    exclude: ['health'],
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Without this, `req.secure` is always false behind a load balancer and the
  // HTTPS redirect would loop.
  if (config.trustProxy ?? isProduction) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  if (config.enforceHttps ?? isProduction) {
    app.use(httpsRedirectMiddleware());
  }

  // Secure response headers. HSTS is only meaningful over HTTPS, so it is
  // enabled exactly when HTTPS is enforced.
  app.use(
    helmet({
      hsts: (config.enforceHttps ?? isProduction)
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    }),
  );

  // Allow the browser frontend to call the API.
  app.enableCors({
    origin: parseAllowedOrigins(config.frontendOrigin),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Reject invalid request payloads before they reach controllers.
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties that have no validation decorators.
      whitelist: true,
      // Reject unknown properties instead of silently dropping them.
      forbidNonWhitelisted: true,
      // Apply declared types so DTOs receive numbers/booleans, not just strings.
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerEnabled =
    config.enableSwagger ??
    (process.env.ENABLE_SWAGGER !== undefined
      ? process.env.ENABLE_SWAGGER === 'true'
      : process.env.NODE_ENV !== 'production');

  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('E-Commerce API')
        .setDescription(
          'REST API for the e-commerce platform: authentication, catalog, cart, orders and payments.',
        )
        .setVersion('0.1.0')
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${API_PREFIX}/${SWAGGER_PATH}`, app, document, {
      jsonDocumentUrl: `${API_PREFIX}/${SWAGGER_PATH}-json`,
    });
  }
}
