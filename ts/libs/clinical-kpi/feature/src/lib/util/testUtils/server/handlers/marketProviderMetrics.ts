import { rest, RestHandler } from 'msw';
import {
  environment,
  MARKET_PROVIDER_METRICS_API_PATCH,
  MOCK_PROVIDER_LEADER_HUB_METRICS_RESPONSE,
  MOCK_PROVIDER_METRICS_RESPONSE,
} from '@*company-data-covered*/clinical-kpi/data-access';

export const MARKET_PROVIDER_METRICS_INTERCEPT_URL = `${environment.serviceURL}${MARKET_PROVIDER_METRICS_API_PATCH}`;

export const marketProvidersMetricsHandlers: RestHandler[] = [
  rest.get(MARKET_PROVIDER_METRICS_INTERCEPT_URL, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(MOCK_PROVIDER_METRICS_RESPONSE));
  }),
  rest.get(`${MARKET_PROVIDER_METRICS_INTERCEPT_URL}/:id`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(MOCK_PROVIDER_LEADER_HUB_METRICS_RESPONSE)
    );
  }),
];
