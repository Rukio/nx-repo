import { rest, RestHandler } from 'msw';
import {
  environment,
  CURRENT_USER_BASE_PATH,
  mockedAuthenticatedUser,
} from '@*company-data-covered*/clinical-kpi/data-access';

export const USER_INTERCEPT_URL = `${environment.serviceURL}${CURRENT_USER_BASE_PATH}`;

export const userHandlers: RestHandler[] = [
  rest.get(USER_INTERCEPT_URL, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ user: mockedAuthenticatedUser }));
  }),
];
