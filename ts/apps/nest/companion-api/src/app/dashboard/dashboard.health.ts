import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HttpHealthIndicator } from '@nestjs/terminus';
import { DashboardService } from './dashboard.service';
import { HealthIndicator } from '../health-check/interfaces/health-indicator.interface';
import { BaseHealthIndicator } from '../health-check/indicators/base.health';
import { ConfigService } from '@nestjs/config';

/**
 * A health indicator for Dashboard API.
 *
 * @augments BaseHealthIndicator
 * @implements {HealthIndicator}
 */
@Injectable()
export class DashboardHealthIndicator
  extends BaseHealthIndicator
  implements HealthIndicator
{
  public readonly indicatorName = 'dashboard';

  constructor(
    private dashboard: DashboardService,
    private http: HttpHealthIndicator,
    config: ConfigService
  ) {
    super(dashboard, config);
  }

  protected async testHealth(): Promise<HealthIndicatorResult> {
    return this.http
      .pingCheck(this.indicatorName, `${this.dashboard.basePath}/health-check`)
      .catch(() => {
        return {
          [this.indicatorName]: {
            status: 'down',
          },
        };
      });
  }
}
