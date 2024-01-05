import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { IOREDIS_CLIENT_TOKEN } from './common';
import {
  RedisConfigurableModuleClass,
  REDIS_MODULE_OPTIONS_TOKEN,
} from './redis.module-definition';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IOREDIS_CLIENT_TOKEN,
      inject: [REDIS_MODULE_OPTIONS_TOKEN],
      useFactory: async (opts: RedisOptions) => new Redis(opts),
    },
  ],
  exports: [IOREDIS_CLIENT_TOKEN, REDIS_MODULE_OPTIONS_TOKEN],
})
export class RedisModule extends RedisConfigurableModuleClass {}
