import { Injectable } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { Logger } from 'winston';

import { HealthIndicator } from './interfaces/health-indicator.interface';
import { InjectLogger } from '../decorators/logger.decorator';
import ClientConfigHealthIndicator from '../client-config/client-config.health';

@Injectable()
export default class HealthService {
  private readonly indicatorsToMonitor: HealthIndicator[];

  constructor(
    private health: HealthCheckService,
    clientConfig: ClientConfigHealthIndicator,
    @InjectLogger() private logger: Logger
  ) {
    this.indicatorsToMonitor = [clientConfig];
  }

  @HealthCheck()
  public async check(): Promise<HealthCheckResult | undefined> {
    const healthCheckResult = await this.health.check(
      this.indicatorsToMonitor.map((indicator: HealthIndicator) => async () => {
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

    this.logger.info('Health Check', healthCheckResult);

    return healthCheckResult;
  }
}
