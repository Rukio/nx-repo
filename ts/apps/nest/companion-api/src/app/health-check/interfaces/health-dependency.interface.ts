/** The contract necessary to fulfill if a service is a dependency of this application. */
export interface HealthDependency {
  /** The cache key that will be used to store health information. */
  readonly healthCheckKey: string;

  /**
   * Returns a flag indicating if the service is healthy.
   *
   * If it returns undefined, the health of the dependency has not been determined.
   */
  isHealthy(): Promise<boolean | undefined>;

  /** Marks the service as healthy. */
  markAsHealthy(): Promise<void>;

  /** Marks the service as unhealthy */
  markAsUnhealthy(): Promise<void>;
}
