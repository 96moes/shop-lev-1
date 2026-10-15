import {
  Body,
  Controller,
  Module,
  Post,
  type INestApplication,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from './configure-app.js';
import { CreateProductDto } from '../modules/products/dto/create-product.dto.js';

/**
 * Throwaway controller: validation is enforced by the global pipe installed in
 * `configureApp`, so the real DTO can be exercised without adding an
 * unimplemented endpoint to the application. The endpoint itself is a stub.
 */
@Controller('validation-probe')
class ValidationProbeController {
  @Post()
  create(@Body() dto: CreateProductDto): { received: CreateProductDto } {
    return { received: dto };
  }
}

@Module({ controllers: [ValidationProbeController] })
class ValidationProbeModule {}

describe('ValidationPipe (unit)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ValidationProbeModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid payload and coerces declared types', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ name: 'Desk Lamp', price: '49.99', stock: '3' })
      .expect(201);

    // Numbers arrive as strings in JSON but must be transformed to numbers.
    expect(response.body.received.price).toBe(49.99);
    expect(response.body.received.stock).toBe(3);
  });

  it('rejects a payload with a missing required field', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ price: 10 })
      .expect(400);

    // Messages name the offending field in Persian, because they are shown
    // directly to Persian-speaking users.
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('نام محصول')]),
    );
  });

  it('rejects wrong types and out-of-range values', async () => {
    await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ name: 'X', price: -5 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ name: 'Desk Lamp', price: 'not-a-number' })
      .expect(400);
  });

  it('rejects unknown properties instead of silently accepting them', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({ name: 'Desk Lamp', price: 10, isAdmin: true })
      .expect(400);

    // Field names stay as sent so the client can map the error to its input.
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('isAdmin')]),
    );
  });
});
