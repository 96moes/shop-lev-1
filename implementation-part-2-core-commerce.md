# Implementation Part 2: Core Commerce

This phase implements customer accounts and the essential shopping journey on top of the foundation in Part 1.

## 1. Authentication and user accounts

Implement these endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

- Hash passwords with bcrypt.
- Issue JWT access and refresh tokens.
- Protect authenticated endpoints and provide a way to retrieve the current profile.
- Add rate limiting to API requests.
- Support the customer and admin account roles described in the specification.

## 2. Product catalog and categories

Implement the catalog endpoints:

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/categories
```

Support product search and filtering. Restrict product creation, updates, and deletion to authorized administrators.

Build the corresponding frontend pages:

- `/` — home
- `/products` — product listing, search, and filtering
- `/products/:id` — product details

## 3. Cart

Implement the cart endpoints:

```text
GET    /api/cart
POST   /api/cart/items
DELETE /api/cart/items/:id
```

Associate carts with the appropriate customer and validate requested product and quantity data. Build the `/cart` page and connect it to these endpoints.

## 4. Orders and checkout

Implement the order endpoints:

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

Build the `/checkout` and `/orders` pages. Ensure customers can access only their own orders, and persist order line items using the `orders` and `order_items` tables.

## 5. Customer account pages

Build the remaining account routes:

- `/login` — sign in
- `/register` — create an account
- `/profile` — view and manage the customer profile

Use the shared API client and TanStack Query for server communication and data caching.

## Completion checklist

- [ ] Customers can register, sign in, and view their profile.
- [ ] Product listing and details load from the API, including search and filtering.
- [ ] Customers can add items to and remove items from their cart.
- [ ] Customers can submit orders and view their own order history and details.
- [ ] Protected API routes enforce authentication and role/ownership checks.
