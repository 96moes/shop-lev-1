import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  /** Minimal stand-in; the health probe only needs `query` to resolve. */
  const dataSource = {
    query: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('reports ok when the database answers', async () => {
      await expect(appController.health()).resolves.toMatchObject({
        status: 'ok',
        database: 'up',
      });
    });

    it('reports degraded when the database is unreachable', async () => {
      dataSource.query.mockRejectedValueOnce(new Error('connection refused'));

      await expect(appController.health()).resolves.toMatchObject({
        status: 'degraded',
        database: 'down',
      });
    });
  });
});
