import {
  METRICS_LEADER_HUB_PROVIDERS_API_PATH,
  LEADER_HUB_PROVIDERS_API_PATH,
  environment,
  mockedLeaderHubIndividualProviderMetrics,
  mockedProviderShifts,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { rest, RestHandler } from 'msw';

export const LEADS_PROVIDER_OVERALL_METRICS_INTERCEPT_URL = `${environment.serviceURL}${METRICS_LEADER_HUB_PROVIDERS_API_PATH}/:id`;

export const LEADS_PROVIDER_SHIFTS_INTERCEPT_URL = `${environment.serviceURL}${LEADER_HUB_PROVIDERS_API_PATH}/:id/shifts`;

export const providerOverallMetrics: RestHandler[] = [
  rest.get(
    `${LEADS_PROVIDER_OVERALL_METRICS_INTERCEPT_URL}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ providerMetrics: mockedLeaderHubIndividualProviderMetrics })
      );
    }
  ),
  rest.get(`${LEADS_PROVIDER_SHIFTS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedProviderShifts));
  }),
];
