import {
  environment,
  mockZipCodeDetails,
  ZIP_CODES_BASE_PATH,
} from '@*company-data-covered*/station/data-access';
import { rest, RestHandler } from 'msw';

export const ZIP_CODE_DETAILS_INTERCEPT_URL = `${environment.stationURL}${ZIP_CODES_BASE_PATH}`;

export const zipCodesHandlers: RestHandler[] = [
  rest.get(ZIP_CODE_DETAILS_INTERCEPT_URL, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockZipCodeDetails));
  }),
];
