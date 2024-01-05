import { rest, RestHandler } from 'msw';
import {
  mockedServiceLine,
  mockedServiceLinesList,
  environment,
} from '@*company-data-covered*/station/data-access';

export const serviceLinesHandlers: RestHandler[] = [
  rest.get(`${environment.stationURL}/api/service_lines`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedServiceLinesList));
  }),
  rest.get(
    `${environment.stationURL}/api/service_lines/:serviceLineId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedServiceLine));
    }
  ),
];
