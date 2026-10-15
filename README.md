# E-Commerce Platform

A full-stack e-commerce platform: a React single-page application backed by a NestJS REST API and a PostgreSQL database.

## Storefront Localisation

The customer-facing application is Persian (Farsi) and right-to-left, priced in
Iranian Rial, and themed in royal green.

| Aspect   | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Language | Persian (`fa-IR`); `<html lang="fa" dir="rtl">` sets the reading order  |
| Currency | Iranian Rial (`IRR`), shown with Persian digits and the ریال label      |
| Calendar | Jalali, via `Intl.DateTimeFormat('fa-IR-u-ca-persian')`                 |
| Theme    | Royal green brand ramp declared once as `--color-brand-*` in `frontend/src/index.css` |

Formatting lives in one module on each side of the API —
[`frontend/src/lib/format.ts`](frontend/src/lib/format.ts) and
[`backend/src/common/currency.ts`](backend/src/common/currency.ts) — so the
locale and currency are never re-specified at a call site. API error messages
returned to customers are written in Persian as well.

## Tech Stack

| Layer     | Technology                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React, Vite, React Router, TypeScript, Tailwind CSS, Axios, TanStack Query |
| Backend   | NestJS, TypeScript, TypeORM, JWT authentication, Swagger (OpenAPI)      |
| Database  | PostgreSQL                                                              |

## Project Structure

```
project/
├── frontend/          # React + Vite single-page application
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── routes/
│       ├── services/
│       ├── hooks/
│       └── main.tsx
│
├── backend/           # NestJS REST API
│   ├── src/
│   │   ├── modules/   # auth, users, products, categories, cart, orders, payments
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   └── migrations/
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│
└── README.md
```

## Architecture

```
Client (Browser)          NestJS API Server           PostgreSQL
React + Vite + Router --> (Auth, Products, Orders) --> Database
        HTTPS / REST
```

## Getting Started

### Prerequisites

- Node.js (LTS) and npm
- PostgreSQL (or Docker, see below)

### Backend

```
cd backend
npm ci
cp .env.example .env
# Set PostgreSQL credentials and strong JWT secrets in .env.
npm run migration:run
npm run start:dev
```

The API listens on `http://localhost:3000`. TypeORM migrations are the source
of truth for the schema; automatic schema synchronization is disabled.

### Frontend

```
cd frontend
npm ci
npm run dev
```

The application is served on `http://localhost:5173`.

## Environment Variables

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3000/api
```

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/shop
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
```

Payment credentials are optional and belong only in backend environment
variables. Stripe or PayPal verification returns an explicit unavailable error
when the corresponding provider is not configured; it never trusts a client
payment status. Set `DB_SSL=true` for managed PostgreSQL connections that
require TLS. `DATABASE_URL`, when used, takes precedence over the `DB_*` values.

## Database Schema

Main tables: `users`, `products`, `categories`, `product_images`, `carts`, `orders`, `order_items`, `payments`, `addresses`, `coupons`, `reviews`, `wishlists`.

## Frontend Routes

| Path            | Page             |
| --------------- | ---------------- |
| `/`             | Home             |
| `/products`     | Product listing  |
| `/products/:id` | Product details  |
| `/cart`         | Shopping cart    |
| `/checkout`     | Checkout         |
| `/login`        | Login            |
| `/register`     | Register         |
| `/profile`      | User profile     |
| `/orders`       | User orders      |
| `/admin`        | Admin dashboard  |

## API Endpoints

| Area          | Endpoints                                                                        |
| ------------- | -------------------------------------------------------------------------------- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/profile`, `PATCH /api/auth/profile` |
| Products      | `GET /api/products`, `GET /api/products/:id`, `POST /api/products` *(admin)*, `PUT /api/products/:id` *(admin)*, `DELETE /api/products/:id` *(admin)* |
| Categories    | `GET /api/categories`, `POST /api/categories` *(admin)*, `PUT /api/categories/:id` *(admin)*, `DELETE /api/categories/:id` *(admin)* |
| Cart          | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `DELETE /api/cart` |
| Orders        | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`                      |
| Payments      | `POST /api/payments/verify`, `GET /api/payments/order/:orderId`                    |
| Coupons       | `POST /api/coupons/validate`, `GET /api/coupons` *(admin)*, `POST /api/coupons` *(admin)*, `PUT /api/coupons/:id` *(admin)*, `DELETE /api/coupons/:id` *(admin)* |
| Reviews       | `GET /api/products/:productId/reviews`, `POST /api/products/:productId/reviews`, `GET /api/reviews/mine`, `PATCH /api/reviews/:id`, `DELETE /api/reviews/:id`, `PATCH /api/reviews/:id/approval` *(admin)* |
| Wishlist      | `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist/product/:productId`, `DELETE /api/wishlist/:id` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all` |
| Admin         | `GET /api/admin/stats`, `GET /api/admin/customers`, `GET /api/admin/products`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |
| Health        | `GET /health` (no `/api` prefix)                                                  |

## Security

- JWT access and refresh tokens
- Password hashing with bcrypt
- HTTPS enforced
- Helmet secure headers
- Rate limiting on API requests
- Input validation with class-validator
- CORS restricted to the frontend origin

## Payment Gateways

- Stripe
- PayPal
- Cash on Delivery (COD)

Payment rows are recorded in Iranian Rial (`IRR`); see the `RialCurrency`
migration in `backend/src/database/migrations/`. Stripe and PayPal remain
available for server configurations that support them, and report as
unconfigured when their credentials are absent.

## Panels

| Panel          | Access                                             |
| -------------- | -------------------------------------------------- |
| Admin Panel    | Full system management                             |
| Customer Panel | Orders, profile, wishlist                          |

## Key Features

- Product search and filtering
- Shopping cart
- Discount coupons
- Reviews and ratings
- Wishlists
- Notifications
- Admin reporting dashboard

## Docker

PostgreSQL, the API and the SPA run together via Compose. Credentials are not
hard-coded: copy the example file, fill it in, and Compose will refuse to start
if a required secret is missing rather than falling back to a development
default.

```
cp .env.docker.example .env.docker   # then edit it
docker compose --env-file .env.docker up --build
```

| Service    | URL                     | Notes                                             |
| ---------- | ----------------------- | ------------------------------------------------- |
| `frontend` | http://localhost:8080   | Nginx serving the SPA, proxying `/api` to backend  |
| `backend`  | http://localhost:3000   | Runs migrations, then starts the API              |
| `postgres` | internal only           | Not published to the host                         |

## Testing

Vitest is used on both sides (the Nest 12 scaffold ships Vitest, and it shares
the Vite toolchain the frontend already uses).

| Layer             | Tools                                  | Command              |
| ----------------- | -------------------------------------- | -------------------- |
| Frontend unit     | Vitest, React Testing Library, jsdom   | `npm test` (frontend) |
| Backend unit      | Vitest                                 | `npm test` (backend)  |
| Backend API / e2e | Vitest, Supertest, real PostgreSQL     | `npm run test:e2e` (backend) |
| Browser end-to-end | Playwright (Chromium)                  | `npm run test:e2e` (frontend) |

The backend e2e suites create their schema by running the migrations, so they
also verify that migrations apply cleanly. They need a reachable PostgreSQL and
clean up the rows they create. The admin order workflow permits only pending
order cancellation and forward fulfillment transitions (paid → processing →
shipped → delivered); it does not mark unpaid orders paid or claim to issue
refunds.

The CI workflow runs backend API tests against PostgreSQL, frontend unit tests,
and Playwright Chromium browser tests for public/customer/admin route access.
For a local browser run, install Chromium once with `npx playwright install chromium`,
then run `npm run test:e2e` from `frontend`.

## Deployment

| Piece     | Target                                                       |
| --------- | ------------------------------------------------------------ |
| Frontend  | Vercel / Netlify / Nginx (static bundle, `VITE_API_URL` at build time) |
| Backend   | Docker + Node.js server / AWS ECS (`backend/Dockerfile`)      |
| Database  | Managed PostgreSQL — AWS RDS, Supabase, etc.                  |
| CI/CD     | GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) |

### Production configuration

Use `backend/.env.production.example` as a checklist and set values through the
deployment platform's secret store — never commit production credentials:

- `DATABASE_URL` (or the `DB_*` variables) for the managed database. Enable
  `DB_SSL=true` when required; certificate validation remains enabled by default.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — generate each with `openssl rand -base64 48`.
- `FRONTEND_ORIGIN` — the exact production origin(s); a wildcard is not used.
- `STRIPE_SECRET_KEY` and/or PayPal credentials only for the payment methods
  enabled in the storefront.

Build the frontend with its public API URL in `VITE_API_URL`. For the Docker
Compose deployment, the Nginx proxy provides a same-origin `/api` route by
default. The backend container applies pending TypeORM migrations before
starting. For other hosting targets, apply `npm run migration:run` as a release
step before sending traffic to the new application version.

### HTTPS

With `NODE_ENV=production` the API **redirects plain HTTP to HTTPS** (trusting
`X-Forwarded-Proto` from a load balancer) and enables HSTS. `/health` and
`/.well-known/*` are exempt so platform probes are not bounced. Terminate TLS at
the load balancer or reverse proxy and forward `X-Forwarded-Proto`.

`GET /health` reports database connectivity and is deliberately excluded from
the `/api` prefix, so platforms can probe it directly.

Swagger is disabled automatically in production; set `ENABLE_SWAGGER=true` only
if you intend to expose it.

## Implementation Plan

The build is split into three parts:

1. Foundation — [implementation-part-1-foundation.md](./implementation-part-1-foundation.md)
2. Core commerce — [implementation-part-2-core-commerce.md](./implementation-part-2-core-commerce.md)
3. Admin and release — [implementation-part-3-admin-and-release.md](./implementation-part-3-admin-and-release.md)
