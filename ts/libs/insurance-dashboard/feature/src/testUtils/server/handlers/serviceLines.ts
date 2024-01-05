import { rest, RestHandler } from 'msw';
import {
  SERVICE_LINES_API_PATH,
  environment,
  mockedServiceLinesList,
} from '@*company-data-covered*/insurance/data-access';

export const serviceLinesHandlers: RestHandler[] = [
  rest.get(
    `${environment.serviceURL}${SERVICE_LINES_API_PATH}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ serviceLines: mockedServiceLinesList })
      );
    }
  ),
];
