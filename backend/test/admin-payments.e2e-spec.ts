import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/configure-app.js';
import { Category } from '../src/database/entities/category.entity.js';
import { Coupon, DiscountType } from '../src/database/entities/coupon.entity.js';
import { Order } from '../src/database/entities/order.entity.js';
import { Product } from '../src/database/entities/product.entity.js';
import { User, UserRole } from '../src/database/entities/user.entity.js';

interface AuthBody {
  user: { id: string; email: string };
  tokens: { accessToken: string; refreshToken: string };
}

/**
 * End-to-end coverage for Part 3: payments, coupons, reviews, wishlist,
 * notifications and the admin reporting endpoints.
 */
describe('Admin, payments and release features (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let server: App;

  let customerToken: string;
  let otherToken: string;
  let adminToken: string;

  let productId: string;
  let secondProductId: string;

  const customerEmail = `p3-customer-${randomUUID()}@shop.test`;
  const customerPassword = 'Part3Pass123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    server = app.getHttpServer();

    // --- customer + admin ---
    const registered = await request(server)
      .post('/api/auth/register')
      .send({
        email: customerEmail,
        password: customerPassword,
        firstName: 'Ada',
        lastName: 'Lovelace',
      })
      .expect(201);
    const body = registered.body as AuthBody;
    customerToken = body.tokens.accessToken;

    const other = await request(server)
      .post('/api/auth/register')
      .send({
        email: `p3-other-${randomUUID()}@shop.test`,
        password: customerPassword,
        firstName: 'Other',
        lastName: 'Buyer',
      })
      .expect(201);
    otherToken = (other.body as AuthBody).tokens.accessToken;

    const bcrypt = await import('bcrypt');
    const users = dataSource.getRepository(User);
    await users.save(
      users.create({
        email: `p3-admin-${randomUUID()}@shop.test`,
        password: await bcrypt.hash('AdminPass123!', 12),
        firstName: 'Site',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      }),
    );
    const adminLogin = await request(server)
      .post('/api/auth/login')
      .send({ email: 'admin@shop.test', password: 'AdminPass123!' })
      .expect(200);
    adminToken = (adminLogin.body as AuthBody).tokens.accessToken;

    // --- catalog fixtures (unique per run, removed in afterAll) ---
    const categories = dataSource.getRepository(Category);
    const category = await categories.save(
      categories.create({ name: 'P3 Test', slug: `p3-cat-${randomUUID()}` }),
    );
    const products = dataSource.getRepository(Product);
    const [a, b] = await products.save([
      products.create({
        name: `P3 Lamp ${randomUUID().slice(0, 8)}`,
        slug: `p3-lamp-${randomUUID()}`,
        price: '40.00',
        stock: 100,
        isActive: true,
        categoryId: category.id,
      }),
      products.create({
        name: `P3 Chair ${randomUUID().slice(0, 8)}`,
        slug: `p3-chair-${randomUUID()}`,
        price: '60.00',
        stock: 100,
        isActive: true,
        categoryId: category.id,
      }),
    ]);
    productId = a.id;
    secondProductId = b.id;
  }, 60_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource
        .getRepository(Product)
        .createQueryBuilder()
        .delete()
        .where('slug LIKE :slug', { slug: 'p3-%' })
        .execute();
      await dataSource
        .getRepository(Category)
        .createQueryBuilder()
        .delete()
        .where('slug LIKE :slug', { slug: 'p3-%' })
        .execute();
      await dataSource
        .getRepository(Coupon)
        .createQueryBuilder()
        .delete()
        .where('code LIKE :code', { code: 'P3%' })
        .execute();
      await dataSource
        .getRepository(User)
        .createQueryBuilder()
        .delete()
        .where('email LIKE :email', { email: 'p3-%@shop.test' })
        .execute();
    }
    await app?.close();
  });

  describe('coupons', () => {
    let couponId: string;
    const code = `P3SAVE${randomUUID().slice(0, 6).toUpperCase()}`;

    it('lets an admin create a coupon', async () => {
      const response = await request(server)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          minOrderAmount: 50,
          maxDiscountAmount: 20,
        })
        .expect(201);

      couponId = response.body.id as string;
      expect(response.body.code).toBe(code);
    });

    it('rejects a duplicate code', async () => {
      await request(server)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code, discountType: DiscountType.FIXED, discountValue: 1 })
        .expect(409);
    });

    it('forbids customers from managing coupons', async () => {
      await request(server)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
      await request(server)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'P3NOPE', discountType: DiscountType.FIXED, discountValue: 1 })
        .expect(403);
    });

    it('validates eligibility publicly', async () => {
      const ok = await request(server)
        .post('/api/coupons/validate')
        .send({ code: code.toLowerCase(), subtotal: 200 })
        .expect(200);
      expect(ok.body).toMatchObject({ valid: true, discount: 20 });

      const tooSmall = await request(server)
        .post('/api/coupons/validate')
        .send({ code, subtotal: 10 })
        .expect(200);
      expect(tooSmall.body.valid).toBe(false);
      expect(tooSmall.body.reason).toMatch(/minimum/i);

      const unknown = await request(server)
        .post('/api/coupons/validate')
        .send({ code: 'P3UNKNOWN', subtotal: 100 })
        .expect(200);
      expect(unknown.body.valid).toBe(false);
    });

    it('applies the cap to a percentage discount', async () => {
      const response = await request(server)
        .post('/api/coupons/validate')
        .send({ code, subtotal: 1000 })
        .expect(200);

      // 10% of 1000 is 100, capped at 20.
      expect(response.body.discount).toBe(20);
    });

    it('lets an admin update and delete a coupon', async () => {
      await request(server)
        .put(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      const inactive = await request(server)
        .post('/api/coupons/validate')
        .send({ code, subtotal: 200 })
        .expect(200);
      expect(inactive.body.valid).toBe(false);

      await request(server)
        .delete(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('wishlist', () => {
    it('requires authentication', async () => {
      await request(server).get('/api/wishlist').expect(401);
    });

    it('adds, lists and removes a product', async () => {
      const created = await request(server)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId })
        .expect(201);
      expect(created.body.productId).toBe(productId);

      const list = await request(server)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].product.id).toBe(productId);

      await request(server)
        .delete(`/api/wishlist/product/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(204);
    });

    it('rejects duplicates and unknown products', async () => {
      await request(server)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId })
        .expect(201);
      await request(server)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId })
        .expect(409);
      await request(server)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: randomUUID() })
        .expect(404);
    });

    it('keeps each customer’s list separate', async () => {
      const mine = await request(server)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      const theirs = await request(server)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(mine.body).toHaveLength(1);
      expect(theirs.body).toHaveLength(0);
    });

    it('cannot delete another customer’s entry', async () => {
      const mine = await request(server)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      const entryId = mine.body[0].id as string;

      await request(server)
        .delete(`/api/wishlist/${entryId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      // Clean up for later tests.
      await request(server)
        .delete(`/api/wishlist/${entryId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(204);
    });
  });

  describe('reviews', () => {
    let reviewId: string;

    it('lists reviews publicly', async () => {
      const response = await request(server)
        .get(`/api/products/${productId}/reviews`)
        .expect(200);
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        averageRating: expect.any(Number),
      });
    });

    it('requires authentication to post', async () => {
      await request(server)
        .post(`/api/products/${productId}/reviews`)
        .send({ rating: 5 })
        .expect(401);
    });

    it('lets a customer review a product', async () => {
      const response = await request(server)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 5, title: 'Excellent', comment: 'Really good.' })
        .expect(201);

      reviewId = response.body.id as string;
      expect(response.body.rating).toBe(5);
    });

    it('rejects an out-of-range rating', async () => {
      await request(server)
        .post(`/api/products/${secondProductId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 9 })
        .expect(400);
    });

    it('rejects a second review of the same product', async () => {
      await request(server)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 3 })
        .expect(409);
    });

    it('reports the average rating', async () => {
      const response = await request(server)
        .get(`/api/products/${productId}/reviews`)
        .expect(200);
      expect(response.body.total).toBe(1);
      expect(response.body.averageRating).toBe(5);
    });

    it('lets the owner update their review', async () => {
      const response = await request(server)
        .patch(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 4 })
        .expect(200);
      expect(response.body.rating).toBe(4);
    });

    it('forbids another customer from changing it', async () => {
      await request(server)
        .patch(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ rating: 1 })
        .expect(403);
      await request(server)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('lets an admin moderate but not a customer', async () => {
      await request(server)
        .patch(`/api/reviews/${reviewId}/approval?approved=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(server)
        .patch(`/api/reviews/${reviewId}/approval?approved=false`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('lets the owner delete their review', async () => {
      await request(server)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(204);
    });
  });

  describe('orders and notifications', () => {
    it('raises a notification when an order is placed', async () => {
      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 2 })
        .expect(201);

      await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Ada Lovelace',
            line1: '1 Navy Way',
            city: 'Arlington',
          },
        })
        .expect(201);

      const notes = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(notes.body.items.some((n: { type: string }) => n.type === 'order')).toBe(true);
      expect(notes.body.unreadCount).toBeGreaterThan(0);
    });

    it('marks notifications read, scoped to the owner', async () => {
      const list = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      const id = list.body.items[0].id as string;

      await request(server)
        .patch(`/api/notifications/${id}/read`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      const marked = await request(server)
        .patch(`/api/notifications/${id}/read`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(marked.body.isRead).toBe(true);

      await request(server)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const after = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(after.body.unreadCount).toBe(0);
    });

    it('validates the checkout coupon through the shared rules', async () => {
      const repo = dataSource.getRepository(Coupon);
      const code = `P3ORDER${randomUUID().slice(0, 5).toUpperCase()}`;
      await repo.save(
        repo.create({
          code,
          discountType: DiscountType.PERCENTAGE,
          discountValue: '10.00',
          minOrderAmount: '10.00',
          isActive: true,
        }),
      );

      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: secondProductId, quantity: 1 })
        .expect(201);

      const order = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: { fullName: 'Ada', line1: '1 Navy Way', city: 'Arlington' },
          couponCode: code,
        })
        .expect(201);

      // 60.00 - 10%
      expect(Number(order.body.discount)).toBeCloseTo(6, 2);
      expect(Number(order.body.total)).toBeCloseTo(54, 2);

      // And the counter moved, proving checkout used the coupon row.
      const used = await repo.findOne({ where: { code } });
      expect(used?.usedCount).toBe(1);
    });
  });

  describe('payments', () => {
    let orderId: string;

    beforeAll(async () => {
      await request(server)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 1 })
        .expect(201);

      const order = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: { fullName: 'Ada', line1: '1 Navy Way', city: 'Arlington' },
        })
        .expect(201);
      orderId = order.body.id as string;
    });

    it('requires authentication', async () => {
      await request(server)
        .post('/api/payments/verify')
        .send({ orderId, method: 'cod' })
        .expect(401);
    });

    it('rejects an unknown order and an unknown method', async () => {
      await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: randomUUID(), method: 'cod' })
        .expect(404);

      await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId, method: 'bitcoin' })
        .expect(400);
    });

    it('will not let another customer pay the order', async () => {
      await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ orderId, method: 'cod' })
        .expect(404);
    });

    it('records a COD payment as pending without marking the order paid', async () => {
      const response = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId, method: 'cod' })
        .expect(200);

      expect(response.body.status).toBe('pending');
      expect(response.body.message).toMatch(/delivery/i);

      const order = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(order.body.status).toBe('pending');
    });

    it('records the order amount on the payment row', async () => {
      const payments = await request(server)
        .get(`/api/payments/order/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(payments.body.length).toBeGreaterThan(0);
      const order = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(payments.body[0].amount).toBe(order.body.total);
    });

    it('reports Stripe and PayPal as unconfigured when no keys are set', async () => {
      // Unset for the test run, so the endpoint must say so rather than
      // pretending the payment succeeded.
      const previousStripe = process.env.STRIPE_SECRET_KEY;
      const previousId = process.env.PAYPAL_CLIENT_ID;
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.PAYPAL_CLIENT_ID;

      try {
        await request(server)
          .post('/api/payments/verify')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ orderId, method: 'stripe', transactionId: 'pi_test' })
          .expect(503);

        await request(server)
          .post('/api/payments/verify')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ orderId, method: 'paypal', transactionId: 'PAY-1' })
          .expect(503);
      } finally {
        if (previousStripe) process.env.STRIPE_SECRET_KEY = previousStripe;
        if (previousId) process.env.PAYPAL_CLIENT_ID = previousId;
      }
    });

    it('lets an admin cancel a pending order and restores its stock', async () => {
      const stockBeforeCancellation = await dataSource
        .getRepository(Product)
        .findOneByOrFail({ id: productId });
      const orderBeforeCancellation = await dataSource
        .getRepository(Order)
        .findOneOrFail({ where: { id: orderId }, relations: { items: true } });
      const orderedQuantity = orderBeforeCancellation.items
        .filter((item) => item.productId === productId)
        .reduce((quantity, item) => quantity + item.quantity, 0);

      const response = await request(server)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      const product = await dataSource
        .getRepository(Product)
        .findOneByOrFail({ id: productId });
      expect(product.stock).toBe(stockBeforeCancellation.stock + orderedQuantity);
    });

    it('hides the payments of another customer', async () => {
      await request(server)
        .get(`/api/payments/order/${orderId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });
  });

  describe('admin reporting', () => {
    it('is closed to anonymous and customer callers', async () => {
      await request(server).get('/api/admin/stats').expect(401);
      await request(server)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
      await request(server)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('returns dashboard figures to an admin', async () => {
      const response = await request(server)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalRevenue: expect.any(Number),
        totalOrders: expect.any(Number),
        averageOrderValue: expect.any(Number),
        totalCustomers: expect.any(Number),
        totalProducts: expect.any(Number),
        pendingOrders: expect.any(Number),
        ordersByStatus: expect.any(Object),
        topProducts: expect.any(Array),
        lowStock: expect.any(Array),
      });
    });

    it('returns a continuous 14-day sales series', async () => {
      const response = await request(server)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const series = response.body.salesByDay as { date: string }[];
      expect(series).toHaveLength(14);
      // Dates must be unique and ascending so the chart axis is well formed.
      const dates = series.map((d) => d.date);
      expect(new Set(dates).size).toBe(14);
      expect([...dates].sort()).toEqual(dates);
    });

    it('lists customers for an admin', async () => {
      const response = await request(server)
        .get('/api/admin/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((u: { email: string }) => u.email === customerEmail)).toBe(true);
      // Password hashes must never be serialised.
      expect(response.body.every((u: { password?: string }) => u.password === undefined)).toBe(true);
    });

    it('hides inactive products publicly while keeping them in the admin catalog', async () => {
      const product = await dataSource
        .getRepository(Product)
        .findOneByOrFail({ id: productId });
      await dataSource.getRepository(Product).update(productId, { isActive: false });

      try {
        await request(server).get(`/api/products/${productId}`).expect(404);

        const listed = await request(server)
          .get('/api/admin/products')
          .query({ search: product.name })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        expect(listed.body.items.some((item: { id: string }) => item.id === productId)).toBe(
          true,
        );
      } finally {
        await dataSource.getRepository(Product).update(productId, { isActive: true });
      }
    });

    it('restricts order management to admins and validates allowed statuses', async () => {
      await request(server)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      const listed = await request(server)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(listed.body)).toBe(true);

      await request(server)
        .patch(`/api/admin/orders/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' })
        .expect(400);

      await request(server)
        .patch(`/api/admin/orders/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' })
        .expect(404);
    });
  });

  describe('health', () => {
    it('reports database connectivity without the API prefix', async () => {
      const response = await request(server).get('/health').expect(200);
      expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
    });
  });
});
