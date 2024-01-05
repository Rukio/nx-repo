import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HealthDependency } from '../interfaces/health-dependency.interface';

/** The base functionality of health indicators. */
export abstract class BaseHealthIndicator
  extends HealthIndicator
  implements OnApplicationBootstrap
{
  /** The name of the health check indicator. */
  abstract indicatorName: string;

  /** Performs a test on the dependency to determine if it is healthy or not. */
  protected abstract testHealth(): Promise<HealthIndicatorResult>;

  constructor(
    private dependency: HealthDependency,
    private config: ConfigService
  ) {
    super();
  }

  /**
   * Setup for functionality after application has been fully initialized.
   *
   * Uses a NestJS lifecycle event method.
   */
  async onApplicationBootstrap() {
    // start dependency health monitoring
    if (this.config.get<string>('NODE_ENV') !== 'test') {
      await this.startInterval();
    }
  }

  /** Determines if the dependency is healthy. */
  async isHealthy(): Promise<HealthIndicatorResult> {
    // pull current state from dependency
    const isHealthy = await this.dependency.isHealthy();

    // if there is no current state, test the dependency
    // this should only happen at application startup if the health check endpoint is hit before the interval has completed.
    if (isHealthy === undefined) {
      return this.testHealth();
    }

    return isHealthy ? this.getHealthyResult() : this.getUnhealthyResult();
  }

  /** Retrieves a positive HealthIndicatorResult. */
  getHealthyResult(metadata?: Record<string, unknown>): HealthIndicatorResult {
    this.dependency.markAsHealthy();

    return this.getStatus(this.indicatorName, true, metadata);
  }

  /** Retrieves a negative HealthIndicatorResult. */
  getUnhealthyResult(
    metadata?: Record<string, unknown>
  ): HealthIndicatorResult {
    this.dependency.markAsUnhealthy();

    return this.getStatus(this.indicatorName, false, metadata);
  }

  /** Starts the interval to monitor dependency health. */
  @Interval(5 * 60 * 1000) // 5 minutes
  private async startInterval() {
    await this.testHealth();
  }
}
