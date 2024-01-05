import {
  LEADS_PROVIDERS_API_PATH,
  environment,
  MOCK_PROVIDER_MARKETS,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { rest, RestHandler } from 'msw';

// TODO: [PE-2383] - ideally we use a func to build a url and we use that in the real thunk
export const LEADS_PROVIDER_MARKETS_INTERCEPT_URL = `${environment.serviceURL}${LEADS_PROVIDERS_API_PATH}/:id/markets`;

export const providerMarkets: RestHandler[] = [
  rest.get(`${LEADS_PROVIDER_MARKETS_INTERCEPT_URL}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ markets: MOCK_PROVIDER_MARKETS }));
  }),
];
