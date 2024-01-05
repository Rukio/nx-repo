import {
  environment,
  METRICS_PROVIDERS_API_PATH,
  METRICS_MARKETS_API_PATH,
  MARKET_OVERALL_METRICS_API_PATH,
  mockedProviderMetrics,
  mockedMarketMetrics,
  MARKET_METRICS,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { rest, RestHandler } from 'msw';

export const PROVIDER_METRICS_INTERCEPT_URL = `${environment.serviceURL}${METRICS_PROVIDERS_API_PATH}/:id`;
export const MARKET_METRICS_INTERCEPT_URL = `${environment.serviceURL}${METRICS_MARKETS_API_PATH}/:id`;
export const MARKET_OVERALL_METRICS_INTERCEPT_URL = `${environment.serviceURL}${MARKET_OVERALL_METRICS_API_PATH}/:id`;

export const metricsHandlers: RestHandler[] = [
  rest.get(`${PROVIDER_METRICS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ metrics: mockedProviderMetrics }));
  }),
  rest.get(`${MARKET_METRICS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedMarketMetrics));
  }),
  rest.get(`${MARKET_OVERALL_METRICS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ marketMetrics: MARKET_METRICS }));
  }),
];
