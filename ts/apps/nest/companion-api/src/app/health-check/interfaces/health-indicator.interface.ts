import { HealthIndicatorResult } from '@nestjs/terminus';

/** An interface to use internally for Companion health check indicator definition. */
export interface HealthIndicator {
  /** The name of the health check indicator. */
  indicatorName: string;

  /** Determines whether or not the service is healthy. */
  isHealthy(): Promise<HealthIndicatorResult>;

  /** Builds and returns a healthy result. */
  getHealthyResult(data?: Record<string, unknown>): HealthIndicatorResult;

  /** Builds and returns an unhealthy result. */
  getUnhealthyResult(data?: Record<string, unknown>): HealthIndicatorResult;
}
