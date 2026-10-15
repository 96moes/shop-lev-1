# Implementation Part 3: Admin, Payments, and Release

This phase completes the additional shopping features, administration tools, verification, and deployment preparation.

## 1. Payments

Implement the payment verification endpoint:

```text
POST /api/payments/verify
```

Record payment transactions in the `payments` table. Keep payment secrets in backend environment variables and verify payment results on the server.

## 2. Coupons and additional customer features

Implement the remaining key features using the existing schema:

- Discount coupons (`coupons`)
- Product reviews and ratings (`reviews`)
- Customer wishlists (`wishlists`)
- Notifications

Validate coupon eligibility and ensure customers can manage only their own reviews and wishlists.

## 3. Admin and customer panels

Build the `/admin` dashboard and enforce admin-only access. Provide full system management as specified, including the product catalog, order fulfillment controls, coupons, customer list, and reporting dashboard.

Complete the customer panel with access to:

- Orders
- Profile
- Wishlist

## 4. Testing

Add tests at each layer:

| Layer | Tools |
| --- | --- |
| Frontend | Jest, React Testing Library |
| Backend | Jest, Supertest |
| End-to-end | Playwright |

Cover authentication and authorization, catalog behavior, cart and order flows, and payment verification. Run the relevant tests before deployment.

## 5. Optional Docker setup

Use Docker Compose to run PostgreSQL, the backend, and the frontend together. The original specification includes a sample configuration; ensure database credentials are supplied safely for the target environment rather than relying on development defaults.

## 6. Deployment

- **Frontend:** Vercel, Netlify, or Nginx
- **Backend:** Docker with a Node.js server or AWS ECS
- **Database:** Managed PostgreSQL, such as AWS RDS or Supabase
- **CI/CD:** GitHub Actions

Enforce HTTPS in deployed environments and configure production CORS origins, database credentials, and JWT secrets through the deployment platform.

## Completion checklist

- [x] Payment verification supports configured methods and verifies provider results server-side.
- [x] Coupons, reviews, wishlists, notifications, and admin reporting are implemented.
- [x] Admin and customer panels enforce the intended access boundaries.
- [x] Admin catalog supports paginated inventory and price management; inactive products are excluded from public catalog and detail endpoints.
- [x] Admin order management validates fulfillment transitions and restores stock transactionally when cancelling pending orders.
- [x] Frontend, backend, and Playwright browser tests are configured; backend API tests run through Supertest.
- [x] Production environment variables, HTTPS, database TLS, Docker deployment, and CI configuration are ready.
- [x] Run the backend API test suites against PostgreSQL.

The application uses Vitest rather than Jest, and the backend API tests use
Supertest. This reflects the repository's installed toolchain. Run `npm test`,
`npm run lint`, and `npm run build` from each application directory before
deployment.
