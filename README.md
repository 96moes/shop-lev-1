# E-Commerce Platform

A full-stack e-commerce platform: a React single-page application backed by a NestJS REST API and a PostgreSQL database.

## Tech Stack

| Layer     | Technology                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React, Vite, React Router, TypeScript, Tailwind CSS, Axios, TanStack Query |
| Backend   | NestJS, TypeScript, Prisma ORM, JWT authentication, Swagger (OpenAPI)   |
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
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma
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
npm install
npx prisma migrate dev
npm run start:dev
```

The API listens on `http://localhost:3000`.

### Frontend

```
cd frontend
npm install
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
| Admin         | `GET /api/admin/stats`, `GET /api/admin/customers`                                 |
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
| End-to-end        | Playwright (browser)                   | see note below        |

The backend e2e suites create their schema by running the migrations, so they
also verify that migrations apply cleanly. They need a reachable PostgreSQL and
clean up the rows they create.

> **Note on Playwright:** its browser CDN is unavailable in some regions. The
> end-to-end checks in this project were run against the locally installed
> Chrome (`channel: 'chrome'`) via `playwright-core`.

## Deployment

| Piece     | Target                                                       |
| --------- | ------------------------------------------------------------ |
| Frontend  | Vercel / Netlify / Nginx (static bundle, `VITE_API_URL` at build time) |
| Backend   | Docker + Node.js server / AWS ECS (`backend/Dockerfile`)      |
| Database  | Managed PostgreSQL — AWS RDS, Supabase, etc.                  |
| CI/CD     | GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) |

### Production configuration

Copy `backend/.env.production.example` and supply values through the platform's
secret store — never commit them:

- `DATABASE_URL` (or the `DB_*` variables) for the managed database.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — generate each with `openssl rand -base64 48`.
- `FRONTEND_ORIGIN` — the exact production origin(s); a wildcard is not used.

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
