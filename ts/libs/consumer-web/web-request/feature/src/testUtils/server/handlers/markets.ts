import {
  environment,
  MARKETS_BASE_PATH,
  mockedMarket,
} from '@*company-data-covered*/station/data-access';
import { rest, RestHandler } from 'msw';

export const MARKET_DETAILS_INTERCEPT_URL = `${environment.stationURL}${MARKETS_BASE_PATH}/:marketId`;

export const marketsHandlers: RestHandler[] = [
  rest.get(MARKET_DETAILS_INTERCEPT_URL, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedMarket));
  }),
];
