import { rest, RestHandler } from 'msw';
import {
  CARE_REQUESTS_BASE_PATH,
  environment,
  mockCareRequestResult,
} from '@*company-data-covered*/station/data-access';

export const careRequestsHandlers: RestHandler[] = [
  rest.post(
    `${environment.stationURL}${CARE_REQUESTS_BASE_PATH}`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockCareRequestResult));
    }
  ),
];
