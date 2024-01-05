import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { HealthIndicator } from '../health-check/interfaces/health-indicator.interface';
import { BaseHealthIndicator } from '../health-check/indicators/base.health';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { InjectRedis } from './common';
import Redis from 'ioredis';

export const REDIS_HEALTH_CHECK_KEY = 'redis';

/**
 * A health indicator for Redis.
 *
 * @augments BaseHealthIndicator
 * @implements {HealthIndicator}
 */
@Injectable()
export class RedisHealthIndicator
  extends BaseHealthIndicator
  implements HealthIndicator, OnModuleDestroy
{
  public readonly indicatorName = REDIS_HEALTH_CHECK_KEY;

  constructor(
    config: ConfigService,
    @Inject(CACHE_MANAGER) cache: Cache,
    @InjectRedis() private readonly redis: Redis
  ) {
    super(
      {
        healthCheckKey: REDIS_HEALTH_CHECK_KEY,
        isHealthy: async () => cache.get<boolean>(REDIS_HEALTH_CHECK_KEY),
        markAsHealthy: async () => {
          await cache.set<boolean>(REDIS_HEALTH_CHECK_KEY, true, { ttl: 0 });
        },
        markAsUnhealthy: async () => {
          await cache.set<boolean>(REDIS_HEALTH_CHECK_KEY, false, { ttl: 0 });
        },
      },
      config
    );
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  protected async testHealth() {
    try {
      const response = await this.redis.ping();

      if (response !== 'PONG') {
        return this.getUnhealthyResult();
      }

      return this.getHealthyResult();
    } catch (error) {
      return this.getUnhealthyResult();
    }
  }
}
