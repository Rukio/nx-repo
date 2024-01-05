import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RedisModule } from '../nest-redis.module';

describe(`${RedisModule.name}`, () => {
  let app: INestApplication;
  let redisModule: RedisModule;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RedisModule.register({})],
    }).compile();

    redisModule = moduleRef.get<RedisModule>(RedisModule);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('init', () => {
    it('should be defined', () => {
      expect(redisModule).toBeDefined();
      expect(redisModule).toBeInstanceOf(RedisModule);
    });
  });
});
