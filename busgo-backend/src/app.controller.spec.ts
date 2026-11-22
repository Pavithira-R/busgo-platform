import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  async function build(execute: () => Promise<unknown>) {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDrizzleToken(), useValue: { execute: vi.fn(execute) } },
      ],
    }).compile();
    return app.get(AppController);
  }

  it('reports database up when the query succeeds', async () => {
    const controller = await build(() => Promise.resolve([]));
    await expect(controller.health()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports database down when the query fails', async () => {
    const controller = await build(() => Promise.reject(new Error('no db')));
    await expect(controller.health()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
