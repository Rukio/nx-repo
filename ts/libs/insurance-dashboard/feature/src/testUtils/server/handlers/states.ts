import { rest, RestHandler } from 'msw';
import {
  environment,
  STATES_API_PATH,
  mockedStates,
} from '@*company-data-covered*/insurance/data-access';

export const statesHandlers: RestHandler[] = [
  rest.get(`${environment.serviceURL}${STATES_API_PATH}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ states: mockedStates }));
  }),
];
