import { Injectable } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { Logger } from 'winston';
import { DashboardHealthIndicator } from '../dashboard/dashboard.health';
import { DatabaseHealthIndicator } from '../database/database.health';
import { InjectLogger } from '../logger/logger.decorator';
import { RedisHealthIndicator } from '../redis';
import { HealthIndicator } from './interfaces/health-indicator.interface';

@Injectable()
export class HealthService {
  private readonly indicatorsToMonitor: HealthIndicator[];
  private readonly readinessMonitors: HealthIndicator[];
  private readonly livenessMonitors: HealthIndicator[];

  constructor(
    private health: HealthCheckService,
    dashboard: DashboardHealthIndicator,
    database: DatabaseHealthIndicator,
    redis: RedisHealthIndicator,
    @InjectLogger() private logger: Logger
  ) {
    this.indicatorsToMonitor = [dashboard, database, redis];
    this.readinessMonitors = [dashboard, database, redis];
    this.livenessMonitors = [database, redis];
  }

  @HealthCheck()
  public async check(): Promise<HealthCheckResult | undefined> {
    const healthCheckResult = this.checkMonitors(this.indicatorsToMonitor);

    this.logger.info('Health Check', healthCheckResult);

    return healthCheckResult;
  }

  @HealthCheck()
  public async liveness(): Promise<HealthCheckResult | undefined> {
    const healthCheckResult = this.checkMonitors(this.livenessMonitors);

    this.logger.info('Liveness Check', healthCheckResult);

    return healthCheckResult;
  }

  @HealthCheck()
  public async readiness(): Promise<HealthCheckResult | undefined> {
    const healthCheckResult = this.checkMonitors(this.readinessMonitors);

    this.logger.info('Readiness Check', healthCheckResult);

    return healthCheckResult;
  }

  private async checkMonitors(
    monitors: HealthIndicator[]
  ): Promise<HealthCheckResult | undefined> {
    return this.health.check(
      monitors.map((indicator: HealthIndicator) => async () => {
        try {
          const isHealthy = await indicator.isHealthy();

          if (isHealthy[indicator.indicatorName].status === 'up') {
            return isHealthy;
          }
          throw new HealthCheckError(indicator.indicatorName, isHealthy);
        } catch (error) {
          throw new HealthCheckError(
            indicator.indicatorName,
            indicator.getUnhealthyResult({ error })
          );
        }
      })
    );
  }
}
