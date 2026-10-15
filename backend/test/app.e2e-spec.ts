import { type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { API_PREFIX } from './../src/common/api-prefix.js';
import { configureApp } from './../src/common/configure-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors `bootstrap()`, which is not executed by the test module above.
    configureApp(app);
    await app.init();
  });

  it(`/${API_PREFIX} (GET)`, () => {
    return request(app.getHttpServer())
      .get(`/${API_PREFIX}`)
      .expect(200)
      .expect('Hello World!');
  });

  it('does not serve the root path without the prefix', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
