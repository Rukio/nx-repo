import { rest, RestHandler } from 'msw';
import { mockedMarket, environment } from '@*company-data-covered*/station/data-access';

export const marketsHandlers: RestHandler[] = [
  rest.get(`${environment.stationURL}/api/markets`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(
        Array.from(Array(15)).map((_, index) => ({
          ...mockedMarket,
          id: mockedMarket.id + index,
          name: `${mockedMarket.name} - ${index}`,
        }))
      )
    );
  }),
  rest.get(
    `${environment.stationURL}/api/markets/:marketId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedMarket));
    }
  ),
];
