import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { Category } from '../src/database/entities/category.entity.js';
import { Product } from '../src/database/entities/product.entity.js';
import { User, UserRole } from '../src/database/entities/user.entity.js';

interface AuthBody {
  user: { id: string; email: string; role: string; password?: string };
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

/**
 * End-to-end coverage of the core commerce flow.
 *
 * Uses the real database (all entities are exercised) with a fresh schema
 * created by running the migrations, so the tests also verify the migrations.
 */
describe('Core commerce (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let server: App;
  let customerToken: string;
  let adminToken: string;
  let productId: string;
  let productSlug: string;
  let productName: string;

  const customer = {
    email: `e2e-customer-${randomUUID()}@shop.test`,
    password: 'CustomerPass123!',
    firstName: 'Grace',
    lastName: 'Hopper',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    // The schema is created by the migrations rather than synchronize, so the
    // migration files themselves are covered by this suite.
    await dataSource.runMigrations();
    server = app.getHttpServer();
  }, 60_000);

  afterAll(async () => {
    // Remove everything this run created so repeated runs do not accumulate
    // rows in a shared development database.
    if (dataSource?.isInitialized) {
      await dataSource
        .getRepository(Product)
        .createQueryBuilder()
        .delete()
        .where('slug LIKE :slug', { slug: 'e2e-%' })
        .execute();

      await dataSource
        .getRepository(User)
        .createQueryBuilder()
        .delete()
        .where('email LIKE :email', { email: 'e2e-%@shop.test' })
        .execute();

      await dataSource
        .getRepository(Category)
        .createQueryBuilder()
        .delete()
        .where('slug LIKE :slug', { slug: 'e2e-%' })
        .execute();
    }

    await app?.close();
  });

  /** Seeds an admin directly: role cannot be set through the public API. */
  async function seedAdmin(): Promise<string> {
    const repo = dataSource.getRepository(User);
    const email = `e2e-admin-${randomUUID()}@shop.test`;
    const bcrypt = await import('bcrypt');
    await repo.save(
      repo.create({
        email,
        password: await bcrypt.hash('AdminPass123!', 12),
        firstName: 'Site',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      }),
    );

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'AdminPass123!' })
      .expect(200);

    return (login.body as AuthBody).tokens.accessToken;
  }

  describe('authentication', () => {
    it('registers a customer and returns a token pair', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send(customer)
        .expect(201);

      const body = response.body as AuthBody;
      expect(body.tokens.accessToken).toEqual(expect.any(String));
      expect(body.tokens.refreshToken).toEqual(expect.any(String));
      expect(body.user.role).toBe('customer');
      // The password hash must never leave the API.
      expect(body.user.password).toBeUndefined();

      customerToken = body.tokens.accessToken;
    });

    it('rejects a duplicate email', async () => {
      await request(server).post('/api/auth/register').send(customer).expect(409);
    });

    it('rejects an invalid registration payload', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({ email: 'nope', password: 'x', firstName: '', lastName: '' })
        .expect(400);
    });

    it('rejects a wrong password', async () => {
      await request(server)
        .post('/api/auth/login')
        .send({ email: customer.email, password: 'wrong-password' })
        .expect(401);
    });

    it('signs in with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: customer.email, password: customer.password })
        .expect(200);

      customerToken = (response.body as AuthBody).tokens.accessToken;
    });

    it('requires a token for the profile endpoint', async () => {
      await request(server).get('/api/auth/profile').expect(401);
    });

    it('returns the profile for an authenticated caller', async () => {
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({ email: customer.email, role: 'customer' });
    });

    it('updates the profile', async () => {
      const response = await request(server)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ phone: '+1 555 0199' })
        .expect(200);

      expect(response.body).toMatchObject({ phone: '+1 555 0199' });
    });
  });

  describe('catalog', () => {
    beforeAll(async () => {
      // Seeded here so every catalog test has an admin token available.
      adminToken = await seedAdmin();

      const categories = dataSource.getRepository(Category);
      const category = await categories.save(
        categories.create({ name: 'E2E Lighting', slug: `e2e-lighting-${randomUUID()}` }),
      );

      const products = dataSource.getRepository(Product);
      // Unique per run so leftover rows from an earlier run cannot match the
      // search assertion below. High stock keeps this suite from exhausting the
      // shared development catalog, and it is deleted again in `afterAll`.
      productName = `E2E Test Lamp ${randomUUID().slice(0, 8)}`;
      productSlug = `e2e-lamp-${randomUUID()}`;
      const product = await products.save(
        products.create({
          name: productName,
          slug: productSlug,
          description: 'A lamp for testing',
          price: '25.50',
          stock: 500,
          isActive: true,
          categoryId: category.id,
        }),
      );
      productId = product.id;
    });

    it('lists products publicly with pagination metadata', async () => {
      const response = await request(server).get('/api/products').expect(200);
      expect(response.body).toMatchObject({
        total: expect.any(Number),
        page: 1,
        items: expect.any(Array),
      });
    });

    it('filters by search term', async () => {
      const response = await request(server)
        .get(`/api/products?search=${encodeURIComponent(productName)}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].id).toBe(productId);
    });

    it('filters by price range', async () => {
      const response = await request(server)
        .get('/api/products?minPrice=25&maxPrice=26')
        .expect(200);

      expect(
        response.body.items.every(
          (p: { price: string }) => Number(p.price) >= 25 && Number(p.price) <= 26,
        ),
      ).toBe(true);
    });

    it('returns a single product', async () => {
      const response = await request(server)
        .get(`/api/products/${productId}`)
        .expect(200);
      expect(response.body.slug).toBe(productSlug);
    });

    it('404s for an unknown product', async () => {
      await request(server).get(`/api/products/${randomUUID()}`).expect(404);
    });

    it('rejects an anonymous product create', async () => {
      await request(server)
        .post('/api/products')
        .send({ name: 'Nope', price: 1 })
        .expect(401);
    });

    it('rejects a customer product create', async () => {
      await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Nope', price: 1 })
        .expect(403);
    });

    it('rejects a product with an invalid payload', async () => {
      await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X', price: -1, unexpected: true })
        .expect(400);
    });

    it('lets an admin create, update and delete a product', async () => {
      const created = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Created', price: 10, stock: 4 })
        .expect(201);

      const id = created.body.id as string;

      const updated = await request(server)
        .put(`/api/products/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 12.5 })
        .expect(200);
      expect(Number(updated.body.price)).toBe(12.5);

      await request(server)
        .delete(`/api/products/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('lists categories publicly', async () => {
      const response = await request(server).get('/api/categories').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('cart', () => {
    it('requires authentication', async () => {
      await request(server).get('/api/cart').expect(401);
    });

    it('starts empty', async () => {
      const response = await request(server)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(response.body.itemCount).toBe(0);
    });

    it('adds an item and computes the subtotal', async () => {
      const response = await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 2 })
        .expect(201);

      expect(response.body.itemCount).toBe(2);
      expect(response.body.subtotal).toBeCloseTo(51, 2);
    });

    it('rejects a quantity above stock', async () => {
      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 999 })
        .expect(400);
    });

    it('rejects an unknown product', async () => {
      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: randomUUID(), quantity: 1 })
        .expect(404);
    });

    it('updates and then removes the item', async () => {
      const cart = await request(server)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      const itemId = cart.body.items[0].id as string;

      const patched = await request(server)
        .patch(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 1 })
        .expect(200);
      expect(patched.body.itemCount).toBe(1);

      const removed = await request(server)
        .delete(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(removed.body.itemCount).toBe(0);
    });
  });

  describe('orders', () => {
    const shippingAddress = {
      fullName: 'Grace Hopper',
      line1: '1 Navy Way',
      city: 'Arlington',
      postalCode: '22201',
      country: 'US',
    };

    it('rejects checkout with an empty cart', async () => {
      await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shippingAddress })
        .expect(400);
    });

    it('places an order, snapshots the address and clears the cart', async () => {
      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 3 })
        .expect(201);

      const before = await request(server).get(`/api/products/${productId}`).expect(200);
      const stockBefore = before.body.stock as number;

      const response = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shippingAddress, notes: 'e2e order' })
        .expect(201);

      expect(response.body.orderNumber).toMatch(/^ORD-/);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.shippingCity).toBe('Arlington');
      // 25.50 * 3
      expect(Number(response.body.subtotal)).toBeCloseTo(76.5, 2);
      expect(Number(response.body.total)).toBeCloseTo(76.5, 2);

      const after = await request(server).get(`/api/products/${productId}`).expect(200);
      expect(after.body.stock).toBe(stockBefore - 3);

      const cart = await request(server)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(cart.body.itemCount).toBe(0);
    });

    it('lists the order for its owner and returns its detail', async () => {
      const list = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(list.body.length).toBeGreaterThan(0);
      const orderId = list.body[0].id as string;

      const detail = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(detail.body.id).toBe(orderId);
    });

    it('hides another customer order from a different account', async () => {
      const other = {
        email: `e2e-other-${randomUUID()}@shop.test`,
        password: 'OtherPass123!',
        firstName: 'Other',
        lastName: 'Buyer',
      };
      const registered = await request(server)
        .post('/api/auth/register')
        .send(other)
        .expect(201);
      const otherToken = (registered.body as AuthBody).tokens.accessToken;

      const ownOrders = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      expect(ownOrders.body).toHaveLength(0);

      const first = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      const orderId = first.body[0].id as string;

      // Scoped lookup means another account sees it as missing, not forbidden.
      await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('requires authentication', async () => {
      await request(server).get('/api/orders').expect(401);
      await request(server).post('/api/orders').send({ shippingAddress }).expect(401);
    });
  });

  describe('token rotation', () => {
    it('refuses to redeem a refresh token twice', async () => {
      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: customer.email, password: customer.password })
        .expect(200);
      const refreshToken = (login.body as AuthBody).tokens.refreshToken;

      await request(server).post('/api/auth/refresh').send({ refreshToken }).expect(200);
      // The token was rotated, so replaying it must fail.
      await request(server).post('/api/auth/refresh').send({ refreshToken }).expect(401);
    });

    it('revokes the refresh token on logout', async () => {
      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: customer.email, password: customer.password })
        .expect(200);
      const body = login.body as AuthBody;

      await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${body.tokens.accessToken}`)
        .expect(204);

      await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: body.tokens.refreshToken })
        .expect(401);
    });
  });
});
