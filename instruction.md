```markdown
# E-Commerce Full-Stack Technical Specification

## 1. Project Overview

| Item         | Description                 |
| ------------ | --------------------------- |
| Project Type | E-Commerce Platform         |
| Architecture | Full-Stack (SPA + REST API) |
| Language     | English (LTR)               |
| Currency     | USD                         |

---

## 2. Tech Stack

### Frontend

- React (latest)
- Vite (latest)
- React Router (latest)
- TypeScript (latest)
- Tailwind CSS (latest)
- Axios (latest)
- TanStack Query (latest)

### Backend

- NestJS (latest)
- TypeScript (latest)
- Prisma ORM (latest)
- JWT Authentication
- Swagger (OpenAPI)

### Database

- PostgreSQL (latest)

---

## 3. Architecture
```

┌─────────────────────────────────────────────┐
│ Client (Browser) │
│ React + Vite + React Router │
└──────────────────┬──────────────────────────┘
│ HTTPS / REST
┌──────────────────▼──────────────────────────┐
│ NestJS API Server │
│ (Auth, Products, Orders, etc.) │
└──────────────────┬──────────────────────────┘
│
┌──────────────────▼──────────────────────────┐
│ PostgreSQL │
└─────────────────────────────────────────────┘

```

---

## 4. Project Structure

```

project/
├── frontend/ # React + Vite
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── routes/
│ │ ├── services/
│ │ ├── hooks/
│ │ └── main.tsx
│ ├── index.html
│ ├── vite.config.ts
│ └── package.json
│
├── backend/ # NestJS
│ ├── src/
│ │ ├── modules/
│ │ │ ├── auth/
│ │ │ ├── users/
│ │ │ ├── products/
│ │ │ ├── categories/
│ │ │ ├── cart/
│ │ │ ├── orders/
│ │ │ └── payments/
│ │ ├── common/
│ │ ├── app.module.ts
│ │ └── main.ts
│ ├── prisma/
│ │ └── schema.prisma
│ └── package.json
│
└── README.md

```

---

## 5. Database Schema (Main Tables)

| Table | Description |
|-------|-------------|
| users | User accounts (admin, customer) |
| products | Product catalog |
| categories | Product categories |
| product_images | Product images |
| carts | Shopping carts |
| orders | Customer orders |
| order_items | Order line items |
| payments | Payment transactions |
| addresses | Shipping addresses |
| coupons | Discount codes |
| reviews | Product reviews and ratings |
| wishlists | User wishlists |

---

## 6. Frontend Routes (React Router)

| Path | Page |
|------|------|
| / | Home |
| /products | Product listing |
| /products/:id | Product details |
| /cart | Shopping cart |
| /checkout | Checkout |
| /login | Login |
| /register | Register |
| /profile | User profile |
| /orders | User orders |
| /admin | Admin dashboard |

---

## 7. API Endpoints

### Authentication
```

POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile

```

### Products
```

GET /api/products
GET /api/products/:id
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

```

### Categories
```

GET /api/categories

```

### Cart
```

GET /api/cart
POST /api/cart/items
DELETE /api/cart/items/:id

```

### Orders
```

POST /api/orders
GET /api/orders
GET /api/orders/:id

```

### Payments
```

POST /api/payments/verify

```

---

## 8. Authentication & Security

- JWT (Access + Refresh Token)
- Password hashing with bcrypt
- HTTPS enforced
- Helmet for secure headers
- Rate limiting on API requests
- Input validation with class-validator
- CORS configured for frontend origin

---

## 9. Payment Gateways

- Stripe
- PayPal
- Cash on Delivery (COD)

---

## 10. Admin Panels

| Panel | Access |
|-------|--------|
| Admin Panel | Full system management |
| Customer Panel | Orders, profile, wishlist |

---

## 11. Key Features

- Product search and filtering
- Shopping cart
- Discount coupons
- Reviews and ratings
- Wishlists
- Notifications
- Admin reporting dashboard

---

## 12. Environment Variables

### Frontend (.env)
```

VITE_API_URL=http://localhost:3000/api

```

### Backend (.env)
```

DATABASE_URL=postgresql://user:pass@localhost:5432/shop
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000

```

---

## 13. Running the Project

### Frontend
```

cd frontend
npm install
npm run dev

```

### Backend
```

cd backend
npm install
npx prisma migrate dev
npm run start:dev

````

---

## 14. Docker (Optional)

```yaml
services:
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: shop
    ports:
      - "5432:5432"
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
````

---

## 15. Testing

| Layer    | Tools                       |
| -------- | --------------------------- |
| Frontend | Jest, React Testing Library |
| Backend  | Jest, Supertest             |
| E2E      | Playwright                  |

---

## 16. Deployment

- Frontend: Vercel / Netlify / Nginx
- Backend: Docker + Node.js server / AWS ECS
- Database: Managed PostgreSQL (AWS RDS, Supabase, etc.)
- CI/CD: GitHub Actions

---

_End of Specification_

```

```
