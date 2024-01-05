import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator } from '../health-check/interfaces/health-indicator.interface';
import BaseHealthIndicator from '../health-check/indicators/base.health';
import ClientConfigService from './client-config.service';

/**
 * A health indicator for Dashboard API.
 *
 * @augments BaseHealthIndicator
 * @implements {HealthIndicator}
 */

@Injectable()
export default class ClientConfigHealthIndicator
  extends BaseHealthIndicator
  implements HealthIndicator
{
  public readonly indicatorName = 'client-config';

  constructor(
    private clientConfig: ClientConfigService,
    private http: HttpHealthIndicator,
    private configService: ConfigService,
    config: ConfigService
  ) {
    super(clientConfig, config);
  }

  protected async testHealth(): Promise<HealthIndicatorResult> {
    return this.http
      .pingCheck(
        this.indicatorName,
        `${this.clientConfig.basePath}/health-check`
      )
      .catch(() => {
        return {
          [this.indicatorName]: {
            status: 'down',
          },
        };
      });
  }
}
