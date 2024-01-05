import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Prisma, PrismaClient } from '@prisma/client';
import { Cache } from 'cache-manager';
import { HealthDependency } from '../health-check/interfaces/health-dependency.interface';
import { DatadogService } from '@*company-data-covered*/nest-datadog';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, HealthDependency
{
  readonly healthCheckKey = 'Database:Healthy';

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private datadog: DatadogService
  ) {
    super();
  }

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'test') {
      await this.$connect();
      this.$use(this.metricsMiddleware);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async markAsHealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, true, { ttl: 0 });
  }

  async markAsUnhealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, false, { ttl: 0 });
  }

  async isHealthy(): Promise<boolean | undefined> {
    return this.cache.get<boolean>(this.healthCheckKey);
  }

  metricsMiddleware: Prisma.Middleware = async (params, next) => {
    const start = Date.now();

    const result = await next(params);

    const { model, action } = params;
    const latency = Date.now() - start;
    const tags = { model: model ?? 'N/A', action };

    this.datadog.histogram('database', latency, tags);

    return result;
  };
}
