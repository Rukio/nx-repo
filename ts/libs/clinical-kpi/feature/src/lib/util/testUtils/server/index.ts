import { setupServer } from 'msw/node';
import {
  metricsHandlers,
  userHandlers,
  marketProvidersMetricsHandlers,
  providerOverallMetrics,
  providerMarkets,
  providerVisits,
} from './handlers';
const server = setupServer(
  ...[
    ...userHandlers,
    ...metricsHandlers,
    ...marketProvidersMetricsHandlers,
    ...providerOverallMetrics,
    ...providerMarkets,
    ...providerVisits,
  ]
);

export { server };
