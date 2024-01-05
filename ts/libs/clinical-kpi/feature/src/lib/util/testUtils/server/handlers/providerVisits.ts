import { rest, RestHandler } from 'msw';
import {
  LEADER_HUB_PROVIDERS_API_PATH,
  environment,
  mockedVisitsResponse,
} from '@*company-data-covered*/clinical-kpi/data-access';

export const LEADS_PROVIDER_VISITS_INTERCEPT_URL = `${environment.serviceURL}${LEADER_HUB_PROVIDERS_API_PATH}/:id/visits`;

export const providerVisits: RestHandler[] = [
  rest.get(`${LEADS_PROVIDER_VISITS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedVisitsResponse));
  }),
];
