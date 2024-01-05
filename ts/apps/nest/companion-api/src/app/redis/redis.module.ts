import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import { RedisHealthIndicator } from './redis.health';
import { getRequiredEnvironmentVariable } from '../utility/utils';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_OPTIONS_TOKEN, IOREDIS_CLIENT_TOKEN } from './common';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_OPTIONS_TOKEN,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const urlString = getRequiredEnvironmentVariable('REDIS_URL', config);
        const {
          username,
          password,
          port,
          hostname,
          pathname: path,
        } = new URL(urlString);

        return {
          username,
          password,
          host: hostname,
          port: port ? Number(port) : undefined,
          path,
        };
      },
    },
    {
      provide: IOREDIS_CLIENT_TOKEN,
      inject: [REDIS_OPTIONS_TOKEN],
      useFactory: async (opts: RedisOptions) => new Redis(opts),
    },
  ],
  exports: [IOREDIS_CLIENT_TOKEN, REDIS_OPTIONS_TOKEN],
})
export class RedisModule {}

@Module({
  imports: [
    CacheModule.registerAsync({ useClass: CacheConfigService }),
    ConfigModule,
    RedisModule,
  ],
  providers: [RedisHealthIndicator],
  exports: [RedisHealthIndicator],
})
export class RedisHealthModule {}
