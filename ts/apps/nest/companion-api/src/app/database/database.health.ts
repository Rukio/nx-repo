import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { HealthIndicator } from '../health-check/interfaces/health-indicator.interface';
import { BaseHealthIndicator } from '../health-check/indicators/base.health';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * A health indicator for the Companion database.
 *
 * @augments BaseHealthIndicator
 * @implements {HealthIndicator}
 */
@Injectable()
export class DatabaseHealthIndicator
  extends BaseHealthIndicator
  implements HealthIndicator
{
  public readonly indicatorName = 'database';

  constructor(private database: DatabaseService, config: ConfigService) {
    super(database, config);
  }

  protected async testHealth() {
    try {
      const isHealthy = (await this.database.$executeRaw`SELECT 1`) === 1;

      return isHealthy ? this.getHealthyResult() : this.getUnhealthyResult();
    } catch (error) {
      const metadata: Record<string, unknown> = {};

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        metadata.prismaCode = error.code;
        metadata.message = error.message;
      }

      return this.getUnhealthyResult(metadata);
    }
  }
}
