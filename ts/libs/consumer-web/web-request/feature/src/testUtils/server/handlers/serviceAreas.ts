import { environment } from '@*company-data-covered*/station/data-access';
import { rest, RestHandler } from 'msw';

export const serviceAreasHandlers: RestHandler[] = [
  rest.get(
    `${environment.stationURL}/api/service_areas/zipcode/:zipcode/client_time/:clientTime`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(true));
    }
  ),
];
