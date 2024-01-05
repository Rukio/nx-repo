import {
  environment,
  buildMarketPath,
  mockMarket,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { rest, RestHandler } from 'msw';

export const buildMarketsApiPath = () =>
  `${environment.serviceURL}${buildMarketPath(':marketId')}`;

export const marketsHandlers: RestHandler[] = [
  rest.get(buildMarketsApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockMarket }));
  }),
];
